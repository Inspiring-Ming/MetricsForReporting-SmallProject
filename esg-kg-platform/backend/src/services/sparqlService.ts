import { GraphDBRepository } from '../repositories/graphDBRepository';
import { SparqlQueryRequest } from '../types';
import { ValidationError, SparqlError } from '../types/errors';

/**
 * SPARQL 服务类 - 处理 SPARQL 查询相关业务逻辑
 */
export class SparqlService {
  private graphDBRepository: GraphDBRepository;

  constructor(graphDBRepository: GraphDBRepository) {
    this.graphDBRepository = graphDBRepository;
  }

  /**
   * 执行 SPARQL 查询
   */
  async executeQuery(request: SparqlQueryRequest): Promise<any> {
    // 验证查询参数
    this.validateSparqlQuery(request.query);

    try {
      return await this.graphDBRepository.executeSparqlQuery(
        request.query,
        request.infer,
        request.sameAs
      );
    } catch (error) {
      throw new SparqlError(
        `SPARQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { request, originalError: error }
      );
    }
  }

  /**
   * 验证 SPARQL 查询语法
   */
  private validateSparqlQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    if (query.trim().length === 0) {
      throw new ValidationError('Query cannot be empty');
    }

    // 基本的 SPARQL 语法检查
    const sparqlKeywords = /\b(SELECT|CONSTRUCT|DESCRIBE|ASK|INSERT|DELETE|WHERE)\b/i;
    if (!sparqlKeywords.test(query)) {
      throw new ValidationError('Invalid SPARQL query: No valid SPARQL operation found');
    }
  }

  /**
   * 获取查询类型
   */
  getQueryType(query: string): 'SELECT' | 'CONSTRUCT' | 'DESCRIBE' | 'ASK' | 'UPDATE' | 'UNKNOWN' {
    if (/\bSELECT\b/i.test(query)) return 'SELECT';
    if (/\bCONSTRUCT\b/i.test(query)) return 'CONSTRUCT';
    if (/\bDESCRIBE\b/i.test(query)) return 'DESCRIBE';
    if (/\bASK\b/i.test(query)) return 'ASK';
    if (/\b(INSERT|DELETE)\b/i.test(query)) return 'UPDATE';
    return 'UNKNOWN';
  }

  /**
   * 格式化查询结果
   */
  formatQueryResult(result: any, queryType: string): any {
    switch (queryType) {
      case 'SELECT':
        return this.formatSelectResult(result);
      case 'CONSTRUCT':
      case 'DESCRIBE':
        return { data: result, type: 'turtle' };
      case 'ASK':
        return { result: result.boolean || false };
      default:
        return result;
    }
  }

  /**
   * 格式化 SELECT 查询结果
   */
  private formatSelectResult(result: any): any {
    if (!result || !result.results || !result.results.bindings) {
      return { bindings: [], vars: [] };
    }

    return {
      vars: result.head?.vars || [],
      bindings: result.results.bindings.map((binding: any) => {
        const formatted: Record<string, any> = {};
        for (const [key, value] of Object.entries(binding)) {
          formatted[key] = this.formatBindingValue(value as any);
        }
        return formatted;
      }),
      total: result.results.bindings.length
    };
  }

  /**
   * 格式化绑定值
   */
  private formatBindingValue(value: any): any {
    if (!value) return null;
    
    return {
      type: value.type,
      value: value.value,
      ...(value.datatype && { datatype: value.datatype }),
      ...(value['xml:lang'] && { lang: value['xml:lang'] })
    };
  }
}