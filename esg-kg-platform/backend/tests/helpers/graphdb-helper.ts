import { GraphDBRepository } from '../../src/repositories/graphDBRepository';

/**
 * GraphDB 测试辅助工具类
 */
export class GraphDBTestHelper {
  private graphDB: GraphDBRepository;
  private readonly prefix = `
    PREFIX esg: <http://example.org/esg#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  `;

  constructor() {
    this.graphDB = new GraphDBRepository();
  }

  /**
   * 清空所有 Industry 数据
   */
  async cleanIndustries(): Promise<void> {
    const query = `
      ${this.prefix}
      DELETE {
        ?industry ?p ?o .
        ?s ?p2 ?industry .
      }
      WHERE {
        ?industry a esg:Industry .
        {
          ?industry ?p ?o .
        }
        UNION
        {
          ?s ?p2 ?industry .
        }
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  /**
   * 创建测试行业
   */
  async createTestIndustry(
    label: string,
    description?: string,
    reportsUsing?: string[]
  ): Promise<string> {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    const uri = `http://example.org/esg#${normalizedLabel}`;
    
    let insertData = `<${uri}> a esg:Industry ; rdfs:label "${this.escapeSparql(label)}" .`;
    
    if (description) {
      insertData += `\n<${uri}> esg:hasDescription "${this.escapeSparql(description)}" .`;
    }
    
    if (reportsUsing && reportsUsing.length > 0) {
      reportsUsing.forEach(fw => {
        insertData += `\n<${uri}> esg:reportsUsing <${fw}> .`;
      });
    }

    const query = `
      ${this.prefix}
      INSERT DATA {
        ${insertData}
      }
    `;
    
    await this.graphDB.executeSparqlQuery(query);
    return uri;
  }

  /**
   * 创建测试报告框架
   */
  async createTestFramework(label: string): Promise<string> {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    const uri = `http://example.org/esg#${normalizedLabel}`;
    
    const query = `
      ${this.prefix}
      INSERT DATA {
        <${uri}> a esg:ReportingFramework ;
                 rdfs:label "${this.escapeSparql(label)}" .
      }
    `;
    
    await this.graphDB.executeSparqlQuery(query);
    return uri;
  }

  /**
   * 检查行业是否存在
   */
  async industryExists(uri: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      ASK { <${uri}> a esg:Industry . }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.boolean;
  }

