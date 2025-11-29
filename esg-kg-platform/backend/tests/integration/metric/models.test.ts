import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/models', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  describe('Calculation Model Metrics', () => {
    it('should return models that calculate the metric', async () => {
      const outputMetric = await helper.createTestMetric('Output Metric', { calculationMethod: 'calculation_model' });
      const inputMetric1 = await helper.createTestMetric('Input 1');
      const inputMetric2 = await helper.createTestMetric('Input 2');
      const model1 = await helper.createTestModel('Model 1', [inputMetric1], {
        calculationType: 'percentage_ratio',
        formula: 'A / B * 100'
      });
      const model2 = await helper.createTestModel('Model 2', [inputMetric2], {
        calculationType: 'intensity_ratio',
        formula: 'C / D'
      });
      await helper.linkMetricToModel(outputMetric, model1);
      await helper.linkMetricToModel(outputMetric, model2);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(outputMetric)}/models`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('usage');
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');
      expect(response.body.metricId).toBe(outputMetric);
      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(response.body.usage).toBe('output');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it('should return empty array for calculation_model metric without models', async () => {
      const metric = await helper.createTestMetric('No Model Metric', { calculationMethod: 'calculation_model' });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(metric);
      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(response.body.models).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should include model details in response', async () => {
      const metric = await helper.createTestMetric('Detailed Test', { calculationMethod: 'calculation_model' });
      const inputMetric = await helper.createTestMetric('Input');
      const model = await helper.createTestModel('Detailed Model', [inputMetric], {
        calculationType: 'sum',
        formula: 'A + B',
        mathematicalExpression: 'x + y'
      });
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.models).toHaveLength(1);
      const returnedModel = response.body.models[0];
      expect(returnedModel).toHaveProperty('iri');
      expect(returnedModel).toHaveProperty('label');
      expect(returnedModel.label).toBe('Detailed Model');
      expect(returnedModel.calculationType).toBe('sum');
      expect(returnedModel.formula).toBe('A + B');
      expect(returnedModel.mathematicalExpression).toBe('x + y');
      expect(returnedModel).toHaveProperty('inputMetrics');
      expect(Array.isArray(returnedModel.inputMetrics)).toBe(true);
    });
  });

  describe('Direct Measurement Metrics', () => {
    it('should return empty models array for direct_measurement metric', async () => {
      const directMetric = await helper.createTestMetric('Direct Metric', { calculationMethod: 'direct_measurement' });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(directMetric)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(directMetric);
      expect(response.body.calculationMethod).toBe('direct_measurement');
      expect(response.body.usage).toBe('output');
      expect(response.body.models).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Response Structure', () => {
    it('should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Structure Test', { calculationMethod: 'calculation_model' });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('usage');
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');

      expect(typeof response.body.metricId).toBe('string');
      expect(typeof response.body.metricLabel).toBe('string');
      expect(typeof response.body.calculationMethod).toBe('string');
      expect(typeof response.body.usage).toBe('string');
      expect(['output', 'input']).toContain(response.body.usage);
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should include inputMetrics in model details', async () => {
      const metric = await helper.createTestMetric('Input Test', { calculationMethod: 'calculation_model' });
      const input1 = await helper.createTestMetric('Input A');
      const input2 = await helper.createTestMetric('Input B');
      const model = await helper.createTestModel('Test Model', [input1, input2]);
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.models).toHaveLength(1);
      const returnedModel = response.body.models[0];
      expect(returnedModel.inputMetrics).toHaveLength(2);
      returnedModel.inputMetrics.forEach((input: any) => {
        expect(input).toHaveProperty('iri');
        expect(input).toHaveProperty('label');
      });
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/models`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid iri')}/models`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /models`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Format Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded Test');
      const encodedUri = encodeURIComponent(metricUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle metric calculated by multiple models', async () => {
      const metric = await helper.createTestMetric('Multi Model Metric', { calculationMethod: 'calculation_model' });
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');
      const model1 = await helper.createTestModel('Model A', [input1]);
      const model2 = await helper.createTestModel('Model B', [input2]);
      const model3 = await helper.createTestModel('Model C', [input1, input2]);
      
      await helper.linkMetricToModel(metric, model1);
      await helper.linkMetricToModel(metric, model2);
      await helper.linkMetricToModel(metric, model3);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.total).toBe(3);
    });

    it('should handle metric with special characters', async () => {
      const metric = await helper.createTestMetric('Metric_With-Special_Chars', { calculationMethod: 'calculation_model' });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(metric);
      expect(response.body.calculationMethod).toBe('calculation_model');
    });

    it('should return consistent results for multiple requests', async () => {
      const metric = await helper.createTestMetric('Consistency Test', { calculationMethod: 'calculation_model' });
      const inputMetric = await helper.createTestMetric('Input');
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(metric, model);

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response1.body.total).toBe(response2.body.total);
      expect(response1.body.metricId).toBe(response2.body.metricId);
      expect(response1.body.calculationMethod).toBe(response2.body.calculationMethod);
    });

    it('should sort models by label', async () => {
      const metric = await helper.createTestMetric('Sort Test', { calculationMethod: 'calculation_model' });
      const input = await helper.createTestMetric('Input');
      
      const modelZ = await helper.createTestModel('Z Model', [input]);
      const modelA = await helper.createTestModel('A Model', [input]);
      const modelM = await helper.createTestModel('M Model', [input]);
      
      await helper.linkMetricToModel(metric, modelZ);
      await helper.linkMetricToModel(metric, modelA);
      await helper.linkMetricToModel(metric, modelM);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.models).toHaveLength(3);
      const labels = response.body.models.map((m: any) => m.label);
      expect(labels).toEqual(['A Model', 'M Model', 'Z Model']);
    });
  });

  describe('Usage Parameter - usage=input', () => {
    it('should return models that use the metric as input when usage=input', async () => {
      // 创建作为输入的指标（直接测量类型）
      const revenueMetric = await helper.createTestMetric('Revenue', { calculationMethod: 'direct_measurement' });
      const assetsMetric = await helper.createTestMetric('Total Assets', { calculationMethod: 'direct_measurement' });
      
      // 创建输出指标
      const growthRateMetric = await helper.createTestMetric('Revenue Growth Rate', { calculationMethod: 'calculation_model' });
      const turnoverMetric = await helper.createTestMetric('Asset Turnover', { calculationMethod: 'calculation_model' });
      
      // 创建使用 Revenue 作为输入的模型
      const growthModel = await helper.createTestModel('Growth Rate Model', [revenueMetric], {
        calculationType: 'percentage_change',
        formula: '(current - previous) / previous'
      });
      
      const turnoverModel = await helper.createTestModel('Turnover Model', [revenueMetric, assetsMetric], {
        calculationType: 'intensity_ratio',
        formula: 'revenue / assets'
      });
      
      // 建立关系：输出指标由模型计算
      await helper.linkMetricToModel(growthRateMetric, growthModel);
      await helper.linkMetricToModel(turnoverMetric, turnoverModel);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(revenueMetric)}/models?usage=input`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId', revenueMetric);
      expect(response.body).toHaveProperty('metricLabel', 'Revenue');
      expect(response.body).toHaveProperty('calculationMethod', 'direct_measurement');
      expect(response.body).toHaveProperty('usage', 'input');
      expect(response.body.models).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should include outputMetric in models when usage=input', async () => {
      const inputMetric = await helper.createTestMetric('Input Metric', { calculationMethod: 'direct_measurement' });
      const outputMetric = await helper.createTestMetric('Output Metric', { calculationMethod: 'calculation_model' });
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(outputMetric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(inputMetric)}/models?usage=input`)
        .expect(200);

      expect(response.body.models).toHaveLength(1);
      const returnedModel = response.body.models[0];
      expect(returnedModel).toHaveProperty('outputMetric');
      expect(returnedModel.outputMetric).toHaveProperty('iri', outputMetric);
      expect(returnedModel.outputMetric).toHaveProperty('label', 'Output Metric');
    });

    it('should return empty array when no models use the metric as input', async () => {
      const unusedMetric = await helper.createTestMetric('Unused Metric');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(unusedMetric)}/models?usage=input`)
        .expect(200);

      expect(response.body.usage).toBe('input');
      expect(response.body.models).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should work for calculation_model metrics as input', async () => {
      // calculation_model 类型的指标也可以作为其他模型的输入
      const intermediateMetric = await helper.createTestMetric('Intermediate Metric', { calculationMethod: 'calculation_model' });
      const finalMetric = await helper.createTestMetric('Final Metric', { calculationMethod: 'calculation_model' });
      const finalModel = await helper.createTestModel('Final Model', [intermediateMetric]);
      await helper.linkMetricToModel(finalMetric, finalModel);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(intermediateMetric)}/models?usage=input`)
        .expect(200);

      expect(response.body.usage).toBe('input');
      expect(response.body.total).toBe(1);
      expect(response.body.models[0].label).toBe('Final Model');
    });
  });

  describe('Usage Parameter - usage=output (explicit)', () => {
    it('should return models that calculate the metric when usage=output', async () => {
      const metric = await helper.createTestMetric('Test Metric', { calculationMethod: 'calculation_model' });
      const inputMetric = await helper.createTestMetric('Input');
      const model = await helper.createTestModel('Calculation Model', [inputMetric]);
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models?usage=output`)
        .expect(200);

      expect(response.body.usage).toBe('output');
      expect(response.body.models).toHaveLength(1);
      expect(response.body.models[0].label).toBe('Calculation Model');
    });

    it('should not include outputMetric when usage=output', async () => {
      const metric = await helper.createTestMetric('Test Metric', { calculationMethod: 'calculation_model' });
      const inputMetric = await helper.createTestMetric('Input');
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models?usage=output`)
        .expect(200);

      expect(response.body.models).toHaveLength(1);
      const returnedModel = response.body.models[0];
      expect(returnedModel).not.toHaveProperty('outputMetric');
      expect(returnedModel).toHaveProperty('inputMetrics');
    });
  });

  describe('Usage Parameter Validation', () => {
    it('should default to output when usage parameter is omitted', async () => {
      const metric = await helper.createTestMetric('Default Test', { calculationMethod: 'calculation_model' });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.usage).toBe('output');
    });

    it('should handle invalid usage parameter gracefully', async () => {
      const metric = await helper.createTestMetric('Invalid Usage Test');

      // 无效的 usage 值应该回退到默认值 'output'
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models?usage=invalid`)
        .expect(200);

      expect(response.body.usage).toBe('output');
    });
  });
});
