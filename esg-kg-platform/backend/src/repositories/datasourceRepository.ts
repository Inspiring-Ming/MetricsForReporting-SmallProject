import { GraphDBRepository } from './graphDBRepository';
import { 
  DataSourceDTO,
  GetDatasourcesRequest
} from '../types/kg';
import { GraphDBQueryError, NotFoundError, ValidationError } from '../types/errors';

/**
 * Datasource Repository - 专门处理数据源相关的 SPARQL 查询和数据操作
 */
export class DatasourceRepository {
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
   * 转义 SPARQL 字符串中的特殊字符
   */
  private escapeSparql(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * 解析数据源 URI（支持完整 URI 或简短 ID）
   */
  private resolveDatasourceUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    return `http://example.org/esg#${id}`;
  }

  /**
   * 获取数据源列表（支持分页、搜索和排序）
   */
  async getDatasources(params: GetDatasourcesRequest): Promise<{ datasources: DataSourceDTO[], total: number }> {
    const { 
      page = 1, 
      size = 20, 
      search, 
      sort = 'label', 
      order = 'asc' 
    } = params;
    
    const offset = (page - 1) * size;

    // 构建搜索过滤条件
    const filters: string[] = [];
    
    if (search) {
      filters.push(`FILTER(
        CONTAINS(LCASE(?label), LCASE("${this.escapeSparql(search)}")) ||
        CONTAINS(LCASE(COALESCE(?fileName, "")), LCASE("${this.escapeSparql(search)}"))
      )`);
    }

    const filterClause = filters.length > 0 ? filters.join('\n      ') : '';

    // 构建排序子句
    let orderByClause = '';
    switch (sort) {
      case 'fileName':
        orderByClause = `ORDER BY ${order.toUpperCase()}(COALESCE(?fileName, ""))`;
        break;
      case 'recordCount':
        orderByClause = `ORDER BY ${order.toUpperCase()}(COALESCE(?recordCount, 0))`;
        break;
      case 'createdAt':
        orderByClause = `ORDER BY ${order.toUpperCase()}(?datasource)`;
        break;
      case 'label':
      default:
        orderByClause = `ORDER BY ${order.toUpperCase()}(?label)`;
        break;
    }

    // 查询数据源列表
    const query = `
      ${this.prefix}
      
      SELECT ?datasource ?label ?fileName ?description ?coverage ?recordCount
      WHERE {
        ?datasource a esg:DataSource .
        ?datasource rdfs:label ?label .
        
        OPTIONAL { ?datasource esg:hasFileName ?fileName . }
        OPTIONAL { ?datasource esg:hasDescription ?description . }
        OPTIONAL { ?datasource esg:hasCoverage ?coverage . }
        OPTIONAL { ?datasource esg:hasRecordCount ?recordCount . }
        
        ${filterClause}
      }
      ${orderByClause}
      LIMIT ${size}
      OFFSET ${offset}
    `;

    // 查询总数
    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?datasource) AS ?count)
      WHERE {
        ?datasource a esg:DataSource .
        ?datasource rdfs:label ?label .
        
        OPTIONAL { ?datasource esg:hasFileName ?fileName . }
        
        ${filterClause}
      }
    `;

    try {
      const [listResult, countResult] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      const datasources: DataSourceDTO[] = listResult.results.bindings.map((binding: any) => ({
        iri: binding.datasource.value,
        label: binding.label.value,
        fileName: binding.fileName?.value,
        description: binding.description?.value,
        coverage: binding.coverage?.value,
        recordCount: binding.recordCount ? parseInt(binding.recordCount.value, 10) : undefined
      }));

      const total = parseInt(countResult.results.bindings[0]?.count?.value || '0', 10);

      return { datasources, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch datasources', { originalError: error });
    }
  }

  /**
   * 根据 ID 获取数据源详情
   */
  async getDatasourceById(id: string): Promise<DataSourceDTO & { variables?: Array<{ iri: string, label: string }> }> {
    const datasourceUri = this.resolveDatasourceUri(id);

    const query = `
      ${this.prefix}
      
      SELECT ?label ?fileName ?description ?coverage ?recordCount
             ?variable ?varLabel
      WHERE {
        <${datasourceUri}> a esg:DataSource ;
                          rdfs:label ?label .
        
        OPTIONAL { <${datasourceUri}> esg:hasFileName ?fileName . }
        OPTIONAL { <${datasourceUri}> esg:hasDescription ?description . }
        OPTIONAL { <${datasourceUri}> esg:hasCoverage ?coverage . }
        OPTIONAL { <${datasourceUri}> esg:hasRecordCount ?recordCount . }
        
        OPTIONAL {
          ?variable esg:sourceFrom <${datasourceUri}> ;
                   rdfs:label ?varLabel .
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Datasource not found: ${id}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      // 收集使用此数据源的所有数据集变量
      const variables = bindings
        .filter((b: any) => b.variable)
        .map((b: any) => ({
          iri: b.variable.value,
          label: b.varLabel.value
        }));

      return {
        iri: datasourceUri,
        label: firstBinding.label.value,
        fileName: firstBinding.fileName?.value,
        description: firstBinding.description?.value,
        coverage: firstBinding.coverage?.value,
        recordCount: firstBinding.recordCount ? parseInt(firstBinding.recordCount.value, 10) : undefined,
        variables: variables.length > 0 ? variables : undefined
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch datasource: ${id}`, { originalError: error });
    }
  }

  /**
   * 创建数据源
   */
  async createDatasource(data: { label: string; fileName?: string; description?: string; coverage?: string; recordCount?: number; disclosureType?: string }): Promise<{ uri: string; label: string; created_at: string }> {
    // 验证必填字段
    if (!data.label || data.label.trim() === '') {
      throw new ValidationError('Label is required');
    }

    // 验证 recordCount
    if (data.recordCount !== undefined && data.recordCount < 0) {
      throw new ValidationError('Record count must be non-negative');
    }

    // 生成唯一的数据源名称
    const sanitizedLabel = data.label.replace(/[^a-zA-Z0-9_]/g, '_');
    const timestamp = Date.now();
    const datasourceName = `${sanitizedLabel}_${timestamp}`;
    const datasourceUri = `http://example.org/esg#${datasourceName}`;
    const createdAt = new Date().toISOString();

    // 构建 INSERT 语句
    let insertTriples = `
      <${datasourceUri}> a esg:DataSource ;
                        rdfs:label "${this.escapeSparql(data.label)}" .
    `;

    if (data.fileName) {
      insertTriples += `
      <${datasourceUri}> esg:hasFileName "${this.escapeSparql(data.fileName)}" .`;
    }

    if (data.description) {
      insertTriples += `
      <${datasourceUri}> esg:hasDescription "${this.escapeSparql(data.description)}" .`;
    }

    if (data.coverage) {
      insertTriples += `
      <${datasourceUri}> esg:hasCoverage "${this.escapeSparql(data.coverage)}" .`;
    }

    if (data.recordCount !== undefined) {
      insertTriples += `
      <${datasourceUri}> esg:hasRecordCount ${data.recordCount} .`;
    }

    if (data.disclosureType) {
      insertTriples += `
      <${datasourceUri}> esg:hasDisclosureType "${this.escapeSparql(data.disclosureType)}" .`;
    }

    const insertQuery = `
      ${this.prefix}
      
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(insertQuery);

      return {
        uri: datasourceUri,
        label: data.label,
        created_at: createdAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to create datasource', { originalError: error });
    }
  }

  /**
   * 更新数据源
   */
  async updateDatasource(id: string, data: { label?: string; fileName?: string; description?: string; coverage?: string; recordCount?: number; disclosureType?: string }): Promise<{ uri: string; label: string; updated_at: string }> {
    const datasourceUri = this.resolveDatasourceUri(id);

    // 验证数据源是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${datasourceUri}> a esg:DataSource . }
    `;
    
    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Datasource not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check datasource existence', { originalError: error });
    }

    // 验证 recordCount 范围
    if (data.recordCount !== undefined && data.recordCount < 0) {
      throw new ValidationError('Record count must be non-negative');
    }

    const updatedAt = new Date().toISOString();

    // 构建 DELETE、INSERT 和 WHERE 子句
    let deleteTriples = '';
    let insertTriples = '';
    let whereTriples = `<${datasourceUri}> a esg:DataSource .\n`;

    if (data.label !== undefined) {
      deleteTriples += `    <${datasourceUri}> rdfs:label ?oldLabel .\n`;
      insertTriples += `    <${datasourceUri}> rdfs:label "${this.escapeSparql(data.label)}" .\n`;
      whereTriples += `    <${datasourceUri}> rdfs:label ?oldLabel .\n`;
    }

    if (data.fileName !== undefined) {
      deleteTriples += `    <${datasourceUri}> esg:hasFileName ?oldFileName .\n`;
      insertTriples += `    <${datasourceUri}> esg:hasFileName "${this.escapeSparql(data.fileName)}" .\n`;
      whereTriples += `    OPTIONAL { <${datasourceUri}> esg:hasFileName ?oldFileName . }\n`;
    }

    if (data.description !== undefined) {
      deleteTriples += `    <${datasourceUri}> esg:hasDescription ?oldDescription .\n`;
      insertTriples += `    <${datasourceUri}> esg:hasDescription "${this.escapeSparql(data.description)}" .\n`;
      whereTriples += `    OPTIONAL { <${datasourceUri}> esg:hasDescription ?oldDescription . }\n`;
    }

    if (data.coverage !== undefined) {
      deleteTriples += `    <${datasourceUri}> esg:hasCoverage ?oldCoverage .\n`;
      insertTriples += `    <${datasourceUri}> esg:hasCoverage "${this.escapeSparql(data.coverage)}" .\n`;
      whereTriples += `    OPTIONAL { <${datasourceUri}> esg:hasCoverage ?oldCoverage . }\n`;
    }

    if (data.recordCount !== undefined) {
      deleteTriples += `    <${datasourceUri}> esg:hasRecordCount ?oldCount .\n`;
      insertTriples += `    <${datasourceUri}> esg:hasRecordCount ${data.recordCount} .\n`;
      whereTriples += `    OPTIONAL { <${datasourceUri}> esg:hasRecordCount ?oldCount . }\n`;
    }

    if (data.disclosureType !== undefined) {
      deleteTriples += `    <${datasourceUri}> esg:hasDisclosureType ?oldDisclosure .\n`;
      insertTriples += `    <${datasourceUri}> esg:hasDisclosureType "${this.escapeSparql(data.disclosureType)}" .\n`;
      whereTriples += `    OPTIONAL { <${datasourceUri}> esg:hasDisclosureType ?oldDisclosure . }\n`;
    }

    // 如果没有更新内容，直接返回
    if (deleteTriples === '' && insertTriples === '') {
      const labelQuery = `
        ${this.prefix}
        SELECT ?label WHERE { <${datasourceUri}> rdfs:label ?label . }
      `;
      const labelResult = await this.graphDB.executeSparqlQuery(labelQuery);
      const label = labelResult.results.bindings[0]?.label?.value || '';

      return {
        uri: datasourceUri,
        label: label,
        updated_at: updatedAt
      };
    }

    // 构建更新查询
    let updateQuery = `${this.prefix}\n`;
    
    if (deleteTriples) {
      updateQuery += `DELETE {\n${deleteTriples}}\n`;
    }
    
    if (insertTriples) {
      updateQuery += `INSERT {\n${insertTriples}}\n`;
    }
    
    updateQuery += `WHERE {\n${whereTriples}}`;

    try {
      await this.graphDB.executeSparqlQuery(updateQuery);

      // 获取更新后的 label
      const labelQuery = `
        ${this.prefix}
        SELECT ?label WHERE { <${datasourceUri}> rdfs:label ?label . }
      `;
      const labelResult = await this.graphDB.executeSparqlQuery(labelQuery);
      const label = labelResult.results.bindings[0]?.label?.value || data.label || '';

      return {
        uri: datasourceUri,
        label: label,
        updated_at: updatedAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to update datasource', { originalError: error });
    }
  }

  /**
   * 删除数据源
   */
  async deleteDatasource(id: string, force: boolean = false): Promise<{ uri: string; deleted: boolean; deleted_at: string }> {
    const datasourceUri = this.resolveDatasourceUri(id);

    // 验证数据源是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${datasourceUri}> a esg:DataSource . }
    `;
    
    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Datasource not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check datasource existence', { originalError: error });
    }

    // 如果不是强制删除，检查是否有数据集变量使用此数据源
    if (!force) {
      const dependencyQuery = `
        ${this.prefix}
        ASK {
          ?variable esg:sourceFrom <${datasourceUri}> .
        }
      `;
      
      try {
        const dependencyResult = await this.graphDB.executeSparqlQuery(dependencyQuery);
        if (dependencyResult.boolean) {
          throw new ValidationError(
            'Cannot delete datasource: it is being used by one or more dataset variables. Use force=true to delete anyway.'
          );
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new GraphDBQueryError('Failed to check datasource dependencies', { originalError: error });
      }
    }

    const deletedAt = new Date().toISOString();

    // 删除数据源及其所有关联
    const deleteQuery = `
      ${this.prefix}
      
      DELETE {
        <${datasourceUri}> ?p ?o .
        ?s ?p2 <${datasourceUri}> .
      }
      WHERE {
        {
          <${datasourceUri}> ?p ?o .
        }
        UNION
        {
          ?s ?p2 <${datasourceUri}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);

      return {
        uri: datasourceUri,
        deleted: true,
        deleted_at: deletedAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to delete datasource', { originalError: error });
    }
  }

  /**
   * 获取使用此数据源的所有数据集变量
   * @param datasourceId 数据源 ID（短 ID 或完整 URI）
   * @returns 变量列表及数据源信息
   */
  async getDatasourceVariables(datasourceId: string): Promise<{
    datasourceUri: string;
    datasourceLabel: string;
    variables: Array<{
      iri: string;
      label: string;
      confidenceScore?: number;
      alignmentReason?: string;
    }>;
  }> {
    const datasourceUri = this.resolveDatasourceUri(datasourceId);

    const query = `
      ${this.prefix}
      SELECT ?label ?variableUri ?variableLabel ?confidenceScore ?alignmentReason
      WHERE {
        <${datasourceUri}> a esg:DataSource ;
                           rdfs:label ?label .
        
        OPTIONAL {
          ?variableUri a esg:DatasetVariable ;
                       rdfs:label ?variableLabel ;
                       esg:sourceFrom <${datasourceUri}> .
          OPTIONAL { ?variableUri esg:hasConfidenceScore ?confidenceScore . }
          OPTIONAL { ?variableUri esg:alignmentReason ?alignmentReason . }
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Datasource not found: ${datasourceId}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      const variables = bindings
        .filter((b: any) => b.variableUri)
        .map((b: any) => ({
          iri: b.variableUri.value,
          label: b.variableLabel.value,
          confidenceScore: b.confidenceScore 
            ? parseInt(b.confidenceScore.value, 10) 
            : undefined,
          alignmentReason: b.alignmentReason?.value
        }));

      return {
        datasourceUri,
        datasourceLabel: firstBinding.label.value,
        variables
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to fetch variables for datasource', { originalError: error });
    }
  }

  /**
   * 获取间接使用此数据源的所有指标（通过数据集变量）
   * @param datasourceId 数据源 ID（短 ID 或完整 URI）
   * @returns 指标列表及数据源信息
   */
  async getDatasourceMetrics(datasourceId: string): Promise<{
    datasourceUri: string;
    datasourceLabel: string;
    metrics: Array<{
      iri: string;
      label: string;
      hasCalculationMethod: 'direct_measurement' | 'calculation_model';
      hasUnit?: string;
      variable: {
        iri: string;
        label: string;
      };
    }>;
  }> {
    const datasourceUri = this.resolveDatasourceUri(datasourceId);

    const query = `
      ${this.prefix}
      SELECT ?label ?metricUri ?metricLabel ?calculationMethod ?unit 
             ?variableUri ?variableLabel
      WHERE {
        <${datasourceUri}> a esg:DataSource ;
                           rdfs:label ?label .
        
        OPTIONAL {
          ?variableUri a esg:DatasetVariable ;
                       rdfs:label ?variableLabel ;
                       esg:sourceFrom <${datasourceUri}> .
          
          ?metricUri a esg:Metric ;
                     rdfs:label ?metricLabel ;
                     esg:hasCalculationMethod ?calculationMethod ;
                     esg:obtainedFrom ?variableUri .
          
          OPTIONAL { ?metricUri esg:hasUnit ?unit . }
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Datasource not found: ${datasourceId}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      const metrics = bindings
        .filter((b: any) => b.metricUri)
        .map((b: any) => ({
          iri: b.metricUri.value,
          label: b.metricLabel.value,
          hasCalculationMethod: b.calculationMethod.value as 'direct_measurement' | 'calculation_model',
          hasUnit: b.unit?.value,
          variable: {
            iri: b.variableUri.value,
            label: b.variableLabel.value
          }
        }));

      return {
        datasourceUri,
        datasourceLabel: firstBinding.label.value,
        metrics
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to fetch metrics for datasource', { originalError: error });
    }
  }
}