  /**
   * 获取行业数量
   */
  async getIndustryCount(): Promise<number> {
    const query = `
      ${this.prefix}
      SELECT (COUNT(DISTINCT ?industry) AS ?count)
      WHERE {
        ?industry a esg:Industry .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return parseInt(result.results.bindings[0]?.count?.value || '0', 10);
  }

  /**
   * 获取行业详情
   */
  async getIndustryDetail(uri: string): Promise<any> {
    const query = `
      ${this.prefix}
      SELECT ?label ?description ?framework
      WHERE {
        <${uri}> a esg:Industry ;
                 rdfs:label ?label .
        OPTIONAL { <${uri}> esg:hasDescription ?description . }
        OPTIONAL { <${uri}> esg:reportsUsing ?framework . }
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    
    if (result.results.bindings.length === 0) {
      return null;
    }
    
    const bindings = result.results.bindings;
    return {
      label: bindings[0].label.value,
      description: bindings[0].description?.value,
      frameworks: bindings
        .filter((b: any) => b.framework)
        .map((b: any) => b.framework.value)
    };
  }

  async cleanFrameworks(): Promise<void> {
    const query = `
      ${this.prefix}
      DELETE {
        ?framework ?p ?o .
        ?s ?p2 ?framework .
      }
      WHERE {
        ?framework a esg:ReportingFramework .
        {
          ?framework ?p ?o .
        }
        UNION
        {
          ?s ?p2 ?framework .
        }
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  async createTestCategory(label: string): Promise<string> {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    const uri = `http://example.org/esg#${normalizedLabel}`;
    
    const query = `
      ${this.prefix}
      INSERT DATA {
        <${uri}> a esg:Category ;
                 rdfs:label "${this.escapeSparql(label)}" .
      }
    `;
    
    await this.graphDB.executeSparqlQuery(query);
    return uri;
  }

  async cleanCategories(): Promise<void> {
    const query = `
      ${this.prefix}
      DELETE {
        ?category ?p ?o .
        ?s ?p2 ?category .
      }
      WHERE {
        ?category a esg:Category .
        {
          ?category ?p ?o .
        }
        UNION
        {
          ?s ?p2 ?category .
        }
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  async frameworkExists(uri: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      ASK { <${uri}> a esg:ReportingFramework . }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.boolean;
  }

  async getFrameworkCount(): Promise<number> {
    const query = `
      ${this.prefix}
      SELECT (COUNT(DISTINCT ?framework) AS ?count)
      WHERE {
        ?framework a esg:ReportingFramework .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return parseInt(result.results.bindings[0]?.count?.value || '0', 10);
  }

  async getFrameworkDetail(uri: string): Promise<any> {
    const query = `
      ${this.prefix}
      SELECT ?label ?sourceDocument ?category ?categoryLabel
      WHERE {
        <${uri}> a esg:ReportingFramework ;
                 rdfs:label ?label .
        OPTIONAL { <${uri}> esg:sourceDocument ?sourceDocument . }
        OPTIONAL { 
          <${uri}> esg:includes ?category .
          ?category rdfs:label ?categoryLabel .
        }
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    
    if (result.results.bindings.length === 0) {
      return null;
    }
    
    const bindings = result.results.bindings;
    return {
      label: bindings[0].label.value,
      sourceDocument: bindings[0].sourceDocument?.value,
      categories: bindings
        .filter((b: any) => b.category)
        .map((b: any) => ({
          iri: b.category.value,
          label: b.categoryLabel.value
        }))
    };
  }

  async categoryExists(uri: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      ASK { <${uri}> a esg:Category . }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.boolean;
  }

  async getFrameworkCategories(frameworkUri: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      SELECT ?category
      WHERE {
        <${frameworkUri}> esg:includes ?category .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.results.bindings.map((b: any) => b.category.value);
  }

  async addCategoriesToFramework(frameworkUri: string, categoryUris: string[]): Promise<void> {
    const insertTriples = categoryUris
      .map(uri => `<${frameworkUri}> esg:includes <${uri}> .`)
      .join('\n        ');

    const query = `
      ${this.prefix}
      INSERT DATA {
        ${insertTriples}
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  async getIndustriesUsingFramework(frameworkUri: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      SELECT ?industry
      WHERE {
        ?industry esg:reportsUsing <${frameworkUri}> .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.results.bindings.map((b: any) => b.industry.value);
  }

  // ==================== Category Helper Methods ====================

  async getCategoryCount(): Promise<number> {
    const query = `
      ${this.prefix}
      SELECT (COUNT(DISTINCT ?category) AS ?count)
      WHERE {
        ?category a esg:Category .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return parseInt(result.results.bindings[0]?.count?.value || '0', 10);
  }

  async getCategoryDetail(uri: string): Promise<any> {
    const query = `
      ${this.prefix}
      SELECT ?label ?metric ?metricLabel ?framework ?frameworkLabel
      WHERE {
        <${uri}> a esg:Category ;
                 rdfs:label ?label .
        OPTIONAL { 
          <${uri}> esg:consistsOf ?metric .
          ?metric rdfs:label ?metricLabel .
        }
        OPTIONAL { 
          ?framework esg:includes <${uri}> .
          ?framework rdfs:label ?frameworkLabel .
        }
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    
    if (!result.results || !result.results.bindings || result.results.bindings.length === 0) {
      // Check if category exists at all
      const existsQuery = `
        ${this.prefix}
        ASK { <${uri}> ?p ?o . }
      `;
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      console.log(`[getCategoryDetail] Category exists check for ${uri}: ${existsResult.boolean}`);
      if (existsResult.boolean) {
        // Category exists but query failed - check what data is there
        const debugQuery = `SELECT * WHERE { <${uri}> ?p ?o . }`;
        const debugResult = await this.graphDB.executeSparqlQuery(debugQuery);
        console.log(`[getCategoryDetail] Debug data:`, JSON.stringify(debugResult, null, 2));
      }
      return null;
    }
    
    const bindings = result.results.bindings;
    const detail = {
      label: bindings[0].label?.value || null,
      metrics: bindings
        .filter((b: any) => b.metric && b.metricLabel)
        .map((b: any) => ({
          iri: b.metric.value,
          label: b.metricLabel.value
        })),
      frameworks: bindings
        .filter((b: any) => b.framework && b.frameworkLabel)
        .map((b: any) => ({
          iri: b.framework.value,
          label: b.frameworkLabel.value
        }))
    };
    
    return detail;
  }

  async getCategoryMetrics(categoryUri: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      SELECT ?metric
      WHERE {
        <${categoryUri}> esg:consistsOf ?metric .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.results.bindings.map((b: any) => b.metric.value);
  }

  async addMetricsToCategory(categoryUri: string, metricUris: string[]): Promise<void> {
    const insertTriples = metricUris
      .map(uri => `<${categoryUri}> esg:consistsOf <${uri}> .`)
      .join('\n        ');

    const query = `
      ${this.prefix}
      INSERT DATA {
        ${insertTriples}
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  async getFrameworksUsingCategory(categoryUri: string): Promise<string[]> {
    const query = `
      ${this.prefix}
      SELECT ?framework
      WHERE {
        ?framework esg:includes <${categoryUri}> .
      }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.results.bindings.map((b: any) => b.framework.value);
  }

  async createTestMetric(label: string): Promise<string> {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    const uri = `http://example.org/esg#${normalizedLabel}`;
    
    const query = `
      ${this.prefix}
      INSERT DATA {
        <${uri}> a esg:Metric ;
                 rdfs:label "${this.escapeSparql(label)}" ;
                 esg:hasCalculationMethod "direct_measurement" ;
                 esg:hasUnit "Number" .
      }
    `;
    
    await this.graphDB.executeSparqlQuery(query);
    return uri;
  }

  async cleanMetrics(): Promise<void> {
    const query = `
      ${this.prefix}
      DELETE {
        ?metric ?p ?o .
        ?s ?p2 ?metric .
      }
      WHERE {
        ?metric a esg:Metric .
        {
          ?metric ?p ?o .
        }
        UNION
        {
          ?s ?p2 ?metric .
        }
      }
    `;
    await this.graphDB.executeSparqlQuery(query);
  }

  async metricExists(uri: string): Promise<boolean> {
    const query = `
      ${this.prefix}
      ASK { <${uri}> a esg:Metric . }
    `;
    const result = await this.graphDB.executeSparqlQuery(query);
    return result.boolean;
  }

  // ==================== Clean All Data ====================

  async cleanAllData(): Promise<void> {
    const query = `DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }`;
    await this.graphDB.executeSparqlQuery(query);
  }

  private escapeSparql(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}
