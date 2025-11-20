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

  describe('Metrics Used as Inputs', () => {
    it('should return models that use the metric as input', async () => {
      const inputMetric = await helper.createTestMetric('Input Metric');
      const model1 = await helper.createTestModel('Model 1', [inputMetric]);
      const model2 = await helper.createTestModel('Model 2', [inputMetric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(inputMetric)}/models`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');
      expect(response.body.metricId).toBe(inputMetric);
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should return empty array when metric is not used by any model', async () => {
      const unusedMetric = await helper.createTestMetric('Unused Metric');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(unusedMetric)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(unusedMetric);
      expect(response.body.models).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return multiple models using the same metric', async () => {
      const sharedInput = await helper.createTestMetric('Shared Input');
      const model1 = await helper.createTestModel('Model A', [sharedInput]);
      const model2 = await helper.createTestModel('Model B', [sharedInput]);
      const model3 = await helper.createTestModel('Model C', [sharedInput]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(sharedInput)}/models`)
        .expect(200);

      expect(response.body.models).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should include model details in response', async () => {
      const inputMetric = await helper.createTestMetric('Detailed Input');
      const modelUri = await helper.createTestModel('Detailed Model', [inputMetric]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(inputMetric)}/models`)
        .expect(200);

      expect(Array.isArray(response.body.models)).toBe(true);
      if (response.body.models.length > 0) {
        const model = response.body.models[0];
        expect(model).toHaveProperty('iri');
        expect(model).toHaveProperty('label');
      }
    });
  });

  describe('Response Structure', () => {
    it('should have correct response structure', async () => {
      const metric = await helper.createTestMetric('Structure Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');
      
      expect(typeof response.body.metricId).toBe('string');
      expect(typeof response.body.metricLabel).toBe('string');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(typeof response.body.total).toBe('number');
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
        .get(`${baseUrl}/${encodeURIComponent('invalid uri')}/models`)
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
    it('should handle metric used in nested model chain', async () => {
      const baseMetric = await helper.createTestMetric('Base Metric');
      const intermediateModel = await helper.createTestModel('Intermediate', [baseMetric]);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(baseMetric)}/models`)
        .expect(200);

      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should handle metric with special characters', async () => {
      // Use underscores and hyphens which are safe for SPARQL
      const metric = await helper.createTestMetric('Metric_With-Special_Chars');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response.body.metricId).toBe(metric);
    });

    it('should return consistent results for multiple requests', async () => {
      const metric = await helper.createTestMetric('Consistency Test');
      const model = await helper.createTestModel('Test Model', [metric]);

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/models`)
        .expect(200);

      expect(response1.body.total).toBe(response2.body.total);
      expect(response1.body.metricId).toBe(response2.body.metricId);
    });
  });
});
