import { GraphDBRepository } from './graphDBRepository';
import {
  Model,
  ModelDTO,
  ModelDetailDTO,
  PaginationInfo,
  GetModelsRequest,
  CreateModelRequest,
  UpdateModelRequest,
  DeleteModelRequest
} from '../types/kg';
import { DeleteConflictError } from '../types/errors';

export class ModelRepository {
  private graphDB: GraphDBRepository;

  constructor() {
    this.graphDB = new GraphDBRepository();
  }

  /**
   * 获取模型列表
   */
  public async getModels(params: GetModelsRequest): Promise<{ models: ModelDTO[], total: number }> {
    const { page = 1, size = 10, search, calculationType, sort = 'label', order = 'asc' } = params;
    const offset = (page - 1) * size;

    let filterClause = '';
    if (search) {
      filterClause += `FILTER(CONTAINS(LCASE(?label), LCASE("${search}")))`;
    }
    if (calculationType) {
      filterClause += `FILTER(?calculationType = "${calculationType}")`;
    }

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      SELECT DISTINCT ?model ?label ?calculationType ?formula ?mathExpr ?impl ?implLabel ?createdAt
      WHERE {
        ?model rdf:type esg:Model ;
               rdfs:label ?label .
        
        OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        OPTIONAL { ?model esg:hasFormula ?formula . }
        OPTIONAL { ?model esg:hasMathematicalExpression ?mathExpr . }
        OPTIONAL { 
          ?model esg:executesWith ?impl .
          ?impl rdfs:label ?implLabel .
        }
        OPTIONAL { ?model dcterms:created ?createdAt . }

        ${filterClause}
      }
      ORDER BY ${order === 'asc' ? 'ASC' : 'DESC'}(?${sort})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    const countQuery = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT (COUNT(DISTINCT ?model) as ?count)
      WHERE {
        ?model rdf:type esg:Model ;
               rdfs:label ?label .
        
        OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        
        ${filterClause}
      }
    `;

    const [results, countResult] = await Promise.all([
      this.graphDB.executeSparqlQuery(query),
      this.graphDB.executeSparqlQuery(countQuery)
    ]);

    const total = parseInt(countResult.results.bindings[0]?.count?.value || '0', 10);

    const models: ModelDTO[] = results.results.bindings.map((binding: any) => ({
      iri: binding.model.value,
      label: binding.label.value,
      calculationType: binding.calculationType?.value,
      formula: binding.formula?.value,
      mathematicalExpression: binding.mathExpr?.value,
      implementation: binding.impl ? {
        iri: binding.impl.value,
        label: binding.implLabel?.value || ''
      } : undefined
    }));

    return { models, total };
  }

  /**
   * 获取模型详情
   */
  public async getModelById(id: string): Promise<ModelDetailDTO | null> {
    // 处理 ID 可能是 URI 或 label 的情况
    let filterClause = '';
    if (id.startsWith('http')) {
      filterClause = `FILTER(?model = <${id}>)`;
    } else if (id.includes(':')) {
      // 假设是 CURIE 格式，这里简单处理，实际可能需要前缀展开
      const iri = id.replace('esg:', 'http://example.org/esg#');
      filterClause = `FILTER(?model = <${iri}>)`;
    } else {
      // 尝试作为 label 或 URI 后缀匹配
      filterClause = `
        FILTER(
          ?label = "${id}" || 
          STRENDS(STR(?model), "#${id}") || 
          STRENDS(STR(?model), "/${id}")
        )
      `;
    }

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      SELECT ?model ?label ?calculationType ?formula ?mathExpr ?description ?createdAt ?updatedAt
             ?impl ?implLabel ?implLang
      WHERE {
        ?model rdf:type esg:Model ;
               rdfs:label ?label .
        
        OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        OPTIONAL { ?model esg:hasFormula ?formula . }
        OPTIONAL { ?model esg:hasMathematicalExpression ?mathExpr . }
        OPTIONAL { ?model rdfs:comment ?description . }
        OPTIONAL { ?model dcterms:created ?createdAt . }
        OPTIONAL { ?model dcterms:modified ?updatedAt . }
        
        OPTIONAL { 
          ?model esg:executesWith ?impl .
          ?impl rdfs:label ?implLabel .
          OPTIONAL { ?impl esg:hasLanguage ?implLang . }
        }

        ${filterClause}
      }
      LIMIT 1
    `;

    const result = await this.graphDB.executeSparqlQuery(query);

    if (!result.results.bindings.length) {
      return null;
    }

    const binding = result.results.bindings[0];

    // 获取输入指标
    const inputsQuery = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?metric ?label
      WHERE {
        <${binding.model.value}> esg:requiresInputFrom ?metric .
        ?metric rdfs:label ?label .
      }
    `;

    const inputsResult = await this.graphDB.executeSparqlQuery(inputsQuery);
    const inputMetrics = inputsResult.results.bindings.map((b: any) => ({
      iri: b.metric.value,
      label: b.label.value
    }));

    return {
      iri: binding.model.value,
      label: binding.label.value,
      calculationType: binding.calculationType?.value,
      formula: binding.formula?.value,
      mathematicalExpression: binding.mathExpr?.value,
      // @ts-ignore - 扩展属性
      description: binding.description?.value,
      createdAt: binding.createdAt?.value,
      updatedAt: binding.updatedAt?.value,
      implementation: binding.impl ? {
        iri: binding.impl.value,
        label: binding.implLabel?.value || '',
        language: binding.implLang?.value
      } : undefined,
      // @ts-ignore - 扩展属性
      inputMetrics
    };
  }

  /**
   * 创建模型
   */
  public async createModel(data: CreateModelRequest): Promise<string> {
    const iri = `http://example.org/esg#${data.name.replace(/\s+/g, '_')}`;
    const now = new Date().toISOString();

    let triples = `
      <${iri}> rdf:type esg:Model ;
               rdfs:label "${data.name}" ;
               esg:hasCalculationType "${data.calculation_type}" ;
               dcterms:created "${now}" ;
               dcterms:modified "${now}" .
    `;

    if (data.description) {
      triples += `<${iri}> rdfs:comment "${data.description}" . \n`;
    }
    if (data.formula) {
      triples += `<${iri}> esg:hasFormula "${data.formula}" . \n`;
    }
    if (data.mathematical_expression) {
      triples += `<${iri}> esg:hasMathematicalExpression "${data.mathematical_expression}" . \n`;
    }

    // 关联实现
    if (data.implementation) {
      const implUri = data.implementation.startsWith('http') ? data.implementation : `http://example.org/esg#${data.implementation}`;
      triples += `<${iri}> esg:executesWith <${implUri}> . \n`;
    }

    // 关联输入指标
    if (data.input_metrics && data.input_metrics.length > 0) {
      data.input_metrics.forEach(metric => {
        const metricUri = metric.startsWith('http') ? metric : `http://example.org/esg#${metric}`;
        triples += `<${iri}> esg:requiresInputFrom <${metricUri}> . \n`;
      });
    }

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      INSERT DATA {
        ${triples}
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
    return iri;
  }

  /**
   * 更新模型
   */
  public async updateModel(id: string, data: UpdateModelRequest): Promise<void> {
    const now = new Date().toISOString();

    // 构建删除和插入的 triples
    let deleteTriples = '';
    let insertTriples = `<${id}> dcterms:modified "${now}" . \n`;

    if (data.label) {
      deleteTriples += `<${id}> rdfs:label ?label . \n`;
      insertTriples += `<${id}> rdfs:label "${data.label}" . \n`;
    }
    if (data.calculation_type) {
      deleteTriples += `<${id}> esg:hasCalculationType ?calcType . \n`;
      insertTriples += `<${id}> esg:hasCalculationType "${data.calculation_type}" . \n`;
    }
    if (data.description !== undefined) {
      deleteTriples += `<${id}> rdfs:comment ?desc . \n`;
      if (data.description) insertTriples += `<${id}> rdfs:comment "${data.description}" . \n`;
    }
    if (data.formula !== undefined) {
      deleteTriples += `<${id}> esg:hasFormula ?formula . \n`;
      if (data.formula) insertTriples += `<${id}> esg:hasFormula "${data.formula}" . \n`;
    }
    if (data.mathematical_expression !== undefined) {
      deleteTriples += `<${id}> esg:hasMathematicalExpression ?mathExpr . \n`;
      if (data.mathematical_expression) insertTriples += `<${id}> esg:hasMathematicalExpression "${data.mathematical_expression}" . \n`;
    }

    // 关联更新比较复杂，通常是先删除旧的再添加新的
    if (data.implementation) {
      deleteTriples += `<${id}> esg:executesWith ?impl . \n`;
      const implUri = data.implementation.startsWith('http') ? data.implementation : `http://example.org/esg#${data.implementation}`;
      insertTriples += `<${id}> esg:executesWith <${implUri}> . \n`;
    }

    if (data.input_metrics) {
      deleteTriples += `<${id}> esg:requiresInputFrom ?input . \n`;
      data.input_metrics.forEach(metric => {
        const metricUri = metric.startsWith('http') ? metric : `http://example.org/esg#${metric}`;
        insertTriples += `<${id}> esg:requiresInputFrom <${metricUri}> . \n`;
      });
    }

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      DELETE {
        ${deleteTriples}
      }
      INSERT {
        ${insertTriples}
      }
      WHERE {
        <${id}> rdf:type esg:Model .
        OPTIONAL { <${id}> rdfs:label ?label }
        OPTIONAL { <${id}> esg:hasCalculationType ?calcType }
        OPTIONAL { <${id}> rdfs:comment ?desc }
        OPTIONAL { <${id}> esg:hasFormula ?formula }
        OPTIONAL { <${id}> esg:hasMathematicalExpression ?mathExpr }
        OPTIONAL { <${id}> esg:executesWith ?impl }
        OPTIONAL { <${id}> esg:requiresInputFrom ?input }
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 删除模型
   */
  public async deleteModel(id: string, options: DeleteModelRequest): Promise<void> {
    // 如果不是强制删除，应该检查是否有指标使用此模型 (esg:isCalculatedBy)
    if (!options.force) {
      const checkQuery = `
        PREFIX esg: <http://example.org/esg#>
        ASK {
          ?metric esg:isCalculatedBy <${id}> .
        }
      `;
      const result = await this.graphDB.executeSparqlQuery(checkQuery);
      const isUsed = result.boolean;
      if (isUsed) {
        throw new DeleteConflictError('Model is used by metrics. Use force=true to delete anyway.');
      }
    }

    const query = `
      DELETE WHERE {
        <${id}> ?p ?o .
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 获取模型的输入指标列表
   */
  public async getModelInputMetrics(modelId: string): Promise<Array<{ iri: string; label: string; hasCalculationMethod?: 'direct_measurement' | 'calculation_model'; hasUnit?: string; hasMetricType?: string }>> {
    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?metric ?label ?hasCalculationMethod ?hasUnit ?hasMetricType
      WHERE {
        <${modelId}> esg:requiresInputFrom ?metric .
        ?metric rdfs:label ?label .
        OPTIONAL { ?metric esg:hasCalculationMethod ?hasCalculationMethod . }
        OPTIONAL { ?metric esg:hasUnit ?hasUnit . }
        OPTIONAL { ?metric esg:hasMetricType ?hasMetricType . }
      }
      ORDER BY ?label
    `;

    const result = await this.graphDB.executeSparqlQuery(query);
    return result.results.bindings.map((binding: any) => ({
      iri: binding.metric.value,
      label: binding.label.value,
      hasCalculationMethod: binding.hasCalculationMethod?.value as 'direct_measurement' | 'calculation_model' | undefined,
      hasUnit: binding.hasUnit?.value,
      hasMetricType: binding.hasMetricType?.value
    }));
  }

  /**
   * 获取模型的输出指标
   */
  public async getModelOutputMetric(modelId: string): Promise<{ iri: string; label: string; hasCalculationMethod: 'calculation_model'; hasUnit?: string; hasMetricType?: string } | null> {
    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?metric ?label ?hasCalculationMethod ?hasUnit ?hasMetricType
      WHERE {
        ?metric esg:isCalculatedBy <${modelId}> .
        ?metric rdfs:label ?label .
        ?metric esg:hasCalculationMethod ?hasCalculationMethod .
        OPTIONAL { ?metric esg:hasUnit ?hasUnit . }
        OPTIONAL { ?metric esg:hasMetricType ?hasMetricType . }
      }
      LIMIT 1
    `;

    const result = await this.graphDB.executeSparqlQuery(query);
    if (result.results.bindings.length === 0) {
      return null;
    }

    const binding = result.results.bindings[0];
    return {
      iri: binding.metric.value,
      label: binding.label.value,
      hasCalculationMethod: 'calculation_model',
      hasUnit: binding.hasUnit?.value,
      hasMetricType: binding.hasMetricType?.value
    };
  }

  /**
   * 更新模型的输入指标列表
   */
  public async updateModelInputMetrics(modelId: string, inputMetricIds: string[]): Promise<void> {
    const now = new Date().toISOString();

    // 构建新的输入指标三元组
    let insertTriples = `<${modelId}> dcterms:modified "${now}" . \n`;
    inputMetricIds.forEach(metricId => {
      const metricUri = metricId.startsWith('http') ? metricId : `http://example.org/esg#${metricId}`;
      insertTriples += `<${modelId}> esg:requiresInputFrom <${metricUri}> . \n`;
    });

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      DELETE {
        <${modelId}> esg:requiresInputFrom ?oldMetric .
      }
      INSERT {
        ${insertTriples}
      }
      WHERE {
        <${modelId}> rdf:type esg:Model .
        OPTIONAL { <${modelId}> esg:requiresInputFrom ?oldMetric . }
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 添加单个输入指标到模型
   */
  public async addModelInputMetric(modelId: string, metricId: string): Promise<void> {
    const metricUri = metricId.startsWith('http') ? metricId : `http://example.org/esg#${metricId}`;
    const now = new Date().toISOString();

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      INSERT DATA {
        <${modelId}> esg:requiresInputFrom <${metricUri}> .
        <${modelId}> dcterms:modified "${now}" .
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 删除模型的单个输入指标
   */
  public async removeModelInputMetric(modelId: string, metricId: string): Promise<void> {
    const metricUri = metricId.startsWith('http') ? metricId : `http://example.org/esg#${metricId}`;
    const now = new Date().toISOString();

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      DELETE {
        <${modelId}> esg:requiresInputFrom <${metricUri}> .
      }
      INSERT {
        <${modelId}> dcterms:modified "${now}" .
      }
      WHERE {
        <${modelId}> esg:requiresInputFrom <${metricUri}> .
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 获取模型的实现列表
   */
  public async getModelImplementations(modelId: string): Promise<Array<{ iri: string; label: string; language?: string; filePath?: string; functionName?: string }>> {
    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?impl ?label ?language ?filePath ?functionName
      WHERE {
        <${modelId}> esg:executesWith ?impl .
        ?impl rdfs:label ?label .
        OPTIONAL { ?impl esg:hasLanguage ?language . }
        OPTIONAL { ?impl esg:hasFilePath ?filePath . }
        OPTIONAL { ?impl esg:hasFunction ?functionName . }
      }
      ORDER BY ?label
    `;

    const result = await this.graphDB.executeSparqlQuery(query);

    return result.results.bindings.map((binding: any) => ({
      iri: binding.impl.value,
      label: binding.label.value,
      language: binding.language?.value,
      filePath: binding.filePath?.value,
      functionName: binding.functionName?.value
    }));
  }

  /**
   * 添加实现到模型
   */
  public async addModelImplementation(modelId: string, implementationId: string): Promise<void> {
    const implUri = implementationId.startsWith('http') ? implementationId : `http://example.org/esg#${implementationId}`;
    const now = new Date().toISOString();

    const query = `
      PREFIX esg: <http://example.org/esg#>
      PREFIX dcterms: <http://purl.org/dc/terms/>

      INSERT DATA {
        <${modelId}> esg:executesWith <${implUri}> .
        <${modelId}> dcterms:modified "${now}" .
      }
    `;

    await this.graphDB.executeSparqlQuery(query);
  }
}
