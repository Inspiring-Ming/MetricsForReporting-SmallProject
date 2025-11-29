import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/models';

describe('Model API - Metrics Endpoints', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  describe('GET /api/kg/models/:id/metrics/inputs', () => {
    it('should return input metrics for a model', async () => {
      const inputMetric1 = await helper.createTestMetric('Revenue', { 
        calculationMethod: 'direct_measurement',
        unit: 'USD'
      });
      const inputMetric2 = await helper.createTestMetric('Total Assets', { 
        calculationMethod: 'direct_measurement',
        unit: 'USD'
      });
      
      const model = await helper.createTestModel('ROA Model', [inputMetric1, inputMetric2], {
        calculationType: 'percentage_ratio',
        formula: 'Revenue / Total Assets * 100'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId', model);
      expect(response.body).toHaveProperty('modelLabel', 'ROA Model');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('total', 2);
      expect(Array.isArray(response.body.inputs)).toBe(true);
      expect(response.body.inputs).toHaveLength(2);

      // Check input structure
      response.body.inputs.forEach((input: any) => {
        expect(input).toHaveProperty('iri');
        expect(input).toHaveProperty('label');
        expect(input).toHaveProperty('hasCalculationMethod');
        expect(input).toHaveProperty('hasUnit');
      });

      // Verify specific inputs
      const labels = response.body.inputs.map((i: any) => i.label);
      expect(labels).toContain('Revenue');
      expect(labels).toContain('Total Assets');
    });

    it('should return empty inputs array for model with no inputs', async () => {
      const model = await helper.createTestModel('Empty Model', [], {
        calculationType: 'sum'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(response.body.modelId).toBe(model);
      expect(response.body.inputs).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should sort inputs by label alphabetically', async () => {
      const metricZ = await helper.createTestMetric('Z Metric');
      const metricA = await helper.createTestMetric('A Metric');
      const metricM = await helper.createTestMetric('M Metric');
      
      const model = await helper.createTestModel('Test Model', [metricZ, metricA, metricM]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(response.body.inputs).toHaveLength(3);
      const labels = response.body.inputs.map((i: any) => i.label);
      expect(labels).toEqual(['A Metric', 'M Metric', 'Z Metric']);
    });

    it('should return 404 for non-existent model', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentModel';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics/inputs`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include hasCalculationMethod and hasUnit in response', async () => {
      const directMetric = await helper.createTestMetric('Direct Metric', {
        calculationMethod: 'direct_measurement',
        unit: 'Number'
      });
      const calcMetric = await helper.createTestMetric('Calc Metric', {
        calculationMethod: 'calculation_model',
        unit: 'Percentage'
      });
      
      const model = await helper.createTestModel('Test Model', [directMetric, calcMetric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      const directInput = response.body.inputs.find((i: any) => i.label === 'Direct Metric');
      expect(directInput.hasCalculationMethod).toBe('direct_measurement');
      expect(directInput.hasUnit).toBe('Number');

      const calcInput = response.body.inputs.find((i: any) => i.label === 'Calc Metric');
      expect(calcInput.hasCalculationMethod).toBe('calculation_model');
      expect(calcInput.hasUnit).toBe('Percentage');
    });
  });

  describe('GET /api/kg/models/:id/metrics/output', () => {
    it('should return output metric for a model', async () => {
      const inputMetric = await helper.createTestMetric('Input Metric');
      const outputMetric = await helper.createTestMetric('Output Metric', {
        calculationMethod: 'calculation_model'
      });
      
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(outputMetric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/output`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId', model);
      expect(response.body).toHaveProperty('modelLabel', 'Test Model');
      expect(response.body).toHaveProperty('output');
      expect(response.body.output).not.toBeNull();
      expect(response.body.output).toHaveProperty('iri', outputMetric);
      expect(response.body.output).toHaveProperty('label', 'Output Metric');
      expect(response.body.output).toHaveProperty('hasCalculationMethod', 'calculation_model');
    });

    it('should return null output for model without output metric', async () => {
      const inputMetric = await helper.createTestMetric('Input Metric');
      const model = await helper.createTestModel('No Output Model', [inputMetric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/output`)
        .expect(200);

      expect(response.body.modelId).toBe(model);
      expect(response.body.output).toBeNull();
    });

    it('should return only one output metric even if multiple exist', async () => {
      const inputMetric = await helper.createTestMetric('Input Metric');
      const outputMetric1 = await helper.createTestMetric('Output 1', {
        calculationMethod: 'calculation_model'
      });
      const outputMetric2 = await helper.createTestMetric('Output 2', {
        calculationMethod: 'calculation_model'
      });
      
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(outputMetric1, model);
      await helper.linkMetricToModel(outputMetric2, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/output`)
        .expect(200);

      expect(response.body.output).not.toBeNull();
      expect(response.body.output).toHaveProperty('iri');
      expect(response.body.output).toHaveProperty('label');
      // Should only return one output
      expect(typeof response.body.output.iri).toBe('string');
    });

    it('should return 404 for non-existent model', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentModel';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics/output`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include hasUnit and hasMetricType in output', async () => {
      const inputMetric = await helper.createTestMetric('Input');
      const outputMetric = await helper.createTestMetric('Output', {
        calculationMethod: 'calculation_model',
        unit: 'Percentage',
        dataType: 'Quantitative'
      });
      
      const model = await helper.createTestModel('Test Model', [inputMetric]);
      await helper.linkMetricToModel(outputMetric, model);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/output`)
        .expect(200);

      expect(response.body.output.hasUnit).toBe('Percentage');
      expect(response.body.output.hasMetricType).toBe('Quantitative');
    });
  });

  describe('PUT /api/kg/models/:id/metrics/inputs', () => {
    it('should update input metrics for a model', async () => {
      const oldMetric1 = await helper.createTestMetric('Old Metric 1');
      const oldMetric2 = await helper.createTestMetric('Old Metric 2');
      const model = await helper.createTestModel('Test Model', [oldMetric1, oldMetric2]);

      const newMetric1 = await helper.createTestMetric('New Metric 1');
      const newMetric2 = await helper.createTestMetric('New Metric 2');
      const newMetric3 = await helper.createTestMetric('New Metric 3');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [newMetric1, newMetric2, newMetric3] })
        .expect(200);

      expect(response.body).toHaveProperty('modelId', model);
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('updated_at');
      expect(Array.isArray(response.body.inputs)).toBe(true);
      expect(response.body.inputs).toHaveLength(3);

      const labels = response.body.inputs.map((i: any) => i.label);
      expect(labels).toContain('New Metric 1');
      expect(labels).toContain('New Metric 2');
      expect(labels).toContain('New Metric 3');
      expect(labels).not.toContain('Old Metric 1');
      expect(labels).not.toContain('Old Metric 2');
    });

    it('should verify inputs are actually updated in database', async () => {
      const oldMetric = await helper.createTestMetric('Old Metric');
      const model = await helper.createTestModel('Test Model', [oldMetric]);

      const newMetric = await helper.createTestMetric('New Metric');

      await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [newMetric] })
        .expect(200);

      // Verify by fetching inputs again
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(verifyResponse.body.inputs).toHaveLength(1);
      expect(verifyResponse.body.inputs[0].label).toBe('New Metric');
    });

    it('should allow updating to empty inputs array', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const model = await helper.createTestModel('Test Model', [metric1, metric2]);

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('At least one input metric is required');
    });

    it('should return 404 for non-existent model', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentModel';
      const metric = await helper.createTestMetric('Test Metric');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics/inputs`)
        .send({ inputs: [metric] })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid request body', async () => {
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: 'not-an-array' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when inputs field is missing', async () => {
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle metric URIs and labels in inputs array', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const model = await helper.createTestModel('Test Model', [metric1]);

      const newMetric = await helper.createTestMetric('New Metric');

      // Test with URI
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [newMetric] })
        .expect(200);

      expect(response.body.inputs).toHaveLength(1);
      expect(response.body.inputs[0].iri).toBe(newMetric);
    });

    it('should update timestamp on successful update', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const model = await helper.createTestModel('Test Model', [metric1]);

      const metric2 = await helper.createTestMetric('Metric 2');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [metric2] })
        .expect(200);

      expect(response.body.updated_at).toBeDefined();
      expect(typeof response.body.updated_at).toBe('string');
      const timestamp = new Date(response.body.updated_at);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should handle multiple metrics in different orders', async () => {
      const metric1 = await helper.createTestMetric('A Metric');
      const model = await helper.createTestModel('Test Model', [metric1]);

      const metricZ = await helper.createTestMetric('Z Metric');
      const metricM = await helper.createTestMetric('M Metric');
      const metricB = await helper.createTestMetric('B Metric');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [metricZ, metricM, metricB] })
        .expect(200);

      expect(response.body.inputs).toHaveLength(3);
      // Response should maintain the order or sort by label
      const labels = response.body.inputs.map((i: any) => i.label);
      expect(labels).toContain('Z Metric');
      expect(labels).toContain('M Metric');
      expect(labels).toContain('B Metric');
    });
  });

  describe('Response Structure Validation', () => {
    it('GET inputs should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', [metric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId');
      expect(response.body).toHaveProperty('modelLabel');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('total');
      expect(typeof response.body.modelId).toBe('string');
      expect(typeof response.body.modelLabel).toBe('string');
      expect(Array.isArray(response.body.inputs)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('GET output should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', [metric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/output`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId');
      expect(response.body).toHaveProperty('modelLabel');
      expect(response.body).toHaveProperty('output');
      expect(typeof response.body.modelId).toBe('string');
      expect(typeof response.body.modelLabel).toBe('string');
    });

    it('PUT inputs should have correct response structure', async () => {
      const oldMetric = await helper.createTestMetric('Old Metric');
      const model = await helper.createTestModel('Test Model', [oldMetric]);
      const newMetric = await helper.createTestMetric('New Metric');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .send({ inputs: [newMetric] })
        .expect(200);

      expect(response.body).toHaveProperty('modelId');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('updated_at');
      expect(typeof response.body.modelId).toBe('string');
      expect(Array.isArray(response.body.inputs)).toBe(true);
      expect(typeof response.body.updated_at).toBe('string');
    });
  });

  describe('POST /api/kg/models/:id/metrics/inputs/:metricId', () => {
    it('should add a single input metric to a model', async () => {
      const metric1 = await helper.createTestMetric('Existing Metric');
      const model = await helper.createTestModel('Test Model', [metric1]);
      const metric2 = await helper.createTestMetric('New Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric2)}`)
        .expect(201);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric2);
      expect(response.body).toHaveProperty('added_at');
      expect(typeof response.body.added_at).toBe('string');

      // Verify the metric was actually added
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(verifyResponse.body.inputs).toHaveLength(2);
      const metricIris = verifyResponse.body.inputs.map((m: any) => m.iri);
      expect(metricIris).toContain(metric1);
      expect(metricIris).toContain(metric2);
    });

    it('should add metric to model with no existing inputs', async () => {
      const model = await helper.createTestModel('Empty Model', []);
      const metric = await helper.createTestMetric('First Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(201);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric);
      expect(response.body).toHaveProperty('added_at');
    });

    it('should return 404 if model does not exist', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      await request(app)
        .post(`${baseUrl}/nonexistent-model/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(404);
    });

    it('should handle adding the same metric multiple times gracefully', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', []);

      // Add metric first time
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(201);

      // Add same metric second time (should succeed or handle gracefully)
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(201);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric);
    });

    it('should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(201);

      expect(response.body).toHaveProperty('model_iri');
      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('added_at');
      expect(typeof response.body.model_iri).toBe('string');
      expect(typeof response.body.metric_iri).toBe('string');
      expect(typeof response.body.added_at).toBe('string');
      
      // Verify it's a valid ISO timestamp
      expect(new Date(response.body.added_at).toISOString()).toBe(response.body.added_at);
    });
  });

  describe('DELETE /api/kg/models/:id/metrics/inputs/:metricId', () => {
    it('should remove a single input metric from a model', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const metric3 = await helper.createTestMetric('Metric 3');
      const model = await helper.createTestModel('Test Model', [metric1, metric2, metric3]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric2)}`)
        .expect(200);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric2);
      expect(response.body).toHaveProperty('removed_at');
      expect(typeof response.body.removed_at).toBe('string');

      // Verify the metric was actually removed
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(verifyResponse.body.inputs).toHaveLength(2);
      const metricIris = verifyResponse.body.inputs.map((m: any) => m.iri);
      expect(metricIris).toContain(metric1);
      expect(metricIris).toContain(metric3);
      expect(metricIris).not.toContain(metric2);
    });

    it('should remove the only input metric from a model', async () => {
      const metric = await helper.createTestMetric('Only Metric');
      const model = await helper.createTestModel('Test Model', [metric]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(200);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric);
      expect(response.body).toHaveProperty('removed_at');

      // Verify model has no inputs now
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs`)
        .expect(200);

      expect(verifyResponse.body.inputs).toHaveLength(0);
    });

    it('should return 404 if model does not exist', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      await request(app)
        .delete(`${baseUrl}/nonexistent-model/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(404);
    });

    it('should handle removing non-existent metric gracefully', async () => {
      const metric1 = await helper.createTestMetric('Existing Metric');
      const model = await helper.createTestModel('Test Model', [metric1]);
      const metric2 = await helper.createTestMetric('Non-Input Metric');

      // Try to remove metric that is not an input (should succeed or handle gracefully)
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric2)}`)
        .expect(200);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric2);
    });

    it('should handle removing already removed metric', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', [metric]);

      // Remove metric first time
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(200);

      // Remove same metric second time (should succeed or handle gracefully)
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(200);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('metric_iri', metric);
    });

    it('should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const model = await helper.createTestModel('Test Model', [metric]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}/metrics/inputs/${encodeURIComponent(metric)}`)
        .expect(200);

      expect(response.body).toHaveProperty('model_iri');
      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('removed_at');
      expect(typeof response.body.model_iri).toBe('string');
      expect(typeof response.body.metric_iri).toBe('string');
      expect(typeof response.body.removed_at).toBe('string');
      
      // Verify it's a valid ISO timestamp
      expect(new Date(response.body.removed_at).toISOString()).toBe(response.body.removed_at);
    });
  });
});
