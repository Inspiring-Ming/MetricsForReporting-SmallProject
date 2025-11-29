import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/models';

describe('Model API - CRUD Operations', () => {
  beforeEach(async () => {
    await helper.cleanModels();
    await helper.cleanMetrics();
  });

  afterAll(async () => {
    await helper.cleanModels();
    await helper.cleanMetrics();
  });

  describe('GET /api/kg/models', () => {
    it('should return empty list when no models exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result).toHaveLength(0);
      expect(response.body).toHaveProperty('total', 0);
    });

    it('should return list of models', async () => {
      // Create test models
      await helper.createTestModel('Model 1', []);
      await helper.createTestModel('Model 2', []);

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBeGreaterThanOrEqual(2);

      // Verify structure of models
      const model = response.body.result[0];
      expect(model).toHaveProperty('iri');
      expect(model).toHaveProperty('label');
    });

    it('should support pagination with limit', async () => {
      // Create 5 test models
      for (let i = 1; i <= 5; i++) {
        await helper.createTestModel(`Model ${i}`, []);
      }

      const response = await request(app)
        .get(`${baseUrl}?size=3`)
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });

    it('should support pagination with offset', async () => {
      // Create 3 test models
      await helper.createTestModel('Model 1', []);
      await helper.createTestModel('Model 2', []);
      await helper.createTestModel('Model 3', []);

      const response = await request(app)
        .get(`${baseUrl}?page=2&size=2`)
        .expect(200);

      // Page 2 with size 2 means items 3-4, but we only have 3 items total
      expect(response.body.result).toHaveLength(1);
      expect(response.body.total).toBe(3);
    });

    it('should filter by label', async () => {
      await helper.createTestModel('Carbon Model', []);
      await helper.createTestModel('Water Model', []);

      const response = await request(app)
        .get(`${baseUrl}?search=Carbon`)
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
      response.body.result.forEach((model: any) => {
        expect(model.label).toContain('Carbon');
      });
    });
  });

  describe('POST /api/kg/models', () => {
    it('should create a new model with input metrics', async () => {
      // Create test metrics and implementation
      const metric1 = await helper.createTestMetric('Input Metric 1');
      const metric2 = await helper.createTestMetric('Input Metric 2');
      const impl = await helper.createTestImplementation('Test Implementation', {
        language: 'Python',
        filePath: '/path/to/impl.py'
      });

      const newModel = {
        name: 'newtestmodel',
        calculation_type: 'percentage_ratio',
        input_metrics: [metric1, metric2],
        implementation: impl
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newModel)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');

      // Verify it exists in database
      const exists = await helper.modelExists(response.body.iri);
      expect(exists).toBe(true);
    });

    it('should create model without input metrics', async () => {
      const impl = await helper.createTestImplementation('Simple Implementation', {
        language: 'Python',
        filePath: '/path/to/simple.py'
      });

      const newModel = {
        name: 'simplemodel',
        calculation_type: 'intensity_ratio',
        input_metrics: [],
        implementation: impl
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newModel)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
    });

    it('should return 400 when name is missing', async () => {
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });

      const invalidModel = {
        calculation_type: 'percentage_ratio',
        input_metrics: [],
        implementation: impl
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidModel)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when calculation_type is missing', async () => {
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });

      const invalidModel = {
        name: 'testmodel',
        input_metrics: [],
        implementation: impl
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidModel)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when input metric does not exist', async () => {
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });
      const fakeMetricIri = 'http://example.org/metrics/non-existent';
      const newModel = {
        name: 'testmodel',
        calculation_type: 'percentage_ratio',
        input_metrics: [fakeMetricIri],
        implementation: impl
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newModel)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/kg/models/:id', () => {
    it('should return model by ID with input metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const model = await helper.createTestModel('Test Model', [metric1, metric2]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri', model);
      expect(response.body.result).toHaveProperty('label', 'Test Model');
      expect(response.body.result).toHaveProperty('inputMetrics');
      expect(Array.isArray(response.body.result.inputMetrics)).toBe(true);
      expect(response.body.result.inputMetrics).toHaveLength(2);
    });

    it('should return model without input metrics', async () => {
      const model = await helper.createTestModel('Simple Model', []);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri', model);
      expect(response.body.result).toHaveProperty('label', 'Simple Model');
      expect(response.body.result).toHaveProperty('inputMetrics');
      expect(response.body.result.inputMetrics).toHaveLength(0);
    });

    it('should return 404 for non-existent model', async () => {
      const fakeIri = 'http://example.org/models/non-existent';
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(fakeIri)}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/kg/models/:id', () => {
    it('should update model label', async () => {
      const model = await helper.createTestModel('Original Label', []);

      const updates = {
        label: 'Updated Label'
      };

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('iri', model);
      expect(response.body).toHaveProperty('label', 'Updated Label');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should update model with new input metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const metric3 = await helper.createTestMetric('Metric 3');
      
      const model = await helper.createTestModel('Test Model', [metric1]);

      const updates = {
        label: 'Test Model',
        input_metrics: [metric2, metric3]
      };

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('iri', model);
      expect(response.body).toHaveProperty('inputMetrics');
      expect(response.body.inputMetrics).toHaveLength(2);
      
      const inputMetricIris = response.body.inputMetrics.map((m: any) => m.iri);
      expect(inputMetricIris).toContain(metric2);
      expect(inputMetricIris).toContain(metric3);
      expect(inputMetricIris).not.toContain(metric1);
    });

    it('should update both label and input metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const model = await helper.createTestModel('Original', [metric1]);

      const updates = {
        label: 'Updated Label',
        input_metrics: []
      };

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('label', 'Updated Label');
      expect(response.body.inputMetrics).toHaveLength(0);
    });

    it('should return 404 for non-existent model', async () => {
      const fakeIri = 'http://example.org/models/non-existent';
      
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(fakeIri)}`)
        .send({ label: 'New Label' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when label is missing', async () => {
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when input metric does not exist', async () => {
      const model = await helper.createTestModel('Test Model', []);
      const fakeMetricIri = 'http://example.org/metrics/non-existent';

      const updates = {
        label: 'Test Model',
        input_metrics: [fakeMetricIri]
      };

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(model)}`)
        .send(updates)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/kg/models/:id', () => {
    it('should delete a model', async () => {
      const model = await helper.createTestModel('Test Model', []);

      // Verify model exists
      const existsBefore = await helper.modelExists(model);
      expect(existsBefore).toBe(true);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}`)
        .expect(200);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('deleted', true);
      expect(response.body).toHaveProperty('deleted_at');
      expect(typeof response.body.deleted_at).toBe('string');

      // Verify model no longer exists
      const existsAfter = await helper.modelExists(model);
      expect(existsAfter).toBe(false);
    });

    it('should delete model with input metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const model = await helper.createTestModel('Test Model', [metric1, metric2]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify model no longer exists
      const existsAfter = await helper.modelExists(model);
      expect(existsAfter).toBe(false);

      // Verify metrics still exist (should not be deleted)
      const metric1Exists = await helper.metricExists(metric1);
      const metric2Exists = await helper.metricExists(metric2);
      expect(metric1Exists).toBe(true);
      expect(metric2Exists).toBe(true);
    });

    it('should return 404 for non-existent model', async () => {
      const fakeIri = 'http://example.org/models/non-existent';
      
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(fakeIri)}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 when model has dependent metrics without force', async () => {
      const model = await helper.createTestModel('Test Model', []);
      const metric = await helper.createTestMetric('Output Metric');
      
      // Link metric to model as output (isCalculatedBy)
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}`)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      
      // Verify model still exists
      const exists = await helper.modelExists(model);
      expect(exists).toBe(true);
    });

    it('should delete model with dependent metrics when force=true', async () => {
      const model = await helper.createTestModel('Test Model', []);
      const metric = await helper.createTestMetric('Output Metric');
      
      // Link metric to model as output
      await helper.linkMetricToModel(metric, model);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(model)}?force=true`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify model no longer exists
      const modelExists = await helper.modelExists(model);
      expect(modelExists).toBe(false);

      // Verify metric still exists but no longer linked to model
      const metricExists = await helper.metricExists(metric);
      expect(metricExists).toBe(true);
    });
  });
});
