import { GraphDBRepository } from './graphDBRepository';
import {
  DatasetVariable,
  DatasetVariableDTO,
  DataSourceDTO,
  GetDatasetVariablesRequest,
  CreateDatasetVariableRequest,
  UpdateDatasetVariableRequest
} from '../types/kg';
import { GraphDBQueryError, NotFoundError, ValidationError } from '../types/errors';

/**
 * DatasetVariable Repository - 专门处理数据集变量相关的 SPARQL 查询和数据操作
 */
export class DatasetVariableRepository {
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
   * 获取数据集变量列表（支持分页、搜索和筛选）
   */
  async getDatasetVariables(params: GetDatasetVariablesRequest): Promise<{ variables: DatasetVariableDTO[], total: number }> {
    const {
      page = 1,
      size = 20,
      search,
      datasource,
      metric,
      minConfidenceScore,
      isUnitCompatible,
      sort = 'label',
      order = 'asc'
    } = params;

    const offset = (page - 1) * size;

    // 构建搜索过滤条件
    const filters: string[] = [];

    if (search) {
      filters.push(`FILTER(CONTAINS(LCASE(?label), LCASE("${this.escapeSparql(search)}")))`);
    }

    if (datasource) {
      const datasourceUri = this.resolveDatasourceUri(datasource);
      filters.push(`?variable esg:sourceFrom <${datasourceUri}> .`);
    }

    if (metric) {
      const metricUri = this.resolveMetricUri(metric);
      filters.push(`<${metricUri}> esg:obtainedFrom ?variable .`);
    }

    if (minConfidenceScore !== undefined) {
      filters.push(`FILTER(?confidenceScore >= ${minConfidenceScore})`);
    }

    if (isUnitCompatible) {
      filters.push(`FILTER(?isUnitCompatible = "${this.escapeSparql(isUnitCompatible)}")`);
    }

    const filterClause = filters.join('\n        ');

    // 构建排序条件
    const orderClause = order === 'desc' ? 'DESC' : '';
    let sortVar = '?label';
    if (sort === 'confidenceScore') {
      sortVar = '?confidenceScore';
    } else if (sort === 'createdAt') {
      sortVar = '?createdAt';
    }

    const query = `
      ${this.prefix}
      
      SELECT DISTINCT ?variable ?label ?alignmentReason ?confidenceScore ?isUnitCompatible
      WHERE {
        ?variable a esg:DatasetVariable ;
                  rdfs:label ?label .
        
        OPTIONAL { ?variable esg:alignmentReason ?alignmentReason . }
        OPTIONAL { ?variable esg:hasConfidenceScore ?confidenceScore . }
        OPTIONAL { ?variable esg:isUnitCompatible ?isUnitCompatible . }
        
        ${filterClause}
      }
      ORDER BY ${orderClause}(${sortVar})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    // 获取总数
    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?variable) AS ?count)
      WHERE {
        ?variable a esg:DatasetVariable ;
                  rdfs:label ?label .
        
        OPTIONAL { ?variable esg:alignmentReason ?alignmentReason . }
        OPTIONAL { ?variable esg:hasConfidenceScore ?confidenceScore . }
        OPTIONAL { ?variable esg:isUnitCompatible ?isUnitCompatible . }
        
        ${filterClause}
      }
    `;

    try {
      const [resultData, countData] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      // 获取每个变量的数据源
      const variables: DatasetVariableDTO[] = await Promise.all(
        resultData.results.bindings.map(async (binding: any) => {
          const variableUri = binding.variable.value;
          const sources = await this.getDataSourcesForVariable(variableUri);

          return {
            iri: variableUri,
            label: binding.label.value,
            alignmentReason: binding.alignmentReason?.value,
            confidenceScore: binding.confidenceScore
              ? parseInt(binding.confidenceScore.value, 10)
              : undefined,
            isUnitCompatible: binding.isUnitCompatible?.value,
            sources
          };
        })
      );

      const total = parseInt(countData.results.bindings[0]?.count?.value || '0', 10);

      return { variables, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch dataset variables', { originalError: error });
    }
  }

  /**
   * 获取变量关联的数据源
   */
  private async getDataSourcesForVariable(variableUri: string): Promise<DataSourceDTO[]> {
    const query = `
      ${this.prefix}
      
      SELECT ?dataSource ?dsLabel ?fileName ?description ?coverage ?recordCount
      WHERE {
        <${variableUri}> esg:sourceFrom ?dataSource .
        ?dataSource rdfs:label ?dsLabel .
        
        OPTIONAL { ?dataSource esg:fileName ?fileName . }
        OPTIONAL { ?dataSource esg:description ?description . }
        OPTIONAL { ?dataSource esg:coverage ?coverage . }
        OPTIONAL { ?dataSource esg:hasRecordCount ?recordCount . }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      return result.results.bindings.map((binding: any) => ({
        iri: binding.dataSource.value,
        label: binding.dsLabel.value,
        fileName: binding.fileName?.value,
        description: binding.description?.value,
        coverage: binding.coverage?.value,
        recordCount: binding.recordCount ? parseInt(binding.recordCount.value, 10) : undefined
      }));
    } catch (error) {
      console.error(`Error fetching data sources for variable ${variableUri}:`, error);
      return [];
    }
  }

  /**
   * 根据 ID 获取数据集变量详情
   */
  async getDatasetVariableById(id: string): Promise<DatasetVariableDTO & { metrics?: Array<{ iri: string, label: string, hasCalculationMethod: 'direct_measurement' | 'calculation_model' }> }> {
    const variableUri = this.resolveVariableUri(id);

    const query = `
      ${this.prefix}
      
      SELECT ?label ?alignmentReason ?confidenceScore ?isUnitCompatible
             ?metric ?metricLabel ?calculationMethod
      WHERE {
        <${variableUri}> a esg:DatasetVariable ;
                         rdfs:label ?label .
        
        OPTIONAL { <${variableUri}> esg:alignmentReason ?alignmentReason . }
        OPTIONAL { <${variableUri}> esg:hasConfidenceScore ?confidenceScore . }
        OPTIONAL { <${variableUri}> esg:isUnitCompatible ?isUnitCompatible . }
        
        OPTIONAL {
          ?metric esg:obtainedFrom <${variableUri}> ;
                  rdfs:label ?metricLabel ;
                  esg:hasCalculationMethod ?calculationMethod .
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Dataset variable not found: ${id}`);
      }

      const bindings = result.results.bindings;
      const firstBinding = bindings[0];

      // 收集使用此变量的所有指标
      const metrics = bindings
        .filter((b: any) => b.metric)
        .map((b: any) => ({
          iri: b.metric.value,
          label: b.metricLabel.value,
          hasCalculationMethod: b.calculationMethod.value as 'direct_measurement' | 'calculation_model'
        }));

      // 获取数据源
      const sources = await this.getDataSourcesForVariable(variableUri);

      return {
        iri: variableUri,
        label: firstBinding.label.value,
        alignmentReason: firstBinding.alignmentReason?.value,
        confidenceScore: firstBinding.confidenceScore
          ? parseInt(firstBinding.confidenceScore.value, 10)
          : undefined,
        isUnitCompatible: firstBinding.isUnitCompatible?.value,
        sources,
        metrics: metrics.length > 0 ? metrics : undefined
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch dataset variable: ${id}`, { originalError: error });
    }
  }

  /**
   * 解析变量 URI
   * 支持三种格式:
   * 1. 完整 URI: http://example.org/esg#TestVar
   * 2. Namespace 格式: esg:TestVar
   * 3. 简单 ID: TestVar
   */
  private resolveVariableUri(id: string): string {
    // 完整 URI
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }

    // Namespace 格式: esg:TestVar -> http://example.org/esg#TestVar
    if (id.includes(':')) {
      const [prefix, localPart] = id.split(':', 2);
      if (prefix === 'esg') {
        return `http://example.org/esg#${localPart}`;
      }
    }

    // 简单 ID: TestVar -> http://example.org/esg#TestVar
    return `http://example.org/esg#${id}`;
  }

