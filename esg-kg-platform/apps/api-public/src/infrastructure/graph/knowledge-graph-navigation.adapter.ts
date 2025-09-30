/**
 * GraphDB Knowledge Graph Navigation Adapter
 * 
 * 职责：
 * - 实现 KnowledgeGraphPort 接口中的导航方法
 * - 调用现有的后端 queryGraph.ts 函数
 * - 转换数据格式适应六边形架构
 * - 处理 GraphDB 连接和错误
 */

import { Framework } from '@esg-platform/dto';
import { KnowledgeGraphPort } from '../../application/ports/outbound';
import { GraphDbClient, GraphDbConnectionError, GraphDbQueryError } from './graphdb.client';

export class GraphDbKnowledgeGraphAdapter implements Partial<KnowledgeGraphPort> {
  constructor(
    private readonly graphDbClient: GraphDbClient
  ) {}

  /**
   * Execute a SPARQL query
   */
  async executeSparqlQuery(query: string): Promise<Record<string, unknown>[]> {
    try {
      const result = await this.graphDbClient.query(query);
      
      if (!result.results?.bindings) {
        return [];
      }

      return result.results.bindings.map(binding => {
        const row: Record<string, unknown> = {};
        Object.keys(binding).forEach(key => {
          row[key] = binding[key]?.value;
        });
        return row;
      });
    } catch (error) {
      if (error instanceof GraphDbConnectionError || error instanceof GraphDbQueryError) {
        throw error;
      }
      throw new GraphDbQueryError(
        `SPARQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { query }
      );
    }
  }

  /**
   * Get reporting frameworks applicable to a specific industry
   */
  async getReportingFrameworks(industry: string): Promise<Array<{
    code: Framework;
    name: string;
    description?: string | undefined;
  }>> {
    try {
      // 使用 SPARQL 查询获取框架
      const query = `
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?frameworkLabel WHERE {
          ?industry a esg:Industry ;
                    rdfs:label "${industry}" ;
                    esg:reportsUsing ?framework .

          ?framework a esg:ReportingFramework ;
                     rdfs:label ?frameworkLabel .
        }
        ORDER BY ?frameworkLabel
      `;

      const result = await this.graphDbClient.query(query);
      
      if (!result.results?.bindings) {
        return [];
      }

      // 转换数据格式
      return result.results.bindings
        .map(binding => binding.frameworkLabel?.value as string)
        .filter(frameworkName => frameworkName)
        .map(frameworkName => {
          // 将框架名称映射到Framework枚举
          let code: Framework;
          switch (frameworkName.toUpperCase()) {
            case 'SASB':
              code = 'SASB';
              break;
            case 'GRI':
              code = 'GRI';
              break;
            case 'TCFD':
              code = 'TCFD';
              break;
            case 'EU_TAXONOMY':
            case 'EU TAXONOMY':
              code = 'EU_TAXONOMY';
              break;
            case 'CSRD':
              code = 'CSRD';
              break;
            default:
              // 如果不匹配，默认使用 SASB 或抛出错误
              console.warn(`Unknown framework: ${frameworkName}, defaulting to SASB`);
              code = 'SASB';
          }

          return {
            code,
            name: frameworkName,
            description: `${frameworkName} reporting framework for ${industry}`
          };
        });
    } catch (error) {
      throw new GraphDbQueryError(
        `Failed to get reporting frameworks for industry ${industry}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { industry }
      );
    }
  }

  /**
   * Get categories for a specific industry and framework
   */
  async getCategoriesByIndustryAndFramework(
    industry: string,
    framework: Framework
  ): Promise<Array<{
    code: string;
    name: string;
    description?: string | undefined;
  }>> {
    try {
      // 使用 SPARQL 查询获取分类
      const query = `
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

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

      const result = await this.graphDbClient.query(query);
      
      if (!result.results?.bindings) {
        return [];
      }

      // 转换数据格式
      return result.results.bindings
        .map(binding => binding.categoryLabel?.value as string)
        .filter(categoryName => categoryName)
        .map((categoryName: string, index: number) => ({
          code: this.generateCategoryCode(categoryName, index),
          name: categoryName,
          description: `${categoryName} category under ${framework} framework for ${industry}`
        }));
    } catch (error) {
      throw new GraphDbQueryError(
        `Failed to get categories for industry ${industry} and framework ${framework}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { industry, framework }
      );
    }
  }

  /**
   * Get metrics under a specific category
   */
  async getMetricsByIndustryAndCategory(
    industry: string,
    framework: Framework,
    categoryLabel: string
  ): Promise<Array<{
    code: string;
    name: string;
    description?: string | undefined;
    unitIri?: string | undefined;
  }>> {
    try {
      // 使用 SPARQL 查询获取指标
      const query = `
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

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

      const result = await this.graphDbClient.query(query);
      
      if (!result.results?.bindings) {
        return [];
      }

      // 转换数据格式
      return result.results.bindings
        .map(binding => binding.metricLabel?.value as string)
        .filter(metricName => metricName)
        .map((metricName: string, index: number) => {
          const metric: {
            code: string;
            name: string;
            description?: string | undefined;
            unitIri?: string | undefined;
          } = {
            code: this.generateMetricCode(metricName, framework, index),
            name: metricName,
            description: `${metricName} metric under ${categoryLabel} category`,
            unitIri: undefined // 可以通过额外的查询获取单位信息
          };
          return metric;
        });
    } catch (error) {
      throw new GraphDbQueryError(
        `Failed to get metrics for industry ${industry}, framework ${framework}, category ${categoryLabel}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { industry, framework, categoryLabel }
      );
    }
  }

  /**
   * 生成分类代码
   */
  private generateCategoryCode(categoryName: string, index: number): string {
    // 简单的代码生成逻辑，实际应该从知识图谱中获取
    const cleanName = categoryName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase();
    
    return `CAT_${cleanName.substring(0, 20)}_${index.toString().padStart(2, '0')}`;
  }

  /**
   * 生成指标代码
   */
  private generateMetricCode(metricName: string, framework: Framework, index: number): string {
    // 简单的代码生成逻辑，实际应该从知识图谱中获取真实的指标代码
    const frameworkPrefix = framework.substring(0, 3);
    const cleanName = metricName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase();
    
    return `${frameworkPrefix}-${cleanName.substring(0, 15)}-${index.toString().padStart(3, '0')}`;
  }

  // 实现其他 KnowledgeGraphPort 方法的占位符
  // 这些方法已经在其他地方实现或不需要用于导航功能

  async getComputationMethods(): Promise<any[]> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getComputationMethod(): Promise<any> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getFrameworks(): Promise<Framework[]> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getIndustries(): Promise<string[]> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getMetricCodes(): Promise<string[]> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getMetricDefinitions(): Promise<any[]> {
    throw new Error('Not implemented in navigation adapter');
  }

  async validateMetricStructure(): Promise<any> {
    throw new Error('Not implemented in navigation adapter');
  }

  async entityExists(): Promise<boolean> {
    throw new Error('Not implemented in navigation adapter');
  }

  async getEntity(): Promise<any> {
    throw new Error('Not implemented in navigation adapter');
  }
}