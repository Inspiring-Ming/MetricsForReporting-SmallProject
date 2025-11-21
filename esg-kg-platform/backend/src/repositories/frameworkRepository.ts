import { GraphDBRepository } from './graphDBRepository';
import {
  FrameworkDTO,
  FrameworkDetailDTO,
  CategoryDTO,
  GetFrameworksRequest,
  CreateFrameworkRequest,
  UpdateFrameworkRequest
} from '../types/kg';
import { GraphDBQueryError, NotFoundError, ValidationError, DeleteConflictError } from '../types/errors';

/**
 * Framework Repository - 专门处理报告框架相关的 SPARQL 查询和数据操作
 */
export class FrameworkRepository {
  private graphDB: GraphDBRepository;
  private readonly prefix = `
    PREFIX esg: <http://example.org/esg#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  `;

  constructor(graphDB?: GraphDBRepository) {
    this.graphDB = graphDB || new GraphDBRepository();
  }

  /**
   * 获取报告框架列表（支持分页和搜索）
   */
  async getFrameworks(params: GetFrameworksRequest): Promise<{ frameworks: FrameworkDTO[], total: number }> {
    const { page = 1, size = 10, search, industry, sort = 'label', order = 'asc' } = params;
    const offset = (page - 1) * size;

    // 构建搜索过滤条件
    const searchFilter = search
      ? `FILTER(CONTAINS(LCASE(?label), LCASE("${this.escapeSparql(search)}")))`
      : '';

    // 构建行业过滤条件
    const industryFilter = industry
      ? `?industryEntity esg:reportsUsing ?framework .
         ?industryEntity rdfs:label "${this.escapeSparql(industry)}" .`
      : '';

    // 构建排序条件
    const orderClause = order === 'desc' ? 'DESC' : '';
    const sortVar = sort === 'createdAt' ? '?createdAt' : '?label';

    const query = `
      ${this.prefix}
      
      SELECT DISTINCT ?framework ?label
      WHERE {
        ?framework a esg:ReportingFramework ;
                   rdfs:label ?label .
        ${industryFilter}
        ${searchFilter}
      }
      ORDER BY ${orderClause}(${sortVar})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    // 获取总数
    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?framework) AS ?count)
      WHERE {
        ?framework a esg:ReportingFramework ;
                   rdfs:label ?label .
        ${industryFilter}
        ${searchFilter}
      }
    `;

    try {
      const [resultData, countData] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      const frameworks: FrameworkDTO[] = resultData.results.bindings.map((binding: any) => ({
        iri: binding.framework.value,
        label: binding.label.value
      }));

      const total = parseInt(countData.results.bindings[0]?.count?.value || '0', 10);

      return { frameworks, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch frameworks', { originalError: error });
    }
  }

  /**
   * 根据 ID 获取报告框架详情
   */
  async getFrameworkById(id: string): Promise<FrameworkDetailDTO> {
    const frameworkUri = this.resolveFrameworkUri(id);

    const query = `
      ${this.prefix}
      
      SELECT ?label ?sourceDocument ?category ?categoryLabel
      WHERE {
        <${frameworkUri}> a esg:ReportingFramework ;
                          rdfs:label ?label .
        OPTIONAL { <${frameworkUri}> esg:sourceDocument ?sourceDocument . }
        OPTIONAL { 
          <${frameworkUri}> esg:includes ?category .
          ?category rdfs:label ?categoryLabel .
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Framework not found: ${id}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      // 收集所有的分类
      const categories = bindings
        .filter((b: any) => b.category)
        .map((b: any) => ({
          iri: b.category.value,
          label: b.categoryLabel.value
        }));

      const framework: FrameworkDetailDTO = {
        iri: frameworkUri,
        label: firstBinding.label.value,
        sourceDocument: firstBinding.sourceDocument?.value,
        categories: categories.length > 0 ? categories : undefined
      };

      return framework;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch framework: ${id}`, { originalError: error });
    }
  }

  /**
   * 创建新报告框架
   */
  async createFramework(data: CreateFrameworkRequest): Promise<{ iri: string, label: string }> {
    const { label, sourceDocument, categories } = data;

    // 验证 label 唯一性
    await this.validateUniqueLabelForCreate(label);

    // 生成 URI
    const frameworkUri = this.generateFrameworkUri(label);

    // 验证分类 URIs
    if (categories && categories.length > 0) {
      await this.validateCategoryUris(categories);
    }

    // 构建 INSERT 语句
    let insertTriples = `
      <${frameworkUri}> a esg:ReportingFramework ;
                        rdfs:label "${this.escapeSparql(label)}" .
    `;

    if (sourceDocument) {
      insertTriples += `
      <${frameworkUri}> esg:sourceDocument "${this.escapeSparql(sourceDocument)}" .
      `;
    }

    if (categories && categories.length > 0) {
      categories.forEach(categoryUri => {
        insertTriples += `
        <${frameworkUri}> esg:includes <${categoryUri}> .
        `;
      });
    }

    const query = `
      ${this.prefix}
      
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(query);
      return { iri: frameworkUri, label };
    } catch (error) {
      throw new GraphDBQueryError('Failed to create framework', { originalError: error });
    }
  }

  /**
   * 更新报告框架
   */
  async updateFramework(id: string, data: UpdateFrameworkRequest): Promise<{ iri: string, label: string }> {
    const frameworkUri = this.resolveFrameworkUri(id);
    const { label, sourceDocument, categories } = data;

    // 验证框架是否存在
    await this.verifyFrameworkExists(frameworkUri);

    // 如果更新 label，验证唯一性
    if (label) {
      await this.validateUniqueLabelForUpdate(frameworkUri, label);
    }

    // 验证分类 URIs
    if (categories && categories.length > 0) {
      await this.validateCategoryUris(categories);
    }

    // 构建 DELETE 和 INSERT 语句
    let deleteClause = '';
    let insertClause = '';

    if (label) {
      deleteClause += `
        <${frameworkUri}> rdfs:label ?oldLabel .
      `;
      insertClause += `
        <${frameworkUri}> rdfs:label "${this.escapeSparql(label)}" .
      `;
    }

    if (sourceDocument !== undefined) {
      deleteClause += `
        <${frameworkUri}> esg:sourceDocument ?oldSourceDocument .
      `;
      if (sourceDocument) {
        insertClause += `
          <${frameworkUri}> esg:sourceDocument "${this.escapeSparql(sourceDocument)}" .
        `;
      }
    }

    if (categories !== undefined) {
      deleteClause += `
        <${frameworkUri}> esg:includes ?oldCategory .
      `;
      if (categories.length > 0) {
        const categoryInserts = categories
          .map(iri => `<${frameworkUri}> esg:includes <${iri}> .`)
          .join('\n        ');
        insertClause += `
          ${categoryInserts}
        `;
      }
    }

    if (!deleteClause && !insertClause) {
      throw new ValidationError('No fields to update');
    }

    const query = `
      ${this.prefix}
      
      DELETE {
        ${deleteClause}
      }
      INSERT {
        ${insertClause}
      }
      WHERE {
        <${frameworkUri}> a esg:ReportingFramework .
        OPTIONAL { <${frameworkUri}> rdfs:label ?oldLabel . }
        OPTIONAL { <${frameworkUri}> esg:sourceDocument ?oldSourceDocument . }
        OPTIONAL { <${frameworkUri}> esg:includes ?oldCategory . }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(query);
      return { iri: frameworkUri, label: label || '' };
    } catch (error) {
      throw new GraphDBQueryError('Failed to update framework', { originalError: error });
    }
  }

  /**
   * 删除报告框架
   */
  async deleteFramework(id: string, force: boolean = false): Promise<{ iri: string, deleted: boolean }> {
    const frameworkUri = this.resolveFrameworkUri(id);

    // 验证框架是否存在
    await this.verifyFrameworkExists(frameworkUri);

    // 检查是否有行业引用此框架
    if (!force) {
      await this.checkFrameworkReferences(frameworkUri);
    }

    // 删除框架及其所有关联
    const query = `
      ${this.prefix}
      
      DELETE {
        <${frameworkUri}> ?p ?o .
        ?s ?p2 <${frameworkUri}> .
      }
      WHERE {
        {
          <${frameworkUri}> ?p ?o .
        }
        UNION
        {
          ?s ?p2 <${frameworkUri}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(query);
      return { iri: frameworkUri, deleted: true };
    } catch (error) {
      throw new GraphDBQueryError('Failed to delete framework', { originalError: error });
    }
  }

  /**
   * 获取框架的分类列表
   */
  async getFrameworkCategories(id: string): Promise<CategoryDTO[]> {
    const frameworkUri = this.resolveFrameworkUri(id);

    // 验证框架是否存在
    await this.verifyFrameworkExists(frameworkUri);

    const query = `
      ${this.prefix}
      
      SELECT ?category ?label
      WHERE {
        <${frameworkUri}> esg:includes ?category .
        ?category rdfs:label ?label .
      }
      ORDER BY ?label
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      return result.results.bindings.map((binding: any) => ({
        iri: binding.category.value,
        label: binding.label.value
      }));
    } catch (error) {
      throw new GraphDBQueryError(`Failed to fetch categories for framework: ${id}`, { originalError: error });
    }
  }

  /**
   * 添加分类到框架
   */
  async addCategoriesToFramework(id: string, categoryUris: string[]): Promise<CategoryDTO[]> {
    const frameworkUri = this.resolveFrameworkUri(id);

    // 验证框架是否存在
    await this.verifyFrameworkExists(frameworkUri);

    // 验证分类 URIs
    await this.validateCategoryUris(categoryUris);

    // 构建 INSERT 语句
    const insertTriples = categoryUris
      .map(iri => `<${frameworkUri}> esg:includes <${iri}> .`)
      .join('\n        ');

    const query = `
      ${this.prefix}
      
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(query);

      // 获取添加的分类详情
      return await this.getCategoriesByUris(categoryUris);
    } catch (error) {
      throw new GraphDBQueryError('Failed to add categories to framework', { originalError: error });
    }
  }

  /**
   * 从框架删除分类
   */
  async removeCategoryFromFramework(id: string, categoryId: string): Promise<{ iri: string, removed: boolean }> {
    const frameworkUri = this.resolveFrameworkUri(id);
    const categoryUri = this.resolveCategoryUri(categoryId);

    // 验证框架是否存在
    await this.verifyFrameworkExists(frameworkUri);

    const query = `
      ${this.prefix}
      
      DELETE {
        <${frameworkUri}> esg:includes <${categoryUri}> .
      }
      WHERE {
        <${frameworkUri}> esg:includes <${categoryUri}> .
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(query);
      return { iri: categoryUri, removed: true };
    } catch (error) {
      throw new GraphDBQueryError('Failed to remove category from framework', { originalError: error });
    }
  }

  // ============== 辅助方法 ==============

  /**
   * 解析框架 URI
   */
  private resolveFrameworkUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    if (id.startsWith('esg:')) {
      return `http://example.org/esg#${id.substring(4)}`;
    }
    return `http://example.org/esg#${id}`;
  }

  /**
   * 解析分类 URI
   */
  private resolveCategoryUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    if (id.startsWith('esg:')) {
      return `http://example.org/esg#${id.substring(4)}`;
    }
    return `http://example.org/esg#${id}`;
  }

  /**
   * 生成框架 URI
   */
  private generateFrameworkUri(label: string): string {
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    return `http://example.org/esg#${id}`;
  }

  /**
   * 验证框架是否存在
   */
  private async verifyFrameworkExists(iri: string): Promise<void> {
    const query = `
      ${this.prefix}
      ASK { <${iri}> a esg:ReportingFramework . }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (!result.boolean) {
        throw new NotFoundError(`Framework not found: ${iri}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to verify framework existence', { originalError: error });
    }
  }

  /**
   * 验证创建时 label 唯一性
   */
  private async validateUniqueLabelForCreate(label: string): Promise<void> {
    const query = `
      ${this.prefix}
      ASK {
        ?framework a esg:ReportingFramework ;
                   rdfs:label "${this.escapeSparql(label)}" .
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.boolean) {
        throw new ValidationError(`Framework with label "${label}" already exists`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate framework label', { originalError: error });
    }
  }

  /**
   * 验证更新时 label 唯一性
   */
  private async validateUniqueLabelForUpdate(iri: string, label: string): Promise<void> {
    const query = `
      ${this.prefix}
      ASK {
        ?framework a esg:ReportingFramework ;
                   rdfs:label "${this.escapeSparql(label)}" .
        FILTER(?framework != <${iri}>)
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.boolean) {
        throw new ValidationError(`Framework with label "${label}" already exists`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate framework label', { originalError: error });
    }
  }

  /**
   * 验证分类 URIs
   */
  private async validateCategoryUris(iris: string[]): Promise<void> {
    const iriList = iris.map(iri => `<${iri}>`).join(' ');

    const query = `
      ${this.prefix}
      SELECT ?iri
      WHERE {
        VALUES ?iri { ${iriList} }
        FILTER NOT EXISTS { ?iri a esg:Category . }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.results.bindings.length > 0) {
        const invalidUris = result.results.bindings.map((b: any) => b.iri.value);
        throw new ValidationError(`Invalid category URIs: ${invalidUris.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate category URIs', { originalError: error });
    }
  }

  /**
   * 检查框架引用
   */
  private async checkFrameworkReferences(iri: string): Promise<void> {
    const query = `
      ${this.prefix}
      SELECT ?industry ?label
      WHERE {
        ?industry esg:reportsUsing <${iri}> ;
                  rdfs:label ?label .
      }
      LIMIT 1
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.results.bindings.length > 0) {
        const industry = result.results.bindings[0];
        throw new DeleteConflictError(
          `Cannot delete framework: it is referenced by industry "${industry.label.value}"`,
          { frameworkUri: iri, industryUri: industry.industry.value }
        );
      }
    } catch (error) {
      if (error instanceof DeleteConflictError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check framework references', { originalError: error });
    }
  }

  /**
   * 根据 URIs 获取分类信息
   */
  private async getCategoriesByUris(iris: string[]): Promise<CategoryDTO[]> {
    const iriList = iris.map(iri => `<${iri}>`).join(' ');

    const query = `
      ${this.prefix}
      SELECT ?category ?label
      WHERE {
        VALUES ?category { ${iriList} }
        ?category rdfs:label ?label .
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      return result.results.bindings.map((binding: any) => ({
        iri: binding.category.value,
        label: binding.label.value
      }));
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch categories', { originalError: error });
    }
  }

  /**
   * 转义 SPARQL 字符串
   */
  private escapeSparql(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}
