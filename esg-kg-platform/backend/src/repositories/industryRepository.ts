import { GraphDBRepository } from './graphDBRepository';
import { 
  Industry, 
  IndustryDTO, 
  IndustryDetailDTO, 
  GetIndustriesRequest,
  CreateIndustryRequest,
  UpdateIndustryRequest 
} from '../types/kg';
import { GraphDBQueryError, NotFoundError, ValidationError, DeleteConflictError } from '../types/errors';

/**
 * Industry Repository - 专门处理行业相关的 SPARQL 查询和数据操作
 */
export class IndustryRepository {
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
   * 获取行业列表（支持分页和搜索）
   */
  async getIndustries(params: GetIndustriesRequest): Promise<{ industries: IndustryDTO[], total: number }> {
    const { page = 1, size = 10, search, sort = 'label', order = 'asc' } = params;
    const offset = (page - 1) * size;

    // 构建搜索过滤条件
    const searchFilter = search 
      ? `FILTER(CONTAINS(LCASE(?label), LCASE("${this.escapeSparql(search)}")))` 
      : '';

    // 构建排序条件
    const orderClause = order === 'desc' ? 'DESC' : '';
    const sortVar = sort === 'createdAt' ? '?createdAt' : '?label';

    const query = `
      ${this.prefix}
      
      SELECT ?industry ?label ?description
      WHERE {
        ?industry a esg:Industry ;
                  rdfs:label ?label .
        OPTIONAL { ?industry esg:hasDescription ?description . }
        ${searchFilter}
      }
      ORDER BY ${orderClause}(${sortVar})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    // 获取总数
    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?industry) AS ?count)
      WHERE {
        ?industry a esg:Industry ;
                  rdfs:label ?label .
        ${searchFilter}
      }
    `;

    try {
      const [resultData, countData] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      const industries: IndustryDTO[] = resultData.results.bindings.map((binding: any) => ({
        iri: binding.industry.value,
        label: binding.label.value,
        description: binding.description?.value
      }));

      const total = parseInt(countData.results.bindings[0]?.count?.value || '0', 10);

      return { industries, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch industries', { originalError: error });
    }
  }

  /**
   * 根据 ID 获取行业详情
   */
  async getIndustryById(id: string): Promise<IndustryDetailDTO> {
    const industryUri = this.resolveIndustryUri(id);

    const query = `
      ${this.prefix}
      
      SELECT ?label ?description ?framework ?frameworkLabel
      WHERE {
        <${industryUri}> a esg:Industry ;
                         rdfs:label ?label .
        OPTIONAL { <${industryUri}> esg:hasDescription ?description . }
        OPTIONAL { 
          <${industryUri}> esg:reportsUsing ?framework .
          ?framework rdfs:label ?frameworkLabel .
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Industry not found: ${id}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      // 收集所有的报告框架
      const frameworks = bindings
        .filter((b: any) => b.framework)
        .map((b: any) => ({
          iri: b.framework.value,
          label: b.frameworkLabel.value
        }));

      const industry: IndustryDetailDTO = {
        iri: industryUri,
        label: firstBinding.label.value,
        description: firstBinding.description?.value,
        reportsUsing: frameworks.length > 0 ? frameworks : undefined
      };

      return industry;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch industry: ${id}`, { originalError: error });
    }
  }

  /**
   * 创建新行业
   */
  async createIndustry(data: CreateIndustryRequest): Promise<{ uri: string, label: string }> {
    const { label, description, reportsUsing } = data;

    if (!label || label.trim().length === 0) {
      throw new ValidationError('Industry label is required');
    }

    // 生成 URI（使用 label 的小写无空格版本）
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    const industryUri = `http://example.org/esg#${normalizedLabel}`;

    // 检查是否已存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${industryUri}> a esg:Industry . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (existsResult.boolean) {
        throw new ValidationError(`Industry with label "${label}" already exists`);
      }

      // 构建 INSERT 语句
      let insertData = `
        <${industryUri}> a esg:Industry ;
                         rdfs:label "${this.escapeSparql(label)}" .
      `;

      if (description) {
        insertData += `
        <${industryUri}> esg:hasDescription "${this.escapeSparql(description)}" .
        `;
      }

      if (reportsUsing && reportsUsing.length > 0) {
        reportsUsing.forEach(frameworkUri => {
          insertData += `
        <${industryUri}> esg:reportsUsing <${frameworkUri}> .
          `;
        });
      }

      const insertQuery = `
        ${this.prefix}
        INSERT DATA {
          ${insertData}
        }
      `;

      await this.graphDB.executeSparqlQuery(insertQuery);

      return { uri: industryUri, label };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to create industry', { originalError: error });
    }
  }

  /**
   * 部分更新行业
   */
  async updateIndustry(id: string, data: UpdateIndustryRequest): Promise<{ uri: string, label: string }> {
    const industryUri = this.resolveIndustryUri(id);
    const { label, description, reportsUsing } = data;

    // 检查行业是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${industryUri}> a esg:Industry . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Industry not found: ${id}`);
      }

      const updates: string[] = [];

      // 更新 label
      if (label !== undefined) {
        updates.push(`
          DELETE { <${industryUri}> rdfs:label ?oldLabel . }
          INSERT { <${industryUri}> rdfs:label "${this.escapeSparql(label)}" . }
          WHERE { <${industryUri}> rdfs:label ?oldLabel . }
        `);
      }

      // 更新 description
      if (description !== undefined) {
        updates.push(`
          DELETE { <${industryUri}> esg:hasDescription ?oldDesc . }
          WHERE { OPTIONAL { <${industryUri}> esg:hasDescription ?oldDesc . } }
        `);
        if (description.trim().length > 0) {
          updates.push(`
            INSERT DATA { <${industryUri}> esg:hasDescription "${this.escapeSparql(description)}" . }
          `);
        }
      }

      // 更新 reportsUsing
      if (reportsUsing !== undefined) {
        updates.push(`
          DELETE { <${industryUri}> esg:reportsUsing ?oldFramework . }
          WHERE { OPTIONAL { <${industryUri}> esg:reportsUsing ?oldFramework . } }
        `);
        if (reportsUsing.length > 0) {
          const frameworkInserts = reportsUsing
            .map(fw => `<${industryUri}> esg:reportsUsing <${fw}> .`)
            .join('\n          ');
          updates.push(`
            INSERT DATA {
              ${frameworkInserts}
            }
          `);
        }
      }

      // 执行所有更新
      for (const updateQuery of updates) {
        await this.graphDB.executeSparqlQuery(`${this.prefix}\n${updateQuery}`);
      }

      // 获取更新后的 label
      const industry = await this.getIndustryById(id);
      const finalLabel = label || industry.label || '';

      return { uri: industryUri, label: finalLabel };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to update industry: ${id}`, { originalError: error });
    }
  }

  /**
   * 删除行业
   * @param id - 行业标识符
   * @param force - 是否强制删除（忽略关联检查）
   */
  async deleteIndustry(id: string, force: boolean = false): Promise<{ uri: string, deleted: boolean }> {
    const industryUri = this.resolveIndustryUri(id);

    // 检查行业是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${industryUri}> a esg:Industry . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Industry not found: ${id}`);
      }

      // 如果不是强制删除，检查是否有 reportsUsing 关联
      if (!force) {
        const hasRelationsQuery = `
          ${this.prefix}
          ASK {
            <${industryUri}> esg:reportsUsing ?framework .
          }
        `;
        
        const hasRelations = await this.graphDB.executeSparqlQuery(hasRelationsQuery);
        
        if (hasRelations.boolean) {
          // 获取关联的框架信息用于错误提示
          const relationsQuery = `
            ${this.prefix}
            SELECT ?framework ?label
            WHERE {
              <${industryUri}> esg:reportsUsing ?framework .
              OPTIONAL { ?framework rdfs:label ?label . }
            }
          `;
          
          const relationsResult = await this.graphDB.executeSparqlQuery(relationsQuery);
          const frameworks = relationsResult.results.bindings.map((b: any) => 
            b.label?.value || b.framework.value
          );
          
          throw new DeleteConflictError(
            `Cannot delete industry: it has associated reporting frameworks. Use force=true to delete anyway.`,
            { 
              industryUri,
              associatedFrameworks: frameworks,
              frameworkCount: frameworks.length
            }
          );
        }
      }

      // 删除所有与该行业相关的三元组
      const deleteQuery = `
        ${this.prefix}
        DELETE {
          <${industryUri}> ?p ?o .
          ?s ?p2 <${industryUri}> .
        }
        WHERE {
          {
            <${industryUri}> ?p ?o .
          }
          UNION
          {
            ?s ?p2 <${industryUri}> .
          }
        }
      `;

      await this.graphDB.executeSparqlQuery(deleteQuery);

      return { uri: industryUri, deleted: true };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DeleteConflictError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to delete industry: ${id}`, { originalError: error });
    }
  }

  /**
   * 辅助方法：将 ID 或 label 解析为完整的 URI
   */
  private resolveIndustryUri(id: string): string {
    // 如果已经是完整的 URI，直接返回
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    
    // 如果是命名空间格式 (esg:xxx)，转换为完整 URI
    if (id.includes(':')) {
      return id.replace('esg:', 'http://example.org/esg#');
    }
    
    // 否则假定是一个简短 ID，添加命名空间前缀
    return `http://example.org/esg#${id}`;
  }

  /**
   * 辅助方法：SPARQL 字符串转义
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
