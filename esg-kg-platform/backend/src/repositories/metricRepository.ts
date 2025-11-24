import { GraphDBRepository } from './graphDBRepository';
import {
  MetricDTO,
  CreateMetricRequest,
  UpdateMetricRequest,
  PatchMetricRequest,
  AddMetricDatasourceRequest,
  AddMetricInputRequest
} from '../types/kg';
import { GraphDBQueryError, ValidationError, NotFoundError, DeleteConflictError } from '../types/errors';

const ESG_PREFIX = 'http://example.org/esg#';
const RDFS_PREFIX = 'http://www.w3.org/2000/01/rdf-schema#';

/**
 * Metric Repository - 专门处理指标相关的 SPARQL 查询和数据操作
 */
export class MetricRepository {
  private graphDB: GraphDBRepository;
  private readonly prefix = `
    PREFIX esg: <${ESG_PREFIX}>
    PREFIX rdfs: <${RDFS_PREFIX}>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  `;

  constructor(graphDB?: GraphDBRepository) {
    this.graphDB = graphDB || new GraphDBRepository();
  }

  /**
   * 创建新指标
   */
  async createMetric(data: CreateMetricRequest): Promise<{ iri: string, label: string }> {
    const { label, code, description, unit, dataType, calculationMethod, hasType,
      industry, category, framework, disclosureLevel, additionalProperties } = data;

    if (!label || label.trim().length === 0) {
      throw new ValidationError('Metric label is required');
    }

    if (!calculationMethod) {
      throw new ValidationError('Calculation method is required');
    }

    // 生成 URI（使用 code 或 label 的标准化版本）
    const iriSuffix = code || this.generateUriSuffix(label);
    const metricUri = `${ESG_PREFIX}${iriSuffix}`;

    // 检查标签是否已存在（不排除任何 URI，因为这是新创建）
    await this.validateLabelUniqueness(label);

    // 构建 INSERT 语句
    let insertTriples = `
      <${metricUri}> a esg:Metric .
      <${metricUri}> rdfs:label "${this.escapeSparql(label)}" .
      <${metricUri}> esg:hasCalculationMethod "${calculationMethod}" .
    `;

    if (description) {
      insertTriples += `\n      <${metricUri}> esg:hasDescription "${this.escapeSparql(description)}" .`;
    }

    if (unit) {
      insertTriples += `\n      <${metricUri}> esg:hasUnit "${this.escapeSparql(unit)}" .`;
    }

    if (dataType) {
      insertTriples += `\n      <${metricUri}> esg:hasMetricType "${dataType}" .`;
    }

    if (hasType) {
      insertTriples += `\n      <${metricUri}> esg:hasType "${hasType}" .`;
    }

    if (disclosureLevel !== undefined) {
      insertTriples += `\n      <${metricUri}> esg:hasDisclosureLevel ${disclosureLevel} .`;
    }

    // 添加关联关系
    if (category) {
      insertTriples += `\n      <${category}> esg:consistsOf <${metricUri}> .`;
    }

    if (framework && category) {
      insertTriples += `\n      <${framework}> esg:includes <${category}> .`;
    }

    if (industry && framework) {
      insertTriples += `\n      <${industry}> esg:reportsUsing <${framework}> .`;
    }

    // 添加其他属性
    if (additionalProperties) {
      for (const [key, value] of Object.entries(additionalProperties)) {
        if (value !== undefined && value !== null) {
          const escapedValue = typeof value === 'string'
            ? `"${this.escapeSparql(value)}"`
            : `"${value}"`;
          insertTriples += `\n      <${metricUri}> esg:${key} ${escapedValue} .`;
        }
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
      return { iri: metricUri, label };
    } catch (error) {
      throw new GraphDBQueryError('Failed to create metric', { originalError: error });
    }
  }

  /**
   * 完整更新指标
   */
  async updateMetric(id: string, data: UpdateMetricRequest): Promise<void> {
    const metricUri = this.resolveMetricUri(id);

    // 验证指标是否存在
    const exists = await this.metricExists(metricUri);
    if (!exists) {
      throw new NotFoundError(`Metric not found: ${id}`);
    }

    // 验证新标签的唯一性
    const current = await this.getMetricById(metricUri);
    if (current && current.label !== data.label) {
      await this.validateLabelUniqueness(data.label, metricUri);
    }

    // 删除所有旧属性，插入新属性
    let deleteClause = `
        <${metricUri}> rdfs:label ?oldLabel .
        <${metricUri}> esg:hasCalculationMethod ?oldMethod .
    `;

    let insertClause = `
        <${metricUri}> rdfs:label "${this.escapeSparql(data.label)}" .
        <${metricUri}> esg:hasCalculationMethod "${data.calculationMethod}" .
    `;

    // 处理可选字段 - 删除所有旧值
    const optionalFields = [
      { prop: 'description', predicate: 'esg:hasDescription', var: 'description' },
      { prop: 'unit', predicate: 'esg:hasUnit', var: 'unit' },
      { prop: 'dataType', predicate: 'esg:hasMetricType', var: 'dataType' },
      { prop: 'hasType', predicate: 'esg:hasType', var: 'hasType' },
      { prop: 'code', predicate: 'esg:hasCode', var: 'code' }
    ];

    for (const field of optionalFields) {
      deleteClause += `\n        <${metricUri}> ${field.predicate} ?${field.var} .`;

      const value = (data as any)[field.prop];
      if (value) {
        insertClause += `\n        <${metricUri}> ${field.predicate} "${this.escapeSparql(value)}" .`;
      }
    }

    // 删除旧的 disclosureLevel
    deleteClause += `\n        <${metricUri}> esg:hasDisclosureLevel ?disclosureLevel .`;
    if (data.disclosureLevel !== undefined) {
      insertClause += `\n        <${metricUri}> esg:hasDisclosureLevel ${data.disclosureLevel} .`;
    }

    // 删除旧的关系
    deleteClause += `\n        <${metricUri}> esg:belongsToIndustry ?industry .`;
    deleteClause += `\n        <${metricUri}> esg:belongsToCategory ?category .`;
    deleteClause += `\n        <${metricUri}> esg:belongsToFramework ?framework .`;

    // 添加新的关系
    if (data.industry) {
      insertClause += `\n        <${metricUri}> esg:belongsToIndustry <${data.industry}> .`;
    }
    if (data.category) {
      insertClause += `\n        <${metricUri}> esg:belongsToCategory <${data.category}> .`;
    }
    if (data.framework) {
      insertClause += `\n        <${metricUri}> esg:belongsToFramework <${data.framework}> .`;
    }

    const updateQuery = `
      ${this.prefix}
      DELETE {
${deleteClause}
      }
      INSERT {
${insertClause}
      }
      WHERE {
        <${metricUri}> a esg:Metric .
        OPTIONAL { <${metricUri}> rdfs:label ?oldLabel . }
        OPTIONAL { <${metricUri}> esg:hasCalculationMethod ?oldMethod . }
        OPTIONAL { <${metricUri}> esg:hasDescription ?description . }
        OPTIONAL { <${metricUri}> esg:hasUnit ?unit . }
        OPTIONAL { <${metricUri}> esg:hasMetricType ?dataType . }
        OPTIONAL { <${metricUri}> esg:hasType ?hasType . }
        OPTIONAL { <${metricUri}> esg:hasCode ?code . }
        OPTIONAL { <${metricUri}> esg:hasDisclosureLevel ?disclosureLevel . }
        OPTIONAL { <${metricUri}> esg:belongsToIndustry ?industry . }
        OPTIONAL { <${metricUri}> esg:belongsToCategory ?category . }
        OPTIONAL { <${metricUri}> esg:belongsToFramework ?framework . }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(updateQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to update metric: ${id}`, { originalError: error });
    }
  }

  /**
   * 部分更新指标
   */
  async patchMetric(id: string, data: PatchMetricRequest): Promise<void> {
    const metricUri = this.resolveMetricUri(id);

    // 验证指标是否存在
    const exists = await this.metricExists(metricUri);
    if (!exists) {
      throw new NotFoundError(`Metric not found: ${id}`);
    }

    // 如果要更新标签，验证新标签的唯一性
    if (data.label) {
      const current = await this.getMetricById(metricUri);
      if (current && current.label !== data.label) {
        await this.validateLabelUniqueness(data.label, metricUri);
      }
    }

    const updates: string[] = [];

    // 更新 label
    if (data.label !== undefined) {
      updates.push(`
        DELETE { <${metricUri}> rdfs:label ?oldLabel . }
        INSERT { <${metricUri}> rdfs:label "${this.escapeSparql(data.label)}" . }
        WHERE { <${metricUri}> rdfs:label ?oldLabel . }
      `);
    }

    // 更新 calculationMethod
    if (data.calculationMethod !== undefined) {
      updates.push(`
        DELETE { <${metricUri}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { <${metricUri}> esg:hasCalculationMethod "${data.calculationMethod}" . }
        WHERE { <${metricUri}> esg:hasCalculationMethod ?oldMethod . }
      `);
    }

    // 更新模型关联 (esg:isCalculatedBy)
    if (data.model !== undefined) {
      // 如果 model 为空字符串或 null，移除关联
      if (!data.model || data.model.trim().length === 0) {
        updates.push(`
          DELETE { <${metricUri}> esg:isCalculatedBy ?oldModel . }
          WHERE { OPTIONAL { <${metricUri}> esg:isCalculatedBy ?oldModel . } }
        `);
      } else {
        // 解析模型 URI
        const modelUri = this.resolveMetricUri(data.model);

        // 先删除旧的关联，再添加新的关联
        updates.push(`
          DELETE { <${metricUri}> esg:isCalculatedBy ?oldModel . }
          WHERE { OPTIONAL { <${metricUri}> esg:isCalculatedBy ?oldModel . } }
        `);
        updates.push(`
          INSERT DATA { <${metricUri}> esg:isCalculatedBy <${modelUri}> . }
        `);
      }
    }

    // 更新其他字段
    const fieldMap: Record<string, string> = {
      description: 'esg:hasDescription',
      unit: 'esg:hasUnit',
      dataType: 'esg:hasMetricType',
      hasType: 'esg:hasType'
    };

    for (const [field, predicate] of Object.entries(fieldMap)) {
      const value = (data as any)[field];
      if (value !== undefined) {
        updates.push(`
          DELETE { <${metricUri}> ${predicate} ?old_${field} . }
          WHERE { OPTIONAL { <${metricUri}> ${predicate} ?old_${field} . } }
        `);
        if (value) {
          updates.push(`
            INSERT DATA { <${metricUri}> ${predicate} "${this.escapeSparql(value)}" . }
          `);
        }
      }
    }

    // 更新 disclosureLevel
    if (data.disclosureLevel !== undefined) {
      updates.push(`
        DELETE { <${metricUri}> esg:hasDisclosureLevel ?oldLevel . }
        WHERE { OPTIONAL { <${metricUri}> esg:hasDisclosureLevel ?oldLevel . } }
      `);
      updates.push(`
        INSERT DATA { <${metricUri}> esg:hasDisclosureLevel ${data.disclosureLevel} . }
      `);
    }

    if (updates.length === 0) {
      return; // 没有任何更新
    }

    try {
      for (const updateQuery of updates) {
        await this.graphDB.executeSparqlQuery(`${this.prefix}\n${updateQuery}`);
      }
    } catch (error) {
      throw new GraphDBQueryError(`Failed to patch metric: ${id}`, { originalError: error });
    }
  }

  /**
   * 删除指标
   */
  async deleteMetric(id: string, cascade: boolean = false, force: boolean = false): Promise<void> {
    const metricUri = this.resolveMetricUri(id);

    // 验证指标是否存在
    const exists = await this.metricExists(metricUri);
    if (!exists) {
      throw new NotFoundError(`Metric not found: ${id}`);
    }

    // 检查是否被其他模型依赖
    if (!force) {
      const dependencies = await this.getMetricDependencies(metricUri);
      if (dependencies.length > 0) {
        throw new DeleteConflictError(
          `Cannot delete metric because it is used as input by ${dependencies.length} model(s)`,
          { models: dependencies }
        );
      }
    }

    let deleteQuery = '';

    if (cascade) {
      // 级联删除：删除指标及所有关联
      deleteQuery = `
        ${this.prefix}
        DELETE {
          <${metricUri}> ?p ?o .
          ?s ?p2 <${metricUri}> .
        }
        WHERE {
          <${metricUri}> a esg:Metric .
          {
            <${metricUri}> ?p ?o .
          }
          UNION
          {
            ?s ?p2 <${metricUri}> .
          }
        }
      `;
    } else {
      // 仅删除指标本身
      deleteQuery = `
        ${this.prefix}
        DELETE {
          <${metricUri}> ?p ?o .
          ?category esg:consistsOf <${metricUri}> .
        }
        WHERE {
          <${metricUri}> a esg:Metric .
          {
            <${metricUri}> ?p ?o .
          }
          UNION
          {
            ?category esg:consistsOf <${metricUri}> .
          }
        }
      `;
    }

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to delete metric: ${id}`, { originalError: error });
    }
  }

  /**
   * 为指标添加数据源关联
   */
  async addMetricDatasource(metricId: string, data: AddMetricDatasourceRequest): Promise<void> {
    const metricUri = this.resolveMetricUri(metricId);
    const { datasourceUri, datasetVariableUri, disclosureLevel, priority } = data;

    // 验证指标存在
    const exists = await this.metricExists(metricUri);
    if (!exists) {
      throw new NotFoundError(`Metric not found: ${metricId}`);
    }

    let insertTriples = '';

    if (datasetVariableUri) {
      // 通过数据集变量关联
      insertTriples = `
        <${metricUri}> esg:obtainedFrom <${datasetVariableUri}> .
        <${datasetVariableUri}> esg:sourceFrom <${datasourceUri}> .
      `;
    } else {
      // 直接关联数据源
      insertTriples = `
        <${metricUri}> esg:hasDataSource <${datasourceUri}> .
      `;
    }

    if (disclosureLevel !== undefined) {
      insertTriples += `\n      <${datasourceUri}> esg:hasDisclosureLevel ${disclosureLevel} .`;
    }

    if (priority !== undefined) {
      insertTriples += `\n      <${datasourceUri}> esg:hasPriority ${priority} .`;
    }

    const insertQuery = `
      ${this.prefix}
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(insertQuery);
    } catch (error) {
      throw new GraphDBQueryError('Failed to add datasource to metric', { originalError: error });
    }
  }

  /**
   * 删除指标的数据源关联
   */
  async removeMetricDatasource(metricId: string, datasourceId: string): Promise<void> {
    const metricUri = this.resolveMetricUri(metricId);
    const datasourceUri = this.resolveMetricUri(datasourceId);

    const deleteQuery = `
      ${this.prefix}
      DELETE {
        <${metricUri}> esg:hasDataSource <${datasourceUri}> .
        <${metricUri}> esg:obtainedFrom ?variable .
        ?variable esg:sourceFrom <${datasourceUri}> .
      }
      WHERE {
        <${metricUri}> a esg:Metric .
        {
          <${metricUri}> esg:hasDataSource <${datasourceUri}> .
        }
        UNION
        {
          <${metricUri}> esg:obtainedFrom ?variable .
          ?variable esg:sourceFrom <${datasourceUri}> .
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError('Failed to remove datasource from metric', { originalError: error });
    }
  }

  /**
   * 为计算模型指标添加输入指标
   */
  async addMetricInput(metricId: string, data: AddMetricInputRequest): Promise<void> {
    const metricUri = this.resolveMetricUri(metricId);
    const { inputMetricUri, order } = data;

    // 验证指标存在且是 calculation_model 类型
    const metric = await this.getMetricById(metricUri);
    if (!metric) {
      throw new NotFoundError(`Metric not found: ${metricId}`);
    }

    if (metric.hasCalculationMethod !== 'calculation_model') {
      throw new ValidationError('Can only add inputs to calculation_model metrics');
    }

    // 获取指标的模型
    const modelUri = await this.getMetricModel(metricUri);
    if (!modelUri) {
      throw new ValidationError('Metric does not have an associated calculation model');
    }

    let insertTriples = `
      <${modelUri}> esg:requiresInputFrom <${inputMetricUri}> .
    `;

    if (order !== undefined) {
      insertTriples += `\n      <${modelUri}> esg:inputOrder_${inputMetricUri.split('#')[1]} ${order} .`;
    }

    const insertQuery = `
      ${this.prefix}
      INSERT DATA {
        ${insertTriples}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(insertQuery);
    } catch (error) {
      throw new GraphDBQueryError('Failed to add input metric', { originalError: error });
    }
  }

  /**
   * 删除计算模型指标的输入指标关联
   */
  async removeMetricInput(metricId: string, inputMetricId: string): Promise<void> {
    const metricUri = this.resolveMetricUri(metricId);
    const inputMetricUri = this.resolveMetricUri(inputMetricId);

    // 获取指标的模型
    const modelUri = await this.getMetricModel(metricUri);
    if (!modelUri) {
      throw new ValidationError('Metric does not have an associated calculation model');
    }

    const deleteQuery = `
      ${this.prefix}
      DELETE {
        <${modelUri}> esg:requiresInputFrom <${inputMetricUri}> .
        <${modelUri}> ?orderProp ?orderValue .
      }
      WHERE {
        <${modelUri}> esg:requiresInputFrom <${inputMetricUri}> .
        OPTIONAL {
          <${modelUri}> ?orderProp ?orderValue .
          FILTER(STRSTARTS(STR(?orderProp), "${ESG_PREFIX}inputOrder_"))
        }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError('Failed to remove input metric', { originalError: error });
    }
  }

  /**
   * 根据 URI 获取指标详情
   */
  /**
   * 获取指标列表（支持分页和过滤）
   */
  async listMetrics(params: {
    page?: number;
    size?: number;
    search?: string;
    industry?: string;
    category?: string;
    framework?: string;
    calculationMethod?: 'direct_measurement' | 'calculation_model';
    sort?: 'label' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<{ metrics: any[]; total: number }> {
    const page = params.page || 1;
    const size = params.size || 10;
    const offset = (page - 1) * size;
    const sort = params.sort || 'label';
    const order = params.order || 'asc';

    // Resolve short IDs to full URIs
    const industryUri = params.industry ? this.resolveMetricUri(params.industry) : null;
    const categoryUri = params.category ? this.resolveMetricUri(params.category) : null;
    const frameworkUri = params.framework ? this.resolveMetricUri(params.framework) : null;

    // 构建过滤条件 - 使用完整的关系链
    let filters = '';

    if (params.calculationMethod) {
      filters += `\n      ?metric esg:hasCalculationMethod "${params.calculationMethod}" .`;
    }

    if (params.search && params.search.trim().length > 0) {
      const searchLower = this.escapeSparql(params.search.toLowerCase());
      filters += `\n      FILTER(CONTAINS(LCASE(?label), "${searchLower}"))`;
    }

    // 构建关系链查询 - 按照知识图谱结构: Industry -> Framework -> Category -> Metric
    // 必须提供完整的关系链才能正确过滤
    if (industryUri && frameworkUri && categoryUri) {
      // 完整的关系链
      filters += `\n      <${categoryUri}> esg:consistsOf ?metric .`;
      filters += `\n      <${frameworkUri}> esg:includes <${categoryUri}> .`;
      filters += `\n      <${industryUri}> esg:reportsUsing <${frameworkUri}> .`;
    } else if (frameworkUri && categoryUri) {
      // Framework -> Category -> Metric
      filters += `\n      <${categoryUri}> esg:consistsOf ?metric .`;
      filters += `\n      <${frameworkUri}> esg:includes <${categoryUri}> .`;
    } else if (categoryUri) {
      // 只有 Category -> Metric (但这在实际中不应该发生，因为 Category 必须属于某个 Framework)
      filters += `\n      <${categoryUri}> esg:consistsOf ?metric .`;
    }

    // 查询关联关系以返回完整信息
    let relationshipPatterns = '';
    if (industryUri && frameworkUri && categoryUri) {
      // 已知完整关系链，直接使用
      relationshipPatterns = `
        <${categoryUri}> esg:consistsOf ?metric .
        <${categoryUri}> rdfs:label ?categoryLabel .
        <${frameworkUri}> esg:includes <${categoryUri}> .
        <${frameworkUri}> rdfs:label ?frameworkLabel .
        <${industryUri}> esg:reportsUsing <${frameworkUri}> .
        <${industryUri}> rdfs:label ?industryLabel .
        BIND(<${categoryUri}> AS ?category)
        BIND(<${frameworkUri}> AS ?framework)
        BIND(<${industryUri}> AS ?industry)`;
    } else if (frameworkUri && categoryUri) {
      // 已知 Framework 和 Category
      relationshipPatterns = `
        <${categoryUri}> esg:consistsOf ?metric .
        <${categoryUri}> rdfs:label ?categoryLabel .
        <${frameworkUri}> esg:includes <${categoryUri}> .
        <${frameworkUri}> rdfs:label ?frameworkLabel .
        BIND(<${categoryUri}> AS ?category)
        BIND(<${frameworkUri}> AS ?framework)
        OPTIONAL {
          ?industry esg:reportsUsing <${frameworkUri}> .
          ?industry rdfs:label ?industryLabel .
        }`;
    } else if (categoryUri) {
      // 只知道 Category
      relationshipPatterns = `
        <${categoryUri}> esg:consistsOf ?metric .
        <${categoryUri}> rdfs:label ?categoryLabel .
        BIND(<${categoryUri}> AS ?category)
        OPTIONAL {
          ?framework esg:includes <${categoryUri}> .
          ?framework rdfs:label ?frameworkLabel .
          OPTIONAL {
            ?industry esg:reportsUsing ?framework .
            ?industry rdfs:label ?industryLabel .
          }
        }`;
    } else {
      // 没有过滤条件，查询所有关系
      relationshipPatterns = `
        OPTIONAL {
          ?category esg:consistsOf ?metric .
          ?category rdfs:label ?categoryLabel .
          OPTIONAL {
            ?framework esg:includes ?category .
            ?framework rdfs:label ?frameworkLabel .
            OPTIONAL {
              ?industry esg:reportsUsing ?framework .
              ?industry rdfs:label ?industryLabel .
            }
          }
        }`;
    }

    // 排序字段映射
    const sortField = sort === 'createdAt' ? '?createdAt' : '?label';
    const orderDirection = order.toUpperCase();

    // 查询总数
    const countQuery = `
      ${this.prefix}
      SELECT (COUNT(DISTINCT ?metric) AS ?total)
      WHERE {
        ?metric a esg:Metric .
        ?metric rdfs:label ?label .
        ?metric esg:hasCalculationMethod ?calculationMethod .${filters}
      }
    `;

    // 查询数据
    const dataQuery = `
      ${this.prefix}
      SELECT DISTINCT ?metric ?label ?code ?unit ?description ?calculationMethod ?hasType ?hasMetricType ?createdAt
             ?category ?categoryLabel ?framework ?frameworkLabel ?industry ?industryLabel
      WHERE {
        ?metric a esg:Metric .
        ?metric rdfs:label ?label .
        ?metric esg:hasCalculationMethod ?calculationMethod .${filters}
        OPTIONAL { ?metric esg:hasCode ?code . }
        OPTIONAL { ?metric esg:hasUnit ?unit . }
        OPTIONAL { ?metric esg:hasDescription ?description . }
        OPTIONAL { ?metric esg:hasType ?hasType . }
        OPTIONAL { ?metric esg:hasMetricType ?hasMetricType . }
        OPTIONAL { ?metric esg:createdAt ?createdAt . }
        ${relationshipPatterns}
      }
      ORDER BY ${orderDirection}(${sortField})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.graphDB.executeSparqlQuery(countQuery),
        this.graphDB.executeSparqlQuery(dataQuery)
      ]);

      const total = countResult.results.bindings.length > 0
        ? parseInt(countResult.results.bindings[0].total.value, 10)
        : 0;

      const metrics = dataResult.results.bindings.map((binding: any) => ({
        iri: binding.metric.value,
        label: binding.label.value,
        code: binding.code?.value,
        unit: binding.unit?.value,
        description: binding.description?.value,
        calculationMethod: binding.calculationMethod.value,
        hasType: binding.hasType?.value,
        hasMetricType: binding.hasMetricType?.value,
        createdAt: binding.createdAt?.value,
        category: binding.category?.value,
        categoryLabel: binding.categoryLabel?.value,
        framework: binding.framework?.value,
        frameworkLabel: binding.frameworkLabel?.value,
        industry: binding.industry?.value,
        industryLabel: binding.industryLabel?.value
      }));

      return { metrics, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to list metrics', { originalError: error });
    }
  }

  async getMetricById(iri: string): Promise<MetricDTO | null> {
    const query = `
      ${this.prefix}
      SELECT ?label ?hasType ?hasMetricType ?hasUnit ?hasCalculationMethod
      WHERE {
        <${iri}> a esg:Metric .
        <${iri}> rdfs:label ?label .
        <${iri}> esg:hasCalculationMethod ?hasCalculationMethod .
        OPTIONAL { <${iri}> esg:hasType ?hasType . }
        OPTIONAL { <${iri}> esg:hasMetricType ?hasMetricType . }
        OPTIONAL { <${iri}> esg:hasUnit ?hasUnit . }
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.results.bindings.length === 0) {
        return null;
      }

      const binding = result.results.bindings[0];
      return {
        iri: iri,
        label: binding.label.value,
        hasCalculationMethod: binding.hasCalculationMethod.value as 'direct_measurement' | 'calculation_model',
        hasType: binding.hasType?.value,
        hasMetricType: binding.hasMetricType?.value,
        hasUnit: binding.hasUnit?.value
      };
    } catch (error) {
      throw new GraphDBQueryError(`Failed to fetch metric: ${iri}`, { originalError: error });
    }
  }

  /**
   * 检查指标是否存在
   */
  private async metricExists(iri: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      ASK { <${iri}> a esg:Metric . }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      return result.boolean || false;
    } catch (error) {
      throw new GraphDBQueryError('Failed to check metric existence', { originalError: error });
    }
  }

  /**
   * 验证标签唯一性
   */
  private async validateLabelUniqueness(label: string, excludeUri?: string): Promise<void> {
    const query = `
      ${this.prefix}
      SELECT ?metric WHERE {
        ?metric a esg:Metric .
        ?metric rdfs:label "${this.escapeSparql(label)}" .
        ${excludeUri ? `FILTER(?metric != <${excludeUri}>)` : ''}
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.results.bindings.length > 0) {
        throw new ValidationError(`Metric with label "${label}" already exists`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to validate label uniqueness', { originalError: error });
    }
  }

  /**
   * 获取指标的依赖关系（哪些模型使用该指标作为输入）
   */
  private async getMetricDependencies(iri: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      SELECT DISTINCT ?model ?modelLabel WHERE {
        ?model esg:requiresInputFrom <${iri}> .
        ?model rdfs:label ?modelLabel .
      }
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      return result.results.bindings.map((b: any) => b.model.value);
    } catch (error) {
      throw new GraphDBQueryError('Failed to get metric dependencies', { originalError: error });
    }
  }

  /**
   * 获取指标关联的计算模型
   */
  private async getMetricModel(iri: string): Promise<string | null> {
    const query = `
      ${this.prefix}
      SELECT ?model WHERE {
        <${iri}> esg:isCalculatedBy ?model .
      }
      LIMIT 1
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);
      if (result.results.bindings.length === 0) {
        return null;
      }
      return result.results.bindings[0].model.value;
    } catch (error) {
      throw new GraphDBQueryError('Failed to get metric model', { originalError: error });
    }
  }

  /**
   * 获取指标的所有计算模型
   * 用于 GET /api/kg/metrics/:id/models
   */
  async getModelsByMetricId(metricUri: string): Promise<any> {
    const query = `
      ${this.prefix}
      
      SELECT ?model ?label ?calculationType ?formula ?mathematicalExpression
             ?implementation ?implLabel ?implLanguage
             ?inputMetric ?inputLabel
      WHERE {
        <${metricUri}> esg:isCalculatedBy ?model .
        ?model rdfs:label ?label .
        
        OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        OPTIONAL { ?model esg:hasFormula ?formula . }
        OPTIONAL { ?model esg:hasMathematicalExpression ?mathematicalExpression . }
        
        # 获取实现信息
        OPTIONAL {
          ?model esg:executesWith ?implementation .
          ?implementation rdfs:label ?implLabel .
          OPTIONAL { ?implementation esg:hasLanguage ?implLanguage . }
        }
        
        # 获取输入指标
        OPTIONAL {
          ?model esg:requiresInputFrom ?inputMetric .
          ?inputMetric rdfs:label ?inputLabel .
        }
      }
      ORDER BY ?label
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      // 组织数据结构
      const modelsMap = new Map();

      for (const binding of result.results.bindings) {
        const modelIri = binding.model.value;

        if (!modelsMap.has(modelIri)) {
          modelsMap.set(modelIri, {
            iri: modelIri,
            label: binding.label.value,
            calculationType: binding.calculationType?.value,
            formula: binding.formula?.value,
            mathematicalExpression: binding.mathematicalExpression?.value,
            implementation: binding.implementation ? {
              iri: binding.implementation.value,
              label: binding.implLabel?.value,
              language: binding.implLanguage?.value
            } : undefined,
            inputMetrics: []
          });
        }

        // 添加输入指标
        if (binding.inputMetric) {
          const model = modelsMap.get(modelIri);
          const inputExists = model.inputMetrics.some((im: any) => im.iri === binding.inputMetric.value);
          if (!inputExists) {
            model.inputMetrics.push({
              iri: binding.inputMetric.value,
              label: binding.inputLabel?.value
            });
          }
        }
      }

      return Array.from(modelsMap.values());
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get models for metric: ${metricUri}`,
        { metricUri, originalError: error }
      );
    }
  }

  /**
   * 获取依赖该指标作为输入的所有模型
   * 用于 GET /api/kg/metrics/:id/models?usage=input
   */
  async getModelsUsingMetricAsInput(metricUri: string): Promise<any> {
    const query = `
      ${this.prefix}
      
      SELECT ?model ?label ?calculationType ?formula ?mathematicalExpression
             ?implementation ?implLabel ?implLanguage
             ?outputMetric ?outputLabel
             ?inputMetric ?inputLabel
      WHERE {
        ?model esg:requiresInputFrom <${metricUri}> .
        ?model rdfs:label ?label .
        
        OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        OPTIONAL { ?model esg:hasFormula ?formula . }
        OPTIONAL { ?model esg:hasMathematicalExpression ?mathematicalExpression . }
        
        # 获取实现信息
        OPTIONAL {
          ?model esg:executesWith ?implementation .
          ?implementation rdfs:label ?implLabel .
          OPTIONAL { ?implementation esg:hasLanguage ?implLanguage . }
        }
        
        # 获取该模型计算的输出指标
        OPTIONAL {
          ?outputMetric esg:isCalculatedBy ?model .
          ?outputMetric rdfs:label ?outputLabel .
        }
        
        # 获取该模型的所有输入指标
        OPTIONAL {
          ?model esg:requiresInputFrom ?inputMetric .
          ?inputMetric rdfs:label ?inputLabel .
        }
      }
      ORDER BY ?label
    `;

    try {
      const result = await this.graphDB.executeSparqlQuery(query);

      // 组织数据结构
      const modelsMap = new Map();

      for (const binding of result.results.bindings) {
        const modelIri = binding.model.value;

        if (!modelsMap.has(modelIri)) {
          modelsMap.set(modelIri, {
            iri: modelIri,
            label: binding.label.value,
            calculationType: binding.calculationType?.value,
            formula: binding.formula?.value,
            mathematicalExpression: binding.mathematicalExpression?.value,
            implementation: binding.implementation ? {
              iri: binding.implementation.value,
              label: binding.implLabel?.value,
              language: binding.implLanguage?.value
            } : undefined,
            outputMetric: binding.outputMetric ? {
              iri: binding.outputMetric.value,
              label: binding.outputLabel?.value
            } : undefined,
            inputMetrics: []
          });
        }

        // 添加输入指标
        if (binding.inputMetric) {
          const model = modelsMap.get(modelIri);
          const inputExists = model.inputMetrics.some((im: any) => im.iri === binding.inputMetric.value);
          if (!inputExists) {
            model.inputMetrics.push({
              iri: binding.inputMetric.value,
              label: binding.inputLabel?.value
            });
          }
        }
      }

      return Array.from(modelsMap.values());
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get models using metric as input: ${metricUri}`,
        { metricUri, originalError: error }
      );
    }
  }

  /**
   * 解析指标 URI（支持多种格式）
   */
  private resolveMetricUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    if (id.startsWith('esg:')) {
      return id.replace('esg:', ESG_PREFIX);
    }
    return `${ESG_PREFIX}${id}`;
  }

  /**
   * 生成 URI 后缀（基于 label）
   */
  private generateUriSuffix(label: string): string {
    return label
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_');
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