  /**
   * 解析数据源 URI
   */
  private resolveDatasourceUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    return `http://example.org/esg#${id}`;
  }

  /**
   * 解析指标 URI
   */
  private resolveMetricUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    return `http://example.org/esg#${id}`;
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

  /**
   * 创建数据集变量
   */
  async createDatasetVariable(data: CreateDatasetVariableRequest): Promise<{ iri: string; label: string; created_at: string }> {
    // 验证必填字段
    if (!data.label || data.label.trim() === '') {
      throw new ValidationError('Label is required');
    }

    // 验证 confidenceScore 范围
    if (data.confidenceScore !== undefined && (data.confidenceScore < 0 || data.confidenceScore > 100)) {
      throw new ValidationError('Confidence score must be between 0 and 100');
    }

    // 生成唯一的变量名（使用 label + 时间戳）
    const sanitizedLabel = data.label.replace(/[^a-zA-Z0-9_]/g, '_');
    const timestamp = Date.now();
    const variableName = `${sanitizedLabel}_${timestamp}`;
    const variableUri = `http://example.org/esg#${variableName}`;
    const createdAt = new Date().toISOString();

    // 构建 INSERT 语句
    let insertTriples = `
      <${variableUri}> a esg:DatasetVariable ;
                       rdfs:label "${this.escapeSparql(data.label)}" .
    `;

    if (data.alignmentReason) {
      insertTriples += `
      <${variableUri}> esg:alignmentReason "${this.escapeSparql(data.alignmentReason)}" .`;
    }

    if (data.confidenceScore !== undefined) {
      insertTriples += `
      <${variableUri}> esg:hasConfidenceScore ${data.confidenceScore} .`;
    }

    if (data.isUnitCompatible) {
      insertTriples += `
      <${variableUri}> esg:isUnitCompatible "${this.escapeSparql(data.isUnitCompatible)}" .`;
    }

    // 添加数据源关联
    if (data.sources && data.sources.length > 0) {
      for (const sourceId of data.sources) {
        const sourceUri = this.resolveDatasourceUri(sourceId);
        insertTriples += `
      <${variableUri}> esg:sourceFrom <${sourceUri}> .`;
      }
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
        iri: variableUri,
        label: data.label,
        created_at: createdAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to create dataset variable', { originalError: error });
    }
  }

  /**
   * 更新数据集变量（部分更新）
   */
  async updateDatasetVariable(id: string, data: UpdateDatasetVariableRequest): Promise<{ iri: string; label: string; updated_at: string }> {
    const variableUri = this.resolveVariableUri(id);

    // 验证变量是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${variableUri}> a esg:DatasetVariable . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Dataset variable not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check dataset variable existence', { originalError: error });
    }

    // 验证 confidenceScore 范围
    if (data.confidenceScore !== undefined && (data.confidenceScore < 0 || data.confidenceScore > 100)) {
      throw new ValidationError('Confidence score must be between 0 and 100');
    }

    const updatedAt = new Date().toISOString();

    // 构建 DELETE、INSERT 和 WHERE 子句
    let deleteTriples = '';
    let insertTriples = '';
    let whereTriples = `<${variableUri}> a esg:DatasetVariable .\n`;

    if (data.label !== undefined) {
      deleteTriples += `    <${variableUri}> rdfs:label ?oldLabel .\n`;
      insertTriples += `    <${variableUri}> rdfs:label "${this.escapeSparql(data.label)}" .\n`;
      whereTriples += `    <${variableUri}> rdfs:label ?oldLabel .\n`;
    }

    if (data.alignmentReason !== undefined) {
      deleteTriples += `    <${variableUri}> esg:alignmentReason ?oldAlignment .\n`;
      insertTriples += `    <${variableUri}> esg:alignmentReason "${this.escapeSparql(data.alignmentReason)}" .\n`;
      whereTriples += `    OPTIONAL { <${variableUri}> esg:alignmentReason ?oldAlignment . }\n`;
    }

    if (data.confidenceScore !== undefined) {
      deleteTriples += `    <${variableUri}> esg:hasConfidenceScore ?oldScore .\n`;
      insertTriples += `    <${variableUri}> esg:hasConfidenceScore ${data.confidenceScore} .\n`;
      whereTriples += `    OPTIONAL { <${variableUri}> esg:hasConfidenceScore ?oldScore . }\n`;
    }

    if (data.isUnitCompatible !== undefined) {
      deleteTriples += `    <${variableUri}> esg:isUnitCompatible ?oldUnit .\n`;
      insertTriples += `    <${variableUri}> esg:isUnitCompatible "${this.escapeSparql(data.isUnitCompatible)}" .\n`;
      whereTriples += `    OPTIONAL { <${variableUri}> esg:isUnitCompatible ?oldUnit . }\n`;
    }

    // 处理数据源关联的更新（完全替换）
    if (data.sources !== undefined) {
      deleteTriples += `    <${variableUri}> esg:sourceFrom ?oldSource .\n`;
      whereTriples += `    OPTIONAL { <${variableUri}> esg:sourceFrom ?oldSource . }\n`;
      if (data.sources.length > 0) {
        for (const sourceId of data.sources) {
          const sourceUri = this.resolveDatasourceUri(sourceId);
          insertTriples += `    <${variableUri}> esg:sourceFrom <${sourceUri}> .\n`;
        }
      }
    }

    // 如果没有更新内容，直接返回
    if (deleteTriples === '' && insertTriples === '') {
      // 获取当前 label
      const labelQuery = `
        ${this.prefix}
        SELECT ?label WHERE { <${variableUri}> rdfs:label ?label . }
      `;
      const labelResult = await this.graphDB.executeSparqlQuery(labelQuery);
      const label = labelResult.results.bindings[0]?.label?.value || '';

      return {
        iri: variableUri,
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
        SELECT ?label WHERE { <${variableUri}> rdfs:label ?label . }
      `;
      const labelResult = await this.graphDB.executeSparqlQuery(labelQuery);
      const label = labelResult.results.bindings[0]?.label?.value || data.label || '';

      return {
        iri: variableUri,
        label: label,
        updated_at: updatedAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to update dataset variable', { originalError: error });
    }
  }

  /**
   * 删除数据集变量
   */
  async deleteDatasetVariable(id: string, force: boolean = false): Promise<{ iri: string; deleted: boolean; deleted_at: string }> {
    const variableUri = this.resolveVariableUri(id);

    // 验证变量是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${variableUri}> a esg:DatasetVariable . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Dataset variable not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check dataset variable existence', { originalError: error });
    }

    // 如果不是强制删除，检查是否有指标使用此变量
    if (!force) {
      const dependencyQuery = `
        ${this.prefix}
        ASK {
          ?metric esg:obtainedFrom <${variableUri}> .
        }
      `;

      try {
        const dependencyResult = await this.graphDB.executeSparqlQuery(dependencyQuery);
        if (dependencyResult.boolean) {
          throw new ValidationError(
            'Cannot delete dataset variable: it is being used by one or more metrics. Use force=true to delete anyway.'
          );
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new GraphDBQueryError('Failed to check dataset variable dependencies', { originalError: error });
      }
    }

    const deletedAt = new Date().toISOString();

    // 删除变量及其所有关联
    const deleteQuery = `
      ${this.prefix}
      
      DELETE {
        <${variableUri}> ?p ?o .
        ?s ?p2 <${variableUri}> .
      }
      WHERE {
        {
          <${variableUri}> ?p ?o .
        }
        UNION
        {
          ?s ?p2 <${variableUri}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);

      return {
        iri: variableUri,
        deleted: true,
        deleted_at: deletedAt
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to delete dataset variable', { originalError: error });
    }
  }

  /**
   * 获取数据集变量的所有数据源
   */
  async getVariableDatasources(id: string): Promise<{ variableUri: string, variableLabel: string, datasources: DataSourceDTO[] }> {
    const variableUri = this.resolveVariableUri(id);

    // 首先验证变量是否存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${variableUri}> a esg:DatasetVariable . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (!existsResult.boolean) {
        throw new NotFoundError(`Dataset variable not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check dataset variable existence', { originalError: error });
    }

    // 获取变量标签和所有数据源
    const query = `
      ${this.prefix}
      
      SELECT ?variableLabel ?datasource ?dsLabel ?fileName ?description ?coverage ?recordCount
      WHERE {
        <${variableUri}> a esg:DatasetVariable ;
                         rdfs:label ?variableLabel .
        
        OPTIONAL {
          <${variableUri}> esg:sourceFrom ?datasource .
          ?datasource rdfs:label ?dsLabel .
          
          OPTIONAL { ?datasource esg:hasFileName ?fileName . }
          OPTIONAL { ?datasource esg:hasDescription ?description . }
          OPTIONAL { ?datasource esg:hasCoverage ?coverage . }
          OPTIONAL { ?datasource esg:hasRecordCount ?recordCount . }
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Dataset variable not found: ${id}`);
      }

      const variableLabel = result.results.bindings[0].variableLabel.value;

      // 收集所有数据源
      const datasources: DataSourceDTO[] = result.results.bindings
        .filter((binding: any) => binding.datasource)
        .map((binding: any) => ({
          iri: binding.datasource.value,
          label: binding.dsLabel.value,
          fileName: binding.fileName?.value,
          description: binding.description?.value,
          coverage: binding.coverage?.value,
          recordCount: binding.recordCount ? parseInt(binding.recordCount.value, 10) : undefined
        }));

      return {
        variableUri,
        variableLabel,
        datasources
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch datasources for variable: ${id}`, { originalError: error });
    }
  }

  /**
   * 为数据集变量添加数据源关联
   */
  async addDatasourceToVariable(variableId: string, datasourceUri: string): Promise<{ variableUri: string, datasourceUri: string }> {
    const variableUri = this.resolveVariableUri(variableId);
    const resolvedDatasourceUri = this.resolveDatasourceUri(datasourceUri);

    // 验证变量是否存在
    const varExistsQuery = `
      ${this.prefix}
      ASK { <${variableUri}> a esg:DatasetVariable . }
    `;

    try {
      const varExistsResult = await this.graphDB.executeSparqlQuery(varExistsQuery);
      if (!varExistsResult.boolean) {
        throw new NotFoundError(`Dataset variable not found: ${variableId}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check dataset variable existence', { originalError: error });
    }

    // 验证数据源是否存在
    const dsExistsQuery = `
      ${this.prefix}
      ASK { <${resolvedDatasourceUri}> a esg:DataSource . }
    `;

    try {
      const dsExistsResult = await this.graphDB.executeSparqlQuery(dsExistsQuery);
      if (!dsExistsResult.boolean) {
        throw new NotFoundError(`Datasource not found: ${datasourceUri}`);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check datasource existence', { originalError: error });
    }

    // 检查关联是否已存在
    const checkQuery = `
      ${this.prefix}
      ASK {
        <${variableUri}> esg:sourceFrom <${resolvedDatasourceUri}> .
      }
    `;

    try {
      const checkResult = await this.graphDB.executeSparqlQuery(checkQuery);
      if (checkResult.boolean) {
        throw new ValidationError('Datasource is already associated with this dataset variable');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to check existing datasource association', { originalError: error });
    }

    // 添加关联
    const insertQuery = `
      ${this.prefix}
      
      INSERT DATA {
        <${variableUri}> esg:sourceFrom <${resolvedDatasourceUri}> .
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(insertQuery);

      return {
        variableUri,
        datasourceUri: resolvedDatasourceUri
      };
    } catch (error) {
      throw new GraphDBQueryError('Failed to add datasource to variable', { originalError: error });
    }
  }

  /**
   * 移除数据集变量的数据源关联
   * @param variableId 数据集变量 ID（短 ID 或完整 URI）
   * @param datasourceId 数据源 ID（短 ID 或完整 URI）
   */
  async removeVariableDatasource(variableId: string, datasourceId: string): Promise<void> {
    const variableUri = this.resolveVariableUri(variableId);
    const datasourceUri = this.resolveDatasourceUri(datasourceId);

    // 删除 esg:sourceFrom 关联
    const deleteQuery = `
      ${this.prefix}
      DELETE {
        <${variableUri}> esg:sourceFrom <${datasourceUri}> .
      }
      WHERE {
        <${variableUri}> a esg:DatasetVariable .
        OPTIONAL {
          <${variableUri}> esg:sourceFrom <${datasourceUri}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError('Failed to remove datasource from variable', { originalError: error });
    }
  }

  /**
   * 获取数据集变量的质量信息
   * @param variableId 数据集变量 ID（短 ID 或完整 URI）
   * @returns 质量信息（confidenceScore、isUnitCompatible、alignmentReason）
   */
  async getVariableQuality(variableId: string): Promise<{
    variableUri: string;
    variableLabel: string;
    confidenceScore?: number;
    isUnitCompatible?: string;
    alignmentReason?: string;
  }> {
    const variableUri = this.resolveVariableUri(variableId);

    const query = `
      ${this.prefix}
      SELECT ?label ?confidenceScore ?isUnitCompatible ?alignmentReason
      WHERE {
        <${variableUri}> a esg:DatasetVariable ;
                         rdfs:label ?label .
        OPTIONAL { <${variableUri}> esg:hasConfidenceScore ?confidenceScore . }
        OPTIONAL { <${variableUri}> esg:isUnitCompatible ?isUnitCompatible . }
        OPTIONAL { <${variableUri}> esg:alignmentReason ?alignmentReason . }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Dataset variable not found: ${variableId}`);
      }

      const binding = result.results.bindings[0];

      return {
        variableUri,
        variableLabel: binding.label.value,
        confidenceScore: binding.confidenceScore
          ? parseInt(binding.confidenceScore.value, 10)
          : undefined,
        isUnitCompatible: binding.isUnitCompatible?.value,
        alignmentReason: binding.alignmentReason?.value
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to fetch variable quality information', { originalError: error });
    }
  }

  /**
   * 获取使用此数据集变量的所有指标
   * @param variableId 数据集变量 ID（短 ID 或完整 URI）
   * @returns 指标列表及变量信息
   */
  async getVariableMetrics(variableId: string): Promise<{
    variableUri: string;
    variableLabel: string;
    metrics: Array<{
      iri: string;
      label: string;
      hasCalculationMethod: 'direct_measurement' | 'calculation_model';
      hasUnit?: string;
      hasMetricType?: string;
    }>;
  }> {
    const variableUri = this.resolveVariableUri(variableId);

    const query = `
      ${this.prefix}
      SELECT ?label ?metricUri ?metricLabel ?calculationMethod ?unit ?metricType
      WHERE {
        <${variableUri}> a esg:DatasetVariable ;
                         rdfs:label ?label .
        
        OPTIONAL {
          ?metricUri esg:obtainedFrom <${variableUri}> ;
                     rdfs:label ?metricLabel ;
                     esg:hasCalculationMethod ?calculationMethod .
          OPTIONAL { ?metricUri esg:hasUnit ?unit . }
          OPTIONAL { ?metricUri esg:hasMetricType ?metricType . }
        }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      if (result.results.bindings.length === 0) {
        throw new NotFoundError(`Dataset variable not found: ${variableId}`);
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
          hasMetricType: b.metricType?.value
        }));

      return {
        variableUri,
        variableLabel: firstBinding.label.value,
        metrics
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to fetch metrics for variable', { originalError: error });
    }
  }
}
