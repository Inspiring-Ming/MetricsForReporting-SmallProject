import crypto from 'crypto';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { WizardPayload, Triple, TripleResult } from '../types';
import { ValidationError, WizardError } from '../types/errors';
import { iri, lit, triplesToTTL } from '../utils/turtleUtils';
import { config } from '../config';

/**
 * Wizard 服务类 - 处理向导相关业务逻辑
 */
export class WizardService {
  private graphDBRepository: GraphDBRepository;

  constructor(graphDBRepository: GraphDBRepository) {
    this.graphDBRepository = graphDBRepository;
  }

  /**
   * 预览向导生成的 TTL
   */
  async previewWizardData(payload: WizardPayload): Promise<TripleResult> {
    try {
      this.validateWizardPayload(payload);
      return this.buildTriplesFromWizard(payload);
    } catch (error) {
      throw new WizardError(
        `Failed to preview wizard data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { payload, originalError: error }
      );
    }
  }

  /**
   * 提交向导数据到 GraphDB
   */
  async submitWizardData(ttl: string, graph?: string): Promise<{ ok: boolean; graph: string | null }> {
    if (!ttl || typeof ttl !== 'string') {
      throw new ValidationError('TTL content is required');
    }

    try {
      const targetGraph = graph || config.DEFAULT_GRAPH;
      await this.graphDBRepository.writeTurtleData(ttl, targetGraph);
      
      return {
        ok: true,
        graph: targetGraph || null
      };
    } catch (error) {
      throw new WizardError(
        `Failed to submit wizard data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { ttl, graph, originalError: error }
      );
    }
  }

  /**
   * 验证向导草稿数据
   */
  async validateDraftData(ttl: string, graph?: string): Promise<{ ok: boolean; graph?: string; report?: string; message?: string; raw?: string }> {
    if (!ttl || typeof ttl !== 'string' || !ttl.trim()) {
      throw new ValidationError('TTL content is required');
    }

    const tempGraph = `http://example.org/tmp/validate/${crypto.randomUUID()}`;
    
    try {
      // 尝试写入临时图进行 SHACL 验证
      await this.graphDBRepository.writeTurtleData(ttl, tempGraph);
      
      // 如果写入成功，立即删除临时图
      await this.graphDBRepository.deleteGraph(tempGraph);
      
      return {
        ok: true,
        graph: tempGraph,
        report: undefined
      };
    } catch (error) {
      // SHACL 验证失败
      return {
        ok: false,
        graph: tempGraph,
        message: 'SHACL validation failed for draft',
        raw: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 验证向导负载
   */
  private validateWizardPayload(payload: WizardPayload): void {
    if (!payload) {
      throw new ValidationError('Wizard payload is required');
    }

    if (!payload.metric) {
      throw new ValidationError('Metric is required in wizard payload');
    }

    const { metric } = payload;
    if (!metric.code || !metric.label || !metric.hasType || !metric.hasCalculationMethod || !metric.hasMetricType || !metric.hasUnit) {
      throw new ValidationError('Metric must have code, label, hasType, hasCalculationMethod, hasMetricType, and hasUnit');
    }

    // 验证计算方法特定要求
    if (metric.hasCalculationMethod === 'direct_measurement') {
      if (!payload.datasetVariables || payload.datasetVariables.length === 0) {
        throw new ValidationError('Direct measurement requires at least one dataset variable');
      }

      // 验证每个数据集变量都有源
      for (const dv of payload.datasetVariables) {
        if (!dv.sources || dv.sources.length === 0) {
          throw new ValidationError(`Dataset variable '${dv.label}' requires at least one source`);
        }
      }
    }

    if (metric.hasCalculationMethod === 'calculation_model') {
      if (!payload.model) {
        throw new ValidationError('Calculation model method requires model information');
      }
      if (!payload.implementation) {
        throw new ValidationError('Calculation model method requires implementation information');
      }
    }
  }

  /**
   * 从向导负载构建 RDF 三元组
   */
  private buildTriplesFromWizard(input: WizardPayload): TripleResult {
    const triples: Triple[] = [];

    const industryIri = input.industry?.iri || (input.industry?.code ? iri(input.industry.code) : null);
    const frameworkIri = input.framework?.iri || (input.framework?.code ? iri(input.framework.code) : null);
    const categoryIri = input.category?.iri || (input.category?.code ? iri(input.category.code) : null);
    const metricIri = input.metric.iri || iri(input.metric.code);

    // A. 位置链路 (Industry -> Framework -> Category -> Metric)
    if (industryIri) {
      triples.push({ s: industryIri, p: 'a', o: 'esg:Industry', oType: 'iri' });
      if (input.industry?.label) {
        triples.push({ s: industryIri, p: 'rdfs:label', o: lit(input.industry.label) });
      }
    }

    if (frameworkIri) {
      triples.push({ s: frameworkIri, p: 'a', o: 'esg:ReportingFramework', oType: 'iri' });
      if (input.framework?.label) {
        triples.push({ s: frameworkIri, p: 'rdfs:label', o: lit(input.framework.label) });
      }
      if (input.framework?.sourceDocument) {
        triples.push({ s: frameworkIri, p: 'esg:sourceDocument', o: lit(input.framework.sourceDocument) });
      }
    }

    if (categoryIri) {
      triples.push({ s: categoryIri, p: 'a', o: 'esg:Category', oType: 'iri' });
      if (input.category?.label) {
        triples.push({ s: categoryIri, p: 'rdfs:label', o: lit(input.category.label) });
      }
    }

    // 建立链路关系
    if (industryIri && frameworkIri) {
      triples.push({ s: industryIri, p: 'esg:reportsUsing', o: frameworkIri, oType: 'iri' });
    }
    if (frameworkIri && categoryIri) {
      triples.push({ s: frameworkIri, p: 'esg:includes', o: categoryIri, oType: 'iri' });
    }
    if (categoryIri) {
      triples.push({ s: categoryIri, p: 'esg:consistsOf', o: metricIri, oType: 'iri' });
    }

    // B. Metric 基础信息
    triples.push({ s: metricIri, p: 'a', o: 'esg:Metric', oType: 'iri' });
    triples.push({ s: metricIri, p: 'rdfs:label', o: lit(input.metric.label) });
    triples.push({ s: metricIri, p: 'esg:hasType', o: lit(input.metric.hasType) });
    triples.push({ s: metricIri, p: 'esg:hasCalculationMethod', o: lit(input.metric.hasCalculationMethod) });
    triples.push({ s: metricIri, p: 'esg:hasMetricType', o: lit(input.metric.hasMetricType) });
    triples.push({ s: metricIri, p: 'esg:hasUnit', o: lit(input.metric.hasUnit) });
    
    if (input.metric.hasDescription) {
      triples.push({ s: metricIri, p: 'esg:hasDescription', o: lit(input.metric.hasDescription) });
    }

    // C. 处理不同的计算方法
    if (input.metric.hasCalculationMethod === 'direct_measurement') {
      this.buildDirectMeasurementTriples(input, metricIri, triples);
    } else if (input.metric.hasCalculationMethod === 'calculation_model') {
      this.buildCalculationModelTriples(input, metricIri, triples);
    }

    const ttl = triplesToTTL(triples);
    return { triples, ttl };
  }

  /**
   * 构建直接测量相关的三元组
   */
  private buildDirectMeasurementTriples(input: WizardPayload, metricIri: string, triples: Triple[]): void {
    if (!input.datasetVariables) return;

    for (const dv of input.datasetVariables) {
      const dvIri = dv.iri || iri(dv.label.replace(/\s+/g, ''));
      
      triples.push({ s: dvIri, p: 'a', o: 'esg:DatasetVariable', oType: 'iri' });
      triples.push({ s: dvIri, p: 'rdfs:label', o: lit(dv.label) });
      
      if (dv.alignmentReason) {
        triples.push({ s: dvIri, p: 'esg:alignmentReason', o: lit(dv.alignmentReason) });
      }
      if (typeof dv.confidenceScore === 'number') {
        triples.push({ s: dvIri, p: 'esg:hasConfidenceScore', o: lit(dv.confidenceScore, 'int') });
      }
      if (dv.isUnitCompatible) {
        triples.push({ s: dvIri, p: 'esg:isUnitCompatible', o: lit(dv.isUnitCompatible) });
      }

      triples.push({ s: metricIri, p: 'esg:obtainedFrom', o: dvIri, oType: 'iri' });

      // 处理数据源
      for (const src of dv.sources) {
        const srcIri = src.iri || iri(src.label.replace(/\s+/g, ''));
        
        triples.push({ s: srcIri, p: 'a', o: 'esg:DataSource', oType: 'iri' });
        triples.push({ s: srcIri, p: 'rdfs:label', o: lit(src.label) });
        
        if (src.fileName) triples.push({ s: srcIri, p: 'esg:hasFileName', o: lit(src.fileName) });
        if (src.description) triples.push({ s: srcIri, p: 'esg:hasDescription', o: lit(src.description) });
        if (src.coverage) triples.push({ s: srcIri, p: 'esg:hasCoverage', o: lit(src.coverage) });
        if (typeof src.recordCount === 'number') {
          triples.push({ s: srcIri, p: 'esg:hasRecordCount', o: lit(src.recordCount, 'int') });
        }
        
        triples.push({ s: dvIri, p: 'esg:sourceFrom', o: srcIri, oType: 'iri' });
      }
    }
  }

  /**
   * 构建计算模型相关的三元组
   */
  private buildCalculationModelTriples(input: WizardPayload, metricIri: string, triples: Triple[]): void {
    if (!input.model || !input.implementation) return;

    const model = input.model;
    const impl = input.implementation;
    
    const modelIri = model.iri || iri((model.label || 'Model').replace(/\s+/g, ''));
    
    triples.push({ s: modelIri, p: 'a', o: 'esg:Model', oType: 'iri' });
    if (model.label) triples.push({ s: modelIri, p: 'rdfs:label', o: lit(model.label) });
    if (model.calculationType) triples.push({ s: modelIri, p: 'esg:hasCalculationType', o: lit(model.calculationType) });
    if (model.formula) triples.push({ s: modelIri, p: 'esg:hasFormula', o: lit(model.formula) });
    if (model.mathematicalExpression) triples.push({ s: modelIri, p: 'esg:hasMathematicalExpression', o: lit(model.mathematicalExpression) });

    triples.push({ s: metricIri, p: 'esg:isCalculatedBy', o: modelIri, oType: 'iri' });

    // 模型输入依赖
    if (model.requiresInputFrom?.length) {
      for (const inputMetric of model.requiresInputFrom) {
        triples.push({ s: modelIri, p: 'esg:requiresInputFrom', o: iri(inputMetric), oType: 'iri' });
      }
    }

    // 实现信息
    const implIri = impl.iri || iri((impl.label || 'Implementation').replace(/\s+/g, ''));
    
    triples.push({ s: implIri, p: 'a', o: 'esg:Implementation', oType: 'iri' });
    if (impl.label) triples.push({ s: implIri, p: 'rdfs:label', o: lit(impl.label) });
    if (impl.language) triples.push({ s: implIri, p: 'esg:hasLanguage', o: lit(impl.language) });
    if (impl.filePath) triples.push({ s: implIri, p: 'esg:hasFilePath', o: lit(impl.filePath) });
    if (impl.func) triples.push({ s: implIri, p: 'esg:hasFunction', o: lit(impl.func) });
    if (impl.returnType) triples.push({ s: implIri, p: 'esg:hasReturnType', o: lit(impl.returnType) });
    if (impl.validation) triples.push({ s: implIri, p: 'esg:hasValidation', o: lit(impl.validation) });
    
    triples.push({ s: modelIri, p: 'esg:executesWith', o: implIri, oType: 'iri' });
  }
}