import { config } from '../config';
import { GraphDBQueryError } from '../types/errors';
import { MetricAttributesMap, DataSourceInfo, Implementation, ImplementationDetails, ImplementationByCalculationType, CalculationType } from '../types/kg';

/**
 * Knowledge Graph Repository - 处理与知识图谱的 SPARQL 查询
 */
export class KnowledgeGraphRepository {
  private graphDBEndpoint: string;
  private ESG_PREFIX = 'PREFIX esg: <http://example.org/esg#>';
  private RDFS_PREFIX = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>';

  constructor() {
    // 使用环境变量或默认配置
    const GRAPHDB_BASE_URL = process.env.GRAPHDB_URL || config.GRAPHDB_URL;
    const REPOSITORY_ID = process.env.GRAPHDB_REPOSITORY || config.GRAPHDB_REPO;
    this.graphDBEndpoint = `${GRAPHDB_BASE_URL}/repositories/${REPOSITORY_ID}`;
  }

  /**
   * 执行 SPARQL 查询
   */
  private async executeSparqlQuery(query: string): Promise<any> {
    try {
      const response = await fetch(this.graphDBEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
          'Accept': 'application/sparql-results+json'
        },
        body: query
      });

      if (!response.ok) {
        throw new GraphDBQueryError(
          `GraphDB query failed: ${response.status} ${response.statusText}`,
          { query, status: response.status }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `GraphDB query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { query, originalError: error }
      );
    }
  }

  /**
   * 获取行业对应的报告框架
   */
  async getReportFrameworks(industry: string): Promise<string[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?frameworkLabel WHERE {
        ?industry a esg:Industry ;
                  rdfs:label "${industry}" ;
                  esg:reportsUsing ?framework .

        ?framework a esg:ReportingFramework ;
                   rdfs:label ?frameworkLabel ;
      }
      ORDER BY ?frameworkLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const frameworks: string[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.frameworkLabel && binding.frameworkLabel.value) {
            frameworks.push(binding.frameworkLabel.value);
          }
        }
      }

      return frameworks;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get report frameworks for industry: ${industry}`,
        { industry, originalError: error }
      );
    }
  }

  /**
   * 获取行业和报告框架对应的分类
   */
  async getCategoriesByIndustryAndFramework(industry: string, framework: string): Promise<string[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?category ?categoryLabel WHERE {
        ?industry a esg:Industry ;
                  rdfs:label "${industry}" ;
                  esg:reportsUsing ?framework .

        ?framework a esg:ReportingFramework ;
                   rdfs:label "${framework}" ;
                   esg:includes ?category .
        ?category a esg:Category ;
                  rdfs:label ?categoryLabel .
      }
      ORDER BY ?categoryLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const categories: string[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.categoryLabel && binding.categoryLabel.value) {
            categories.push(binding.categoryLabel.value);
          }
        }
      }

      return categories;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get categories for industry: ${industry} and framework: ${framework}`,
        { industry, framework, originalError: error }
      );
    }
  }

  /**
   * 获取分类下的指标
   */
  async getMetricsByIndustryAndCategory(industry: string, categoryLabel: string, framework: string): Promise<string[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?metric ?metricLabel WHERE {
        ?industry a esg:Industry ;
                  rdfs:label "${industry}" ;
                  esg:reportsUsing ?framework .

        ?framework a esg:ReportingFramework ;
                   rdfs:label "${framework}" ;
                   esg:includes ?category .

        ?category a esg:Category ;
                  rdfs:label "${categoryLabel}" ;
                  esg:consistsOf ?metric .

        ?metric a esg:Metric ;
                rdfs:label ?metricLabel .
      }
      ORDER BY ?metricLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const metrics: string[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.metricLabel && binding.metricLabel.value) {
            metrics.push(binding.metricLabel.value);
          }
        }
      }

      return metrics;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get metrics for industry: ${industry}, category: ${categoryLabel}, framework: ${framework}`,
        { industry, categoryLabel, framework, originalError: error }
      );
    }
  }

  /**
   * 获取分类下的指标URIs（高性能版本）
   */
  async getMetricUrisByIndustryAndCategory(industry: string, categoryLabel: string, framework: string): Promise<string[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?metric WHERE {
        ?industry a esg:Industry ;
                  rdfs:label "${industry}" ;
                  esg:reportsUsing ?framework .

        ?framework a esg:ReportingFramework ;
                   rdfs:label "${framework}" ;
                   esg:includes ?category .

        ?category a esg:Category ;
                  rdfs:label "${categoryLabel}" ;
                  esg:consistsOf ?metric .

        ?metric a esg:Metric .
      }
      ORDER BY ?metric
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const metricUris: string[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.metric && binding.metric.value) {
            // 提取URI的本地名称部分（去掉命名空间前缀）
            const uri = binding.metric.value;
            const localName = uri.includes('#') ? uri.split('#').pop() : uri.split('/').pop();
            metricUris.push(`esg:${localName}`);
          }
        }
      }

      return metricUris;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get metric URIs for industry: ${industry}, category: ${categoryLabel}, framework: ${framework}`,
        { industry, categoryLabel, framework, originalError: error }
      );
    }
  }

  /**
   * 获取分类下使用 model calculation 方法的指标
   */
  async getModelCalculationMetricsByCategory(
    industry: string, 
    categoryLabel: string, 
    framework: string
  ): Promise<string[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?metricLabel WHERE {
        ?industry a esg:Industry ;
                  rdfs:label "${industry}" ;
                  esg:reportsUsing ?framework .

        ?framework a esg:ReportingFramework ;
                   rdfs:label "${framework}" ;
                   esg:includes ?category .

        ?category a esg:Category ;
                  rdfs:label "${categoryLabel}" ;
                  esg:consistsOf ?metric .

        ?metric a esg:Metric ;
                rdfs:label ?metricLabel ;
                esg:hasCalculationMethod "calculation_model" .
      }
      ORDER BY ?metricLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const metrics: string[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.metricLabel && binding.metricLabel.value) {
            metrics.push(binding.metricLabel.value);
          }
        }
      }

      return metrics;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get model calculation metrics for industry: ${industry}, category: ${categoryLabel}, framework: ${framework}`,
        { industry, categoryLabel, framework, originalError: error }
      );
    }
  }

  /**
   * 获取指标属性
   */
  async getMetricAttributes(metricLabel: string): Promise<MetricAttributesMap> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}
      SELECT ?p ?o WHERE {
        ?metric a esg:Metric ;
                rdfs:label "${metricLabel}" ;
                ?p ?o .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings) {
        return this.createDataMapFromGraphDB(result.results.bindings);
      }
      
      return new Map<string, string>();
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get attributes for metric: ${metricLabel}`,
        { metricLabel, originalError: error }
      );
    }
  }

  /**
   * 获取数据点属性
   */
  async getDataPointAttributes(metric: string): Promise<MetricAttributesMap> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?p ?o WHERE {
            esg:${metric} ?p ?o .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings) {
        return this.createDataMapFromGraphDB(result.results.bindings);
      }
      
      return new Map<string, string>();
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get data point attributes for: ${metric}`,
        { metric, originalError: error }
      );
    }
  }

  /**
   * 获取数据源信息
   */
  async getDataSourceInfo(source: string): Promise<string | undefined> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?p ?o WHERE {
            esg:${source} ?p ?o .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings) {
        const resultMap = this.createDataMapFromGraphDB(result.results.bindings);
        return resultMap.get('label');
      }
      
      return undefined;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to retrieve source of node: ${source}`,
        { source, originalError: error }
      );
    }
  }

  /**
   * 获取指标的最佳数据源
   */
  async getBestDataSourceForMetric(metricID: string): Promise<DataSourceInfo | null> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}
      SELECT ?dataSourceID ?disclosureType WHERE {
        ?observation a esg:Observation ;
                    esg:metric ?metric ;
                    esg:disclosureType ?disclosureType .
        
        ?metric rdfs:label "${metricID}" .
        
        # obtainedFrom is optional - calculated metrics don't have it
        OPTIONAL {
          ?observation esg:obtainedFrom ?dataSourceID .
        }
      }
      ORDER BY 
        (IF(?disclosureType = esg:regulatory_filing, 1, 
            IF(?disclosureType = esg:company_report, 2, 
                IF(?disclosureType = esg:third_party, 3, 4))))
    `;

    try {
      const results = await this.executeSparqlQuery(query);
      
      if (results.results.bindings.length > 0) {
        const binding = results.results.bindings[0];
        const dataSourceID = binding.dataSourceID?.value || '';
        const disclosureType = binding.disclosureType?.value?.split('#')[1] || 'unknown';
        
        return {
          dataSourceID,
          disclosureType
        };
      }
      
      return null;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get best data source for metric: ${metricID}`,
        { metricID, originalError: error }
      );
    }
  }

  /**
   * 获取模型对应的实现
   */
  async getImplementationByModel(modelLabel: string): Promise<Implementation> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?implementationLabel ?language ?filePath ?functionName ?description WHERE {
        ?model a esg:Model ;
               rdfs:label "${modelLabel}" ;
               esg:executesWith ?implementation .
        
        ?implementation a esg:Implementation ;
                       rdfs:label ?implementationLabel ;
                       esg:hasLanguage ?language ;
                       esg:hasFilePath ?filePath ;
                       esg:hasFunction ?functionName ;
                       esg:hasDescription ?description .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings && result.results.bindings.length > 0) {
        const binding = result.results.bindings[0];
        return {
          iri: binding.implementation?.value || '',
          label: binding.implementationLabel?.value || '',
          language: binding.language?.value,
          filePath: binding.filePath?.value,
          functionName: binding.functionName?.value
        };
      }
      
      throw new GraphDBQueryError(
        `No implementation found for model: ${modelLabel}`,
        { modelLabel }
      );
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `Failed to get implementation for model: ${modelLabel}`,
        { modelLabel, originalError: error }
      );
    }
  }

  /**
   * 获取实现详情
   */
  async getImplementationDetails(implementationLabel: string): Promise<ImplementationDetails> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?label ?language ?filePath ?functionName ?description ?inputParameters ?returnType ?validation WHERE {
        ?implementation a esg:Implementation ;
                       rdfs:label "${implementationLabel}" ;
                       rdfs:label ?label ;
                       esg:hasLanguage ?language ;
                       esg:hasFilePath ?filePath ;
                       esg:hasFunction ?functionName ;
                       esg:hasDescription ?description ;
                       esg:hasInputParameters ?inputParameters ;
                       esg:hasReturnType ?returnType ;
                       esg:hasValidation ?validation .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings && result.results.bindings.length > 0) {
        const binding = result.results.bindings[0];
        return {
          iri: binding.implementation?.value || '',
          label: binding.label?.value,
          language: binding.language?.value,
          filePath: binding.filePath?.value,
          functionName: binding.functionName?.value,
          returnType: binding.returnType?.value,
          validation: binding.validation?.value
        };
      }
      
      throw new GraphDBQueryError(
        `No implementation found with label: ${implementationLabel}`,
        { implementationLabel }
      );
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `Failed to get implementation details for: ${implementationLabel}`,
        { implementationLabel, originalError: error }
      );
    }
  }

  /**
   * 获取所有实现
   */
  async getAllImplementations(): Promise<Array<{label: string; language: string; description: string}>> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?label ?language ?description WHERE {
        ?implementation a esg:Implementation ;
                       rdfs:label ?label ;
                       esg:hasLanguage ?language ;
                       esg:hasDescription ?description .
      }
      ORDER BY ?label
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const implementations: Array<{label: string; language: string; description: string}> = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.label && binding.language && binding.description) {
            implementations.push({
              label: binding.label.value,
              language: binding.language.value,
              description: binding.description.value
            });
          }
        }
      }

      return implementations;
    } catch (error) {
      throw new GraphDBQueryError(
        'Failed to get all implementations',
        { originalError: error }
      );
    }
  }

  /**
   * 按计算类型获取实现
   */
  async getImplementationsByCalculationType(calculationType: string): Promise<ImplementationByCalculationType[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?implementationLabel ?modelLabel ?filePath ?functionName ?description WHERE {
        ?model a esg:Model ;
               rdfs:label ?modelLabel ;
               esg:hasCalculationType "${calculationType}" ;
               esg:executesWith ?implementation .
        
        ?implementation a esg:Implementation ;
                       rdfs:label ?implementationLabel ;
                       esg:hasFilePath ?filePath ;
                       esg:hasFunction ?functionName ;
                       esg:hasDescription ?description .
      }
      ORDER BY ?implementationLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const implementations: ImplementationByCalculationType[] = [];

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.implementationLabel && binding.modelLabel && binding.filePath && binding.functionName && binding.description) {
            implementations.push({
              implementationLabel: binding.implementationLabel.value,
              modelLabel: binding.modelLabel.value,
              filePath: binding.filePath.value,
              functionName: binding.functionName.value,
              description: binding.description.value
            });
          }
        }
      }

      return implementations;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementations for calculation type: ${calculationType}`,
        { calculationType, originalError: error }
      );
    }
  }

  /**
   * 获取所有计算类型
   */
  async getAllCalculationTypes(): Promise<CalculationType[]> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?calculationType ?modelLabel WHERE {
        ?model a esg:Model ;
               rdfs:label ?modelLabel ;
               esg:hasCalculationType ?calculationType .
      }
      ORDER BY ?calculationType ?modelLabel
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const calculationTypeMap = new Map<string, Set<string>>();

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          if (binding.calculationType && binding.modelLabel) {
            const calcType = binding.calculationType.value;
            const modelLabel = binding.modelLabel.value;
            
            if (!calculationTypeMap.has(calcType)) {
              calculationTypeMap.set(calcType, new Set());
            }
            calculationTypeMap.get(calcType)!.add(modelLabel);
          }
        }
      }

      const calculationTypes = Array.from(calculationTypeMap.entries()).map(([calcType, modelLabels]) => ({
        calculationType: calcType,
        count: modelLabels.size,
        modelLabels: Array.from(modelLabels)
      }));

      return calculationTypes;
    } catch (error) {
      throw new GraphDBQueryError(
        'Failed to get calculation types',
        { originalError: error }
      );
    }
  }

  /**
   * 辅助方法：从 GraphDB 绑定创建数据映射
   */
  private createDataMapFromGraphDB(bindings: any[]): Map<string, string> {
    const dataMap = new Map<string, string>();

    bindings.forEach(binding => {
      const p = binding.p?.value;
      const o = binding.o?.value;

      if (p && o) {
        // 去除 IRI 前缀
        const predicate = this.removeIRI(p);
        const object = this.removeIRI(o);

        // 如果谓词已存在，追加对象值
        if (dataMap.has(predicate)) {
          const current = dataMap.get(predicate)!;
          dataMap.set(predicate, `${current}, ${object}`);
        } else {
          dataMap.set(predicate, object);
        }
      }
    });

    return dataMap;
  }

  /**
   * 获取Metric元数据和层次结构信息
   */
  async getMetricMetadata(metricIri: string): Promise<any> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?metric ?label ?hasType ?hasMetricType ?hasUnit ?hasCalculationMethod
             ?category ?categoryLabel ?framework ?frameworkLabel ?industry ?industryLabel
      WHERE {
        BIND(<${metricIri}> AS ?metric)
        ?metric a esg:Metric ;
                rdfs:label ?label ;
                esg:hasType ?hasType ;
                esg:hasMetricType ?hasMetricType ;
                esg:hasUnit ?hasUnit ;
                esg:hasCalculationMethod ?hasCalculationMethod .

        # 获取层次结构信息
        OPTIONAL {
          ?category esg:consistsOf ?metric ;
                    rdfs:label ?categoryLabel .
          
          ?framework esg:includes ?category ;
                     rdfs:label ?frameworkLabel .
          
          ?industry esg:reportsUsing ?framework ;
                    rdfs:label ?industryLabel .
        }
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      
      if (result.results && result.results.bindings && result.results.bindings.length > 0) {
        const binding = result.results.bindings[0];
        return {
          metric: {
            iri: metricIri,
            label: binding.label?.value,
            hasType: binding.hasType?.value,
            hasMetricType: binding.hasMetricType?.value,
            hasUnit: binding.hasUnit?.value,
            hasCalculationMethod: binding.hasCalculationMethod?.value
          },
          hierarchy: {
            category: binding.category ? {
              iri: binding.category.value,
              label: binding.categoryLabel?.value
            } : undefined,
            framework: binding.framework ? {
              iri: binding.framework.value,
              label: binding.frameworkLabel?.value
            } : undefined,
            industry: binding.industry ? {
              iri: binding.industry.value,
              label: binding.industryLabel?.value
            } : undefined
          }
        };
      }

      throw new GraphDBQueryError(
        `Metric not found: ${metricIri}`,
        { metricIri }
      );
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `Failed to get metric metadata: ${metricIri}`,
        { metricIri, originalError: error }
      );
    }
  }

  /**
   * 获取Metric的直接测量数据血缘
   */
  async getMetricDirectMeasurementLineage(metricIri: string): Promise<any> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?datasetVariable ?dvLabel ?confidenceScore ?isUnitCompatible ?alignmentReason
             ?dataSource ?dsLabel ?recordCount ?coverage ?fileName ?description
      WHERE {
        <${metricIri}> esg:obtainedFrom ?datasetVariable .
        
        ?datasetVariable a esg:DatasetVariable ;
                         rdfs:label ?dvLabel .
        
        OPTIONAL { ?datasetVariable esg:hasConfidenceScore ?confidenceScore . }
        OPTIONAL { ?datasetVariable esg:isUnitCompatible ?isUnitCompatible . }
        OPTIONAL { ?datasetVariable esg:alignmentReason ?alignmentReason . }
        
        OPTIONAL {
          ?datasetVariable esg:sourceFrom ?dataSource .
          ?dataSource rdfs:label ?dsLabel .
          OPTIONAL { ?dataSource esg:hasRecordCount ?recordCount . }
          OPTIONAL { ?dataSource esg:coverage ?coverage . }
          OPTIONAL { ?dataSource esg:fileName ?fileName . }
          OPTIONAL { ?dataSource esg:description ?description . }
        }
      }
      ORDER BY ?datasetVariable ?dataSource
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      const datasetVariables = new Map();

      if (result.results && result.results.bindings) {
        for (const binding of result.results.bindings) {
          const dvIri = binding.datasetVariable.value;
          
          if (!datasetVariables.has(dvIri)) {
            datasetVariables.set(dvIri, {
              iri: dvIri,
              label: binding.dvLabel?.value,
              confidenceScore: binding.confidenceScore ? parseInt(binding.confidenceScore.value) : undefined,
              isUnitCompatible: binding.isUnitCompatible?.value,
              alignmentReason: binding.alignmentReason?.value,
              sources: []
            });
          }

          if (binding.dataSource) {
            const dv = datasetVariables.get(dvIri);
            dv.sources.push({
              iri: binding.dataSource.value,
              label: binding.dsLabel?.value,
              recordCount: binding.recordCount ? parseInt(binding.recordCount.value) : undefined,
              coverage: binding.coverage?.value,
              fileName: binding.fileName?.value,
              description: binding.description?.value
            });
          }
        }
      }

      return Array.from(datasetVariables.values());
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get direct measurement lineage for metric: ${metricIri}`,
        { metricIri, originalError: error }
      );
    }
  }

  /**
   * 获取Metric的计算模型数据血缘
   */
  async getMetricCalculationModelLineage(metricIri: string): Promise<any> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?model ?modelLabel ?calculationType ?formula ?mathematicalExpression
             ?implementation ?implLabel ?language ?filePath ?functionName ?returnType
             ?inputMetric ?inputLabel ?inputCalculationMethod
             ?inputDatasetVariable ?inputDvLabel ?inputConfidenceScore
             ?inputDataSource ?inputDsLabel ?inputRecordCount
      WHERE {
        <${metricIri}> esg:isCalculatedBy ?model .
        
        ?model a esg:Model ;
               rdfs:label ?modelLabel .
        
        OPTIONAL { ?model esg:calculationType ?calculationType . }
        OPTIONAL { ?model esg:formula ?formula . }
        OPTIONAL { ?model esg:mathematicalExpression ?mathematicalExpression . }
        
        # 获取实现信息
        OPTIONAL {
          ?model esg:executesWith ?implementation .
          ?implementation rdfs:label ?implLabel .
          OPTIONAL { ?implementation esg:hasLanguage ?language . }
          OPTIONAL { ?implementation esg:hasFilePath ?filePath . }
          OPTIONAL { ?implementation esg:hasFunction ?functionName . }
          OPTIONAL { ?implementation esg:hasReturnType ?returnType . }
        }
        
        # 获取输入指标和其数据来源
        OPTIONAL {
          ?model esg:requiresInputFrom ?inputMetric .
          ?inputMetric rdfs:label ?inputLabel ;
                       esg:hasCalculationMethod ?inputCalculationMethod .
          
          OPTIONAL {
            ?inputMetric esg:obtainedFrom ?inputDatasetVariable .
            ?inputDatasetVariable rdfs:label ?inputDvLabel .
            OPTIONAL { ?inputDatasetVariable esg:hasConfidenceScore ?inputConfidenceScore . }
            
            OPTIONAL {
              ?inputDatasetVariable esg:sourceFrom ?inputDataSource .
              ?inputDataSource rdfs:label ?inputDsLabel .
              OPTIONAL { ?inputDataSource esg:hasRecordCount ?inputRecordCount . }
            }
          }
        }
      }
      ORDER BY ?inputMetric ?inputDatasetVariable ?inputDataSource
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      let modelInfo = null;
      const inputDataVariables = new Map();

      if (result.results && result.results.bindings && result.results.bindings.length > 0) {
        const bindings = result.results.bindings;
        
        // 提取模型信息（从第一行获取）
        const firstBinding = bindings[0];
        modelInfo = {
          iri: firstBinding.model?.value,
          label: firstBinding.modelLabel?.value,
          calculationType: firstBinding.calculationType?.value,
          formula: firstBinding.formula?.value,
          mathematicalExpression: firstBinding.mathematicalExpression?.value,
          implementation: firstBinding.implementation ? {
            iri: firstBinding.implementation.value,
            label: firstBinding.implLabel?.value,
            language: firstBinding.language?.value,
            filePath: firstBinding.filePath?.value,
            functionName: firstBinding.functionName?.value,
            returnType: firstBinding.returnType?.value
          } : null
        };

        // 收集输入数据变量
        for (const binding of bindings) {
          if (binding.inputDatasetVariable) {
            const dvIri = binding.inputDatasetVariable.value;
            
            if (!inputDataVariables.has(dvIri)) {
              inputDataVariables.set(dvIri, {
                iri: dvIri,
                label: binding.inputDvLabel?.value,
                confidenceScore: binding.inputConfidenceScore ? parseInt(binding.inputConfidenceScore.value) : undefined,
                sources: []
              });
            }

            if (binding.inputDataSource) {
              const dv = inputDataVariables.get(dvIri);
              const existingSource = dv.sources.find((s: any) => s.iri === binding.inputDataSource.value);
              if (!existingSource) {
                dv.sources.push({
                  iri: binding.inputDataSource.value,
                  label: binding.inputDsLabel?.value,
                  recordCount: binding.inputRecordCount ? parseInt(binding.inputRecordCount.value) : undefined
                });
              }
            }
          }
        }
      }

      return {
        model: modelInfo,
        inputs: Array.from(inputDataVariables.values())
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get calculation model lineage for metric: ${metricIri}`,
        { metricIri, originalError: error }
      );
    }
  }

  /**
   * 辅助方法：移除 IRI 前缀
   */
  private removeIRI(line: string): string {
    return line.includes('#') ? line.split('#').slice(1).join('#') : line;
  }

  /**
   * 执行 SPARQL UPDATE 操作
   */
  private async executeSparqlUpdate(updateQuery: string): Promise<void> {
    try {
      const response = await fetch(this.graphDBEndpoint + '/statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-update',
        },
        body: updateQuery
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBQueryError(
          `GraphDB update failed: ${response.status} ${response.statusText}`,
          { updateQuery, status: response.status, errorDetails: errorText }
        );
      }
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `GraphDB update execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { updateQuery, originalError: error }
      );
    }
  }

  /**
   * 检查实体是否存在
   */
  private async checkEntityExists(label: string, entityType: 'Implementation' | 'Model' | 'Metric'): Promise<boolean> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      ASK WHERE {
        ?entity a esg:${entityType} ;
                rdfs:label "${label}" .
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      return result.boolean === true;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to check if ${entityType} exists: ${label}`,
        { label, entityType, originalError: error }
      );
    }
  }

  /**
   * 根据 label 获取实体的完整信息
   */
  private async getEntityByLabel(label: string, entityType: 'Implementation' | 'Model' | 'Metric'): Promise<{ uri: string; label: string } | null> {
    const query = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      SELECT ?entity ?label WHERE {
        ?entity a esg:${entityType} ;
                rdfs:label "${label}" .
        BIND("${label}" as ?label)
      }
    `;

    try {
      const result = await this.executeSparqlQuery(query);
      if (result.results && result.results.bindings && result.results.bindings.length > 0) {
        const binding = result.results.bindings[0];
        return {
          uri: binding.entity.value,
          label: binding.label.value
        };
      }
      return null;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get ${entityType} by label: ${label}`,
        { label, entityType, originalError: error }
      );
    }
  }

  /**
   * 创建 Implementation
   */
  async createImplementation(
    name: string, 
    language: string, 
    filePath: string,
    functionName?: string,
    description?: string,
    inputParameters?: string,
    returnType?: string,
    validation?: string
  ): Promise<{ uri: string; label: string }> {
    // 检查是否已存在
    const exists = await this.checkEntityExists(name, 'Implementation');
    if (exists) {
      throw new GraphDBQueryError(
        `Implementation already exists: ${name}`,
        { name, code: 'IMPLEMENTATION_EXISTS' }
      );
    }

    const implementationUri = `http://example.org/esg#${name}`;
    
    // 构建可选属性
    const optionalTriples: string[] = [];
    if (functionName) optionalTriples.push(`esg:hasFunction "${functionName}"`);
    if (description) optionalTriples.push(`esg:hasDescription "${description}"`);
    if (inputParameters) optionalTriples.push(`esg:hasInputParameters "${inputParameters}"`);
    if (returnType) optionalTriples.push(`esg:hasReturnType "${returnType}"`);
    if (validation) optionalTriples.push(`esg:hasValidation "${validation}"`);
    
    const optionalTriplesStr = optionalTriples.length > 0 
      ? ' ;\n                    ' + optionalTriples.join(' ;\n                    ') 
      : '';
    
    const insertQuery = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      INSERT DATA {
        esg:${name} a esg:Implementation ;
                    rdfs:label "${name}" ;
                    esg:hasLanguage "${language}" ;
                    esg:hasFilePath "${filePath}"${optionalTriplesStr} .
      }
    `;

    try {
      await this.executeSparqlUpdate(insertQuery);
      return {
        uri: implementationUri,
        label: name
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to create implementation: ${name}`,
        { name, language, filePath, originalError: error }
      );
    }
  }

  /**
   * 创建 Model
   */
  async createModel(
    name: string, 
    calculationType: string, 
    inputMetrics: string[], 
    implementationName: string,
    description?: string,
    formula?: string,
    mathematicalExpression?: string
  ): Promise<{ 
    uri: string; 
    label: string; 
    inputMetrics: Array<{ uri: string; label: string }>; 
    implementation: { uri: string; label: string } 
  }> {
    // 检查 Model 是否已存在
    const modelExists = await this.checkEntityExists(name, 'Model');
    if (modelExists) {
      throw new GraphDBQueryError(
        `Model already exists: ${name}`,
        { name, code: 'MODEL_EXISTS' }
      );
    }

    // 检查 Implementation 是否存在
    const implementation = await this.getEntityByLabel(implementationName, 'Implementation');
    if (!implementation) {
      throw new GraphDBQueryError(
        `Implementation not found: ${implementationName}`,
        { implementationName, code: 'IMPLEMENTATION_NOT_FOUND' }
      );
    }

    // 检查所有输入指标是否存在
    const resolvedInputMetrics: Array<{ uri: string; label: string }> = [];
    for (const metricLabel of inputMetrics) {
      const metric = await this.getEntityByLabel(metricLabel, 'Metric');
      if (!metric) {
        throw new GraphDBQueryError(
          `Input metric not found: ${metricLabel}`,
          { metricLabel, code: 'METRIC_NOT_FOUND' }
        );
      }
      resolvedInputMetrics.push(metric);
    }

    const modelUri = `http://example.org/esg#${name}`;
    
    // 构建 requiresInputFrom 三元组
    const requiresInputFromTriples = resolvedInputMetrics
      .map(m => `<${m.uri}>`)
      .join(', ');

    // 构建可选属性
    const optionalTriples: string[] = [];
    if (description) optionalTriples.push(`esg:hasDescription "${description}"`);
    if (formula) optionalTriples.push(`esg:hasFormula "${formula}"`);
    if (mathematicalExpression) optionalTriples.push(`esg:hasMathematicalExpression "${mathematicalExpression}"`);
    
    const optionalTriplesStr = optionalTriples.length > 0 
      ? ' ;\n                    ' + optionalTriples.join(' ;\n                    ') 
      : '';

    const insertQuery = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      INSERT DATA {
        esg:${name} a esg:Model ;
                    rdfs:label "${name}" ;
                    esg:hasCalculationType "${calculationType}" ;
                    esg:requiresInputFrom ${requiresInputFromTriples} ;
                    esg:executesWith <${implementation.uri}>${optionalTriplesStr} .
      }
    `;

    try {
      await this.executeSparqlUpdate(insertQuery);
      return {
        uri: modelUri,
        label: name,
        inputMetrics: resolvedInputMetrics,
        implementation
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to create model: ${name}`,
        { name, calculationType, inputMetrics, implementationName, originalError: error }
      );
    }
  }

  /**
   * 更新 Metric 的计算方法，链接到 Model
   */
  async updateMetricCalculationMethod(
    metricLabel: string, 
    modelName: string
  ): Promise<{ 
    metricUri: string; 
    metricLabel: string; 
    model: { uri: string; label: string } 
  }> {
    // 检查 Metric 是否存在
    const metric = await this.getEntityByLabel(metricLabel, 'Metric');
    if (!metric) {
      throw new GraphDBQueryError(
        `Metric not found: ${metricLabel}`,
        { metricLabel, code: 'METRIC_NOT_FOUND' }
      );
    }

    // 检查 Model 是否存在
    const model = await this.getEntityByLabel(modelName, 'Model');
    if (!model) {
      throw new GraphDBQueryError(
        `Model not found: ${modelName}`,
        { modelName, code: 'MODEL_NOT_FOUND' }
      );
    }

    // 删除旧的计算方法关系，插入新的
    const updateQuery = `
      ${this.ESG_PREFIX}
      ${this.RDFS_PREFIX}

      DELETE {
        <${metric.uri}> esg:hasCalculationMethod ?oldMethod .
        <${metric.uri}> esg:obtainedFrom ?oldDataPoint .
        <${metric.uri}> esg:isCalculatedBy ?oldModel .
      }
      INSERT {
        <${metric.uri}> esg:hasCalculationMethod "calculation_model" .
        <${metric.uri}> esg:isCalculatedBy <${model.uri}> .
      }
      WHERE {
        <${metric.uri}> esg:hasCalculationMethod ?oldMethod .
        OPTIONAL { <${metric.uri}> esg:obtainedFrom ?oldDataPoint . }
        OPTIONAL { <${metric.uri}> esg:isCalculatedBy ?oldModel . }
      }
    `;

    try {
      await this.executeSparqlUpdate(updateQuery);
      return {
        metricUri: metric.uri,
        metricLabel: metric.label,
        model
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to update metric calculation method: ${metricLabel}`,
        { metricLabel, modelName, originalError: error }
      );
    }
  }
}