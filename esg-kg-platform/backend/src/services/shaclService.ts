import { GraphDBRepository } from '../repositories/graphDBRepository';
import { ShaclValidationRequest } from '../types';
import { ValidationError, ShaclValidationError } from '../types/errors';

/**
 * SHACL 服务类 - 处理 SHACL 验证相关业务逻辑
 */
export class ShaclService {
  private graphDBRepository: GraphDBRepository;

  constructor(graphDBRepository: GraphDBRepository) {
    this.graphDBRepository = graphDBRepository;
  }

  /**
   * 验证整个仓库
   */
  async validateRepository(shapesTtl: string): Promise<string> {
    this.validateShaclRequest(shapesTtl);

    try {
      const validationReport = await this.graphDBRepository.validateWithShacl(shapesTtl);
      return validationReport;
    } catch (error) {
      throw new ShaclValidationError(
        `SHACL repository validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { shapesTtl, originalError: error }
      );
    }
  }

  /**
   * 解析验证报告
   */
  parseValidationReport(reportTtl: string): {
    isValid: boolean;
    violations: Array<{
      focusNode?: string;
      resultPath?: string;
      value?: string;
      message?: string;
      severity?: string;
      sourceShape?: string;
    }>;
    summary: {
      totalViolations: number;
      severities: Record<string, number>;
    };
  } {
    // 简单的报告解析 - 在实际项目中可能需要更复杂的 RDF 解析
    const violations: Array<any> = [];
    const severities: Record<string, number> = {};
    
    // 检查是否有违规
    const hasViolations = /sh:ValidationResult/i.test(reportTtl);
    
    if (hasViolations) {
      // 这里可以实现更详细的解析逻辑
      // 目前返回基本信息
      const violationCount = (reportTtl.match(/sh:ValidationResult/gi) || []).length;
      
      violations.push({
        message: `Found ${violationCount} validation violations. See full report for details.`
      });
      
      severities['Violation'] = violationCount;
    }

    return {
      isValid: !hasViolations,
      violations,
      summary: {
        totalViolations: violations.length,
        severities
      }
    };
  }

  /**
   * 生成人类可读的验证报告
   */
  generateHumanReadableReport(reportTtl: string): string {
    const parsed = this.parseValidationReport(reportTtl);
    
    if (parsed.isValid) {
      return 'Validation passed: No SHACL violations found.';
    }
    
    let report = `Validation failed: Found ${parsed.summary.totalViolations} violations.\n\n`;
    
    parsed.violations.forEach((violation, index) => {
      report += `${index + 1}. `;
      if (violation.severity) report += `[${violation.severity}] `;
      if (violation.message) report += `${violation.message}\n`;
      if (violation.focusNode) report += `   Focus Node: ${violation.focusNode}\n`;
      if (violation.resultPath) report += `   Path: ${violation.resultPath}\n`;
      if (violation.value) report += `   Value: ${violation.value}\n`;
      if (violation.sourceShape) report += `   Shape: ${violation.sourceShape}\n`;
      report += '\n';
    });
    
    return report;
  }

  /**
   * 验证 SHACL 请求
   */
  private validateShaclRequest(shapesTtl: string): void {
    if (!shapesTtl || typeof shapesTtl !== 'string') {
      throw new ValidationError('SHACL shapes content is required and must be a string');
    }

    if (shapesTtl.trim().length === 0) {
      throw new ValidationError('SHACL shapes content cannot be empty');
    }

    // 基本的 SHACL 语法检查
    if (!/@prefix\s+sh:\s*<http:\/\/www\.w3\.org\/ns\/shacl#>/.test(shapesTtl)) {
      console.warn('SHACL content may be missing SHACL namespace prefix');
    }

    // 检查是否包含 SHACL 相关的关键词
    const shaclKeywords = /\b(sh:NodeShape|sh:PropertyShape|sh:targetClass|sh:property)\b/;
    if (!shaclKeywords.test(shapesTtl)) {
      console.warn('SHACL content may not contain valid shape definitions');
    }
  }

  /**
   * 估算 SHACL 验证的复杂度
   */
  estimateValidationComplexity(shapesTtl: string): {
    nodeShapes: number;
    propertyShapes: number;
    constraints: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
  } {
    const nodeShapes = (shapesTtl.match(/sh:NodeShape/gi) || []).length;
    const propertyShapes = (shapesTtl.match(/sh:PropertyShape/gi) || []).length;
    
    // 计算约束数量
    const constraintPatterns = [
      /sh:minCount/gi,
      /sh:maxCount/gi,
      /sh:datatype/gi,
      /sh:pattern/gi,
      /sh:minLength/gi,
      /sh:maxLength/gi,
      /sh:class/gi,
      /sh:nodeKind/gi
    ];
    
    const constraints = constraintPatterns.reduce((total, pattern) => {
      return total + (shapesTtl.match(pattern) || []).length;
    }, 0);
    
    const totalComplexity = nodeShapes + propertyShapes + constraints;
    
    let estimatedComplexity: 'low' | 'medium' | 'high';
    if (totalComplexity < 10) {
      estimatedComplexity = 'low';
    } else if (totalComplexity < 50) {
      estimatedComplexity = 'medium';
    } else {
      estimatedComplexity = 'high';
    }
    
    return {
      nodeShapes,
      propertyShapes,
      constraints,
      estimatedComplexity
    };
  }
}