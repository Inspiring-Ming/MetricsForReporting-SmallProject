import { Request, Response } from 'express';
import { SparqlService } from '../services/sparqlService';
import { SparqlQueryRequest } from '../types';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * SPARQL 查询控制器
 */
export class SparqlController {
  private sparqlService: SparqlService;

  constructor(sparqlService: SparqlService) {
    this.sparqlService = sparqlService;
  }

  /**
   * 执行 SPARQL 查询
   */
  executeQuery = asyncHandler(async (req: Request, res: Response) => {
    const { query, infer, sameAs } = req.body as SparqlQueryRequest;
    
    if (!query) {
      throw new ValidationError('Query parameter is required');
    }

    const request: SparqlQueryRequest = {
      query,
      infer,
      sameAs
    };

    const result = await this.sparqlService.executeQuery(request);
    const queryType = this.sparqlService.getQueryType(query);
    const formattedResult = this.sparqlService.formatQueryResult(result, queryType);

    // 根据查询类型设置适当的响应头
    if (queryType === 'CONSTRUCT' || queryType === 'DESCRIBE') {
      res.type('text/turtle');
      res.send(result);
    } else {
      res.json({
        success: true,
        data: formattedResult,
        meta: {
          queryType,
          executionTime: Date.now() - (req as any).startTime
        }
      });
    }
  });

  /**
   * 验证 SPARQL 查询语法
   */
  validateQuery = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body;
    
    if (!query) {
      throw new ValidationError('Query parameter is required');
    }

    try {
      // 这里只进行语法验证，不执行查询
      const queryType = this.sparqlService.getQueryType(query);
      
      res.json({
        success: true,
        data: {
          valid: true,
          queryType,
          message: 'Query syntax is valid'
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        data: {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * 获取查询历史（示例功能）
   */
  getQueryHistory = asyncHandler(async (req: Request, res: Response) => {
    // 这里可以实现查询历史功能
    // 目前返回空数组作为示例
    res.json({
      success: true,
      data: [],
      message: 'Query history feature not yet implemented'
    });
  });
}