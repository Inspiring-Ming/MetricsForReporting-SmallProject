import { Request, Response } from 'express';
import { TTLService } from '../services/ttlService';
import { TTLUploadRequest } from '../types';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * TTL 文件控制器
 */
export class TTLController {
  private ttlService: TTLService;

  constructor(ttlService: TTLService) {
    this.ttlService = ttlService;
  }

  /**
   * 上传 TTL 文件
   */
  uploadTTL = asyncHandler(async (req: Request, res: Response) => {
    const { ttl, graph, baseUri } = req.body as TTLUploadRequest;
    
    if (!ttl) {
      throw new ValidationError('TTL content is required');
    }

    const request: TTLUploadRequest = {
      ttl,
      graph,
      baseUri
    };

    // 检查文件大小限制
    this.ttlService.checkSizeLimit(ttl, 2); // 2MB 限制

    const result = await this.ttlService.uploadTTLFile(request);
    
    res.status(201).json({
      success: true,
      data: result
    });
  });

  /**
   * 验证 TTL 格式
   */
  validateTTL = asyncHandler(async (req: Request, res: Response) => {
    const { ttl } = req.body;
    
    if (!ttl) {
      throw new ValidationError('TTL content is required');
    }

    try {
      // 估算文件大小
      const sizeBytes = this.ttlService.estimateTTLSize(ttl);
      const sizeMB = sizeBytes / (1024 * 1024);

      // 基本验证（这里可以添加更复杂的 TTL 解析逻辑）
      const hasPrefixes = /@prefix/.test(ttl);
      const hasTriples = /\s+\.\s*$/m.test(ttl);
      
      const warnings: string[] = [];
      if (!hasPrefixes) {
        warnings.push('No @prefix declarations found');
      }
      if (!hasTriples) {
        warnings.push('No valid triples found');
      }

      res.json({
        success: true,
        data: {
          valid: true,
          size: {
            bytes: sizeBytes,
            mb: Number(sizeMB.toFixed(2))
          },
          analysis: {
            hasPrefixes,
            hasTriples,
            estimatedTriples: (ttl.match(/\s+\.\s*$/gm) || []).length
          },
          warnings: warnings.length > 0 ? warnings : undefined
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        data: {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown validation error'
        }
      });
    }
  });

  /**
   * 获取 TTL 统计信息
   */
  getTTLStats = asyncHandler(async (req: Request, res: Response) => {
    const { ttl } = req.body;
    
    if (!ttl) {
      throw new ValidationError('TTL content is required');
    }

    const sizeBytes = this.ttlService.estimateTTLSize(ttl);
    const sizeMB = sizeBytes / (1024 * 1024);
    
    // 基本统计
    const lines = ttl.split('\n').length;
    const prefixes = (ttl.match(/@prefix/g) || []).length;
    const triples = (ttl.match(/\s+\.\s*$/gm) || []).length;
    const comments = (ttl.match(/#[^\n]*/g) || []).length;

    // 词汇统计
    const words = ttl.split(/\s+/).length;
    const characters = ttl.length;

    res.json({
      success: true,
      data: {
        size: {
          bytes: sizeBytes,
          mb: Number(sizeMB.toFixed(2)),
          lines,
          characters,
          words
        },
        structure: {
          prefixes,
          triples,
          comments
        },
        readability: {
          avgWordsPerLine: Number((words / lines).toFixed(2)),
          avgCharsPerLine: Number((characters / lines).toFixed(2))
        }
      }
    });
  });
}