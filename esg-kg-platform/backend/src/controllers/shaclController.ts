import { Request, Response } from 'express';
import { ShaclService } from '../services/shaclService';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * SHACL 验证控制器
 */
export class ShaclController {
  private shaclService: ShaclService;

  constructor(shaclService: ShaclService) {
    this.shaclService = shaclService;
  }

  /**
   * 验证整个仓库
   */
  validateRepository = asyncHandler(async (req: Request, res: Response) => {
    let shapesTtl: string;

    // 处理不同格式的输入
    if (typeof req.body === 'string') {
      // 直接文本内容 (Content-Type: text/turtle 或 text/plain)
      shapesTtl = req.body;
    } else if (req.body && typeof req.body === 'object') {
      // JSON格式: { "shapesTtl": "..." } 或 { "ttl": "..." }
      shapesTtl = req.body.shapesTtl || req.body.ttl;
    } else {
      throw new ValidationError(
        'SHACL shapes content is required. Send as text/turtle or JSON with shapesTtl field.'
      );
    }

    if (!shapesTtl || typeof shapesTtl !== 'string' || !shapesTtl.trim()) {
      throw new ValidationError('SHACL shapes content is required and cannot be empty');
    }

    const validationReport = await this.shaclService.validateRepository(shapesTtl);
    
    // 解析验证报告
    const parsedReport = this.shaclService.parseValidationReport(validationReport);
    const humanReadableReport = this.shaclService.generateHumanReadableReport(validationReport);

    res.type('application/json').json({
      success: parsedReport.isValid,
      data: {
        isValid: parsedReport.isValid,
        summary: parsedReport.summary,
        violations: parsedReport.violations,
        humanReadable: humanReadableReport,
        rawReport: validationReport
      },
      message: parsedReport.isValid ? 'Validation passed' : 'Validation failed'
    });
  });

  /**
   * 验证 SHACL 形状定义
   */
  validateShapes = asyncHandler(async (req: Request, res: Response) => {
    const { shapesTtl } = req.body;
    
    if (!shapesTtl) {
      throw new ValidationError('SHACL shapes content is required');
    }

    try {
      // 估算验证复杂度
      const complexity = this.shaclService.estimateValidationComplexity(shapesTtl);
      
      // 基本的 SHACL 语法检查
      const hasNamespace = /@prefix\s+sh:\s*<http:\/\/www\.w3\.org\/ns\/shacl#>/.test(shapesTtl);
      const hasShapes = /\b(sh:NodeShape|sh:PropertyShape)\b/.test(shapesTtl);
      
      const warnings: string[] = [];
      if (!hasNamespace) {
        warnings.push('Missing SHACL namespace prefix declaration');
      }
      if (!hasShapes) {
        warnings.push('No SHACL shapes found');
      }

      res.json({
        success: true,
        data: {
          valid: hasNamespace && hasShapes,
          complexity,
          analysis: {
            hasNamespace,
            hasShapes,
            estimatedSize: shapesTtl.length
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
   * 获取 SHACL 形状统计信息
   */
  getShapesStats = asyncHandler(async (req: Request, res: Response) => {
    const { shapesTtl } = req.body;
    
    if (!shapesTtl) {
      throw new ValidationError('SHACL shapes content is required');
    }

    const complexity = this.shaclService.estimateValidationComplexity(shapesTtl);
    
    // 额外的统计信息
    const targetClasses = (shapesTtl.match(/sh:targetClass/g) || []).length;
    const targetNodes = (shapesTtl.match(/sh:targetNode/g) || []).length;
    const properties = (shapesTtl.match(/sh:property/g) || []).length;
    
    res.json({
      success: true,
      data: {
        ...complexity,
        targets: {
          targetClasses,
          targetNodes,
          properties
        },
        size: {
          characters: shapesTtl.length,
          lines: shapesTtl.split('\n').length,
          words: shapesTtl.split(/\s+/).length
        }
      }
    });
  });
}