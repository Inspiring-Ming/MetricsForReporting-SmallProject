import { GraphDBRepository } from './graphDBRepository';
import {
  CategoryDTO,
  CategoryDetailDTO,
  MetricDTO,
  GetCategoriesRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '../types/kg';
import { GraphDBQueryError, ValidationError, NotFoundError, DeleteConflictError } from '../types/errors';

const ESG_PREFIX = 'http://example.org/esg#';
const RDFS_PREFIX = 'http://www.w3.org/2000/01/rdf-schema#';

export class CategoryRepository {
  private graphDB: GraphDBRepository;
  private readonly prefix = `
    PREFIX esg: <${ESG_PREFIX}>
    PREFIX rdfs: <${RDFS_PREFIX}>
  `;

  constructor(graphDB?: GraphDBRepository) {
    this.graphDB = graphDB || new GraphDBRepository();
  }
  /**
   * 查询分类列表（支持分页、搜索、筛选、排序）
   */
  async getCategories(params: GetCategoriesRequest): Promise<{ categories: CategoryDTO[], total: number }> {
    const {
      page = 1,
      size = 20,
      search = '',
      framework = '',
      sort = 'label',
      order = 'asc'
    } = params;

    const offset = (page - 1) * size;

    // 构建筛选条件
    let filterClause = '';
    if (search) {
      filterClause += `FILTER(CONTAINS(LCASE(?label), LCASE("${search}"))) .\n`;
    }
    if (framework) {
      filterClause += `<${framework}> <${ESG_PREFIX}includes> ?category .\n`;
    }

    // 构建排序字段
    const sortField = sort === 'label' ? '?label' : '?category';
    const orderClause = order.toUpperCase();

    const query = `
      ${this.prefix}
      
      SELECT ?category ?label WHERE {
        ?category a esg:Category .
        ?category rdfs:label ?label .
        ${filterClause}
      }
      ORDER BY ${orderClause}(${sortField})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?category) as ?count) WHERE {
        ?category a esg:Category .
        ?category rdfs:label ?label .
        ${filterClause}
      }
    `;

    try {
      const [results, countResults] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      const bindings = results.results.bindings;
      const categories = bindings.map((binding: any) => ({
        iri: binding.category.value,
        label: binding.label.value
      }));

      const total = countResults.results.bindings[0]?.count?.value
        ? parseInt(countResults.results.bindings[0].count.value)
        : 0;

      return { categories, total };
    } catch (error) {
      // 如果是 SPARQL 查询语法错误（可能由于无效的 framework URI），返回空结果
      // 这样可以优雅地处理无效输入而不是抛出 500 错误
      if (error instanceof Error && error.message.includes('SPARQL')) {
        return { categories: [], total: 0 };
      }
      throw new GraphDBQueryError('Failed to fetch categories', { originalError: error });
    }
  }

  /**
   * 根据 URI 查询分类详情
   */
  async getCategoryById(id: string): Promise<CategoryDetailDTO | null> {
    const query = `
      ${this.prefix}
      
      SELECT ?label 
             (GROUP_CONCAT(DISTINCT ?metricUri; separator=",") as ?metricUris)
             (GROUP_CONCAT(DISTINCT ?metricLabel; separator="|") as ?metricLabels)
             (GROUP_CONCAT(DISTINCT ?frameworkUri; separator=",") as ?frameworkUris)
             (GROUP_CONCAT(DISTINCT ?frameworkLabel; separator="|") as ?frameworkLabels)
      WHERE {
        <${id}> a esg:Category .
        <${id}> rdfs:label ?label .
        
        OPTIONAL {
          <${id}> esg:consistsOf ?metricUri .
          ?metricUri rdfs:label ?metricLabel .
        }
        
        OPTIONAL {
          ?frameworkUri esg:includes <${id}> .
          ?frameworkUri rdfs:label ?frameworkLabel .
        }
      }
      GROUP BY ?label
    `;

    try {
      const results = await this.graphDB.executeSparqlQuery(query);
      const bindings = results.results.bindings;

      if (bindings.length === 0) {
        return null;
      }

      const binding = bindings[0];

      const metrics = binding.metricUris?.value
        ? binding.metricUris.value.split(',').map((iri: string, index: number) => ({
          iri: iri,
          label: binding.metricLabels.value.split('|')[index]
        }))
        : [];

      const frameworks = binding.frameworkUris?.value
        ? binding.frameworkUris.value.split(',').map((iri: string, index: number) => ({
          iri: iri,
          label: binding.frameworkLabels.value.split('|')[index]
        }))
        : [];

      return {
        iri: id,
        label: binding.label.value,
        metrics: metrics.length > 0 ? metrics : undefined,
        frameworks: frameworks.length > 0 ? frameworks : undefined
      };
    } catch (error) {
      throw new GraphDBQueryError(`Failed to fetch category: ${id}`, { originalError: error });
    }
  }

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryRequest): Promise<string> {
    const { label, metrics } = data;
    const iri = `${ESG_PREFIX}${this.generateUriSuffix(label)}`;

    // 验证标签唯一性
    await this.validateLabelUniqueness(label);

    // 验证指标 URIs
    if (metrics && metrics.length > 0) {
      await this.validateMetricUris(metrics);
    }

    let insertTriples = `
      <${iri}> a esg:Category .
      <${iri}> rdfs:label "${this.escapeSparql(label)}" .
    `;

    if (metrics && metrics.length > 0) {
      metrics.forEach(metricUri => {
        insertTriples += `\n      <${iri}> esg:consistsOf <${metricUri}> .`;
      });
    }

    const updateQuery = `
      ${this.prefix}
      
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(updateQuery);
      return iri;
    } catch (error) {
      throw new GraphDBQueryError('Failed to create category', { originalError: error });
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<void> {
    const { label, metrics } = data;

    // 验证分类是否存在
    const exists = await this.categoryExists(id);
    if (!exists) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    // 如果要更新标签，验证新标签的唯一性
    if (label) {
      const current = await this.getCategoryById(id);
      if (current && current.label !== label) {
        await this.validateLabelUniqueness(label);
      }
    }

    // 验证指标 URIs
    if (metrics && metrics.length > 0) {
      await this.validateMetricUris(metrics);
    }

    let deleteClause = '';
    let insertClause = '';

    // 更新标签
    if (label) {
      deleteClause += `<${id}> rdfs:label ?oldLabel .\n`;
      insertClause += `<${id}> rdfs:label "${this.escapeSparql(label)}" .\n`;
    }

    // 更新指标关联
    if (metrics !== undefined) {
      deleteClause += `<${id}> esg:consistsOf ?oldMetric .\n`;

      if (metrics.length > 0) {
        const metricInserts = metrics
          .map(metricUri => `      <${id}> esg:consistsOf <${metricUri}> .`)
          .join('\n');
        insertClause += metricInserts + '\n';
      }
    }

    if (!deleteClause && !insertClause) {
      return; // 没有任何更新
    }

    const updateQuery = `
      ${this.prefix}
      
      DELETE {
        ${deleteClause}
      }
      ${insertClause ? `INSERT {\n        ${insertClause}      }` : ''}
      WHERE {
        <${id}> a esg:Category .
        ${label ? 'OPTIONAL { <' + id + '> rdfs:label ?oldLabel . }' : ''}
        ${metrics !== undefined ? 'OPTIONAL { <' + id + '> esg:consistsOf ?oldMetric . }' : ''}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(updateQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to update category: ${id}`, { originalError: error });
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string, force: boolean = false): Promise<void> {
    // 验证分类是否存在
    const exists = await this.categoryExists(id);
    if (!exists) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    // 检查是否被框架引用
    if (!force) {
      const frameworks = await this.getFrameworksUsingCategory(id);
      if (frameworks.length > 0) {
        throw new DeleteConflictError(
          `Cannot delete category because it is used by ${frameworks.length} framework(s)`,
          { frameworks }
        );
      }
    }

    const deleteQuery = `
      ${this.prefix}
      
      DELETE {
        <${id}> ?p ?o .
        ?framework esg:includes <${id}> .
      }
      WHERE {
        <${id}> a esg:Category .
        {
          <${id}> ?p ?o .
        }
        UNION
        {
          ?framework esg:includes <${id}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to delete category: ${id}`, { originalError: error });
    }
  }

  /**
   * 查询分类的指标列表
   */
  async getCategoryMetrics(id: string): Promise<MetricDTO[]> {
    const query = `
      ${this.prefix}
      
      SELECT ?metric ?label ?hasType ?hasMetricType ?hasUnit ?hasCalculationMethod WHERE {
        <${id}> a esg:Category .
        <${id}> esg:consistsOf ?metric .
        ?metric rdfs:label ?label .
        OPTIONAL { ?metric esg:hasType ?hasType . }
        OPTIONAL { ?metric esg:hasMetricType ?hasMetricType . }
        OPTIONAL { ?metric esg:hasUnit ?hasUnit . }
        OPTIONAL { ?metric esg:hasCalculationMethod ?hasCalculationMethod . }
      }
      ORDER BY ?label
    `;

    try {
      const results = await this.graphDB.executeSparqlQuery(query);
      return results.results.bindings.map((binding: any) => ({
        iri: binding.metric.value,
        label: binding.label.value,
        hasType: binding.hasType?.value,
        hasMetricType: binding.hasMetricType?.value,
        hasUnit: binding.hasUnit?.value,
        hasCalculationMethod: binding.hasCalculationMethod?.value as 'direct_measurement' | 'calculation_model'
      }));
    } catch (error) {
      throw new GraphDBQueryError(`Failed to fetch metrics for category: ${id}`, { originalError: error });
    }
  }

  /**
   * 添加指标到分类
   */
  async addMetricsToCategory(id: string, metricUris: string[]): Promise<MetricDTO[]> {
    // 验证分类是否存在
    const exists = await this.categoryExists(id);
    if (!exists) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    // 验证指标 URIs
    await this.validateMetricUris(metricUris);

    // 检查哪些指标已经关联
    const existingMetrics = await this.getCategoryMetrics(id);
    const existingUris = new Set(existingMetrics.map(m => m.iri));
    const newMetricUris = metricUris.filter(iri => !existingUris.has(iri));

    if (newMetricUris.length === 0) {
      return existingMetrics; // 所有指标都已存在
    }

    const insertTriples = newMetricUris
      .map(metricUri => `<${id}> esg:consistsOf <${metricUri}> .`)
      .join('\n      ');

    const insertQuery = `
      ${this.prefix}
      
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(insertQuery);
      return await this.getCategoryMetrics(id);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to add metrics to category: ${id}`, { originalError: error });
    }
  }

  /**
   * 从分类移除指标
   */
  async removeMetricFromCategory(id: string, metricUri: string): Promise<void> {
    // 验证分类是否存在
    const exists = await this.categoryExists(id);
    if (!exists) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    // 验证指标是否关联到此分类
    const metrics = await this.getCategoryMetrics(id);
    const metricExists = metrics.some(m => m.iri === metricUri);
    if (!metricExists) {
      throw new NotFoundError(`Metric association not found: ${metricUri} in category ${id}`);
    }

    const deleteQuery = `
      ${this.prefix}
      
      DELETE DATA {
        <${id}> esg:consistsOf <${metricUri}> .
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to remove metric from category: ${id}`, { originalError: error });
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证标签唯一性
   */
  private async validateLabelUniqueness(label: string): Promise<void> {
    const query = `
      ${this.prefix}
      
      ASK {
        ?category a esg:Category .
        ?category rdfs:label "${this.escapeSparql(label)}" .
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.boolean === true) {
        throw new DeleteConflictError(`Category with label "${label}" already exists`);
      }
    } catch (error) {
      if (error instanceof DeleteConflictError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate label uniqueness', { originalError: error });
    }
  }

  /**
   * 验证指标 URIs 是否存在
   */
  private async validateMetricUris(metricUris: string[]): Promise<void> {
    const query = `
      ${this.prefix}
      
      SELECT ?metric WHERE {
        VALUES ?metric { ${metricUris.map(iri => `<${iri}>`).join(' ')} }
        ?metric a esg:Metric .
      }
    `;

    try {
      const results = await this.graphDB.executeSparqlQuery(query);
      const foundUris = new Set(results.results.bindings.map((b: any) => b.metric.value));
      const invalidUris = metricUris.filter(iri => !foundUris.has(iri));

      if (invalidUris.length > 0) {
        throw new ValidationError(`Invalid metric IRI(s): ${invalidUris.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate metric URIs', { originalError: error });
    }
  }

  /**
   * 检查分类是否存在
   */
  async categoryExists(id: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      
      ASK {
        <${id}> a esg:Category .
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      return result.boolean === true;
    } catch (error) {
      throw new GraphDBQueryError('Failed to check category existence', { originalError: error });
    }
  }

  /**
   * 查询使用此分类的框架
   */
  async getFrameworksUsingCategory(id: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      
      SELECT ?framework WHERE {
        ?framework a esg:ReportingFramework .
        ?framework esg:includes <${id}> .
      }
    `;

    try {
      const results = await this.graphDB.executeSparqlQuery(query);
      return results.results.bindings.map((binding: any) => binding.framework.value);
    } catch (error) {
      throw new GraphDBQueryError('Failed to query frameworks using category', { originalError: error });
    }
  }

  /**
   * 生成 URI 后缀（从标签转换）
   */
  private generateUriSuffix(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
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
