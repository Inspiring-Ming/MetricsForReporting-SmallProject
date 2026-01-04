import { Request, Response } from 'express';
import { WizardService } from '../services/wizardService';
import { WizardPayload, ShaclValidationRequest } from '../types';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * 向导控制器
 */
export class WizardController {
  private wizardService: WizardService;

  constructor(wizardService: WizardService) {
    this.wizardService = wizardService;
  }

  /**
   * 预览向导生成的 TTL
   */
  previewWizardData = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as WizardPayload;
    
    if (!payload) {
      throw new ValidationError('Wizard payload is required');
    }

    const result = await this.wizardService.previewWizardData(payload);
    
    res.json({
      success: true,
      data: {
        ttl: result.ttl,
        triplesCount: result.triples.length,
        triples: result.triples
      },
      meta: {
        hasDirectMeasurement: payload.metric.hasCalculationMethod === 'direct_measurement',
        hasCalculationModel: payload.metric.hasCalculationMethod === 'calculation_model'
      }
    });
  });

  /**
   * 提交向导数据
   */
  submitWizardData = asyncHandler(async (req: Request, res: Response) => {
    const { ttl, graph } = req.body;
    
    if (!ttl) {
      throw new ValidationError('TTL content is required');
    }

    const result = await this.wizardService.submitWizardData(ttl, graph);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Wizard data submitted successfully'
    });
  });

  /**
   * 验证草稿数据
   */
  validateDraft = asyncHandler(async (req: Request, res: Response) => {
    const { ttl, graph } = req.body as ShaclValidationRequest;
    
    if (!ttl) {
      throw new ValidationError('TTL content is required');
    }

    const result = await this.wizardService.validateDraftData(ttl, graph);
    
    // 如果验证失败，返回 422 状态码
    const statusCode = result.ok ? 200 : 422;
    
    res.status(statusCode).json({
      success: result.ok,
      data: result,
      message: result.ok ? 'Validation passed' : 'SHACL validation failed'
    });
  });

  /**
   * 生成向导模板
   */
  generateTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { calculationMethod } = req.query;
    
    const template: Partial<WizardPayload> = {
      metric: {
        code: '',
        label: '',
        hasType: '',
        hasCalculationMethod: (calculationMethod as 'direct_measurement' | 'calculation_model') || 'direct_measurement',
        hasMetricType: '',
        hasUnit: '',
        hasDescription: ''
      }
    };

    // 根据计算方法添加相应的模板字段
    if (template.metric!.hasCalculationMethod === 'direct_measurement') {
      template.datasetVariables = [{
        label: '',
        sources: [{
          label: ''
        }]
      }];
    } else if (template.metric!.hasCalculationMethod === 'calculation_model') {
      template.model = {
        label: '',
        calculationType: '',
        formula: '',
        mathematicalExpression: ''
      };
      template.implementation = {
        label: '',
        language: '',
        filePath: '',
        func: ''
      };
    }

    res.json({
      success: true,
      data: template,
      message: 'Wizard template generated successfully'
    });
  });
}