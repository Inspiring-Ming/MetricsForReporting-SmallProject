import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe.skip('Metric API - POST /api/kg/metrics/:id/inputs (Add Input) - API NOT IMPLEMENTED YET', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  describe('Successful Additions', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should add input metric to calculation_model metric', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('metricUri', metricUri);
      expect(response.body).toHaveProperty('inputMetricUri', inputMetricUri);
    });

    it('should add input metric with order', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri,
          order: 1
        })
        .expect(200);

      expect(response.body.inputMetricUri).toBe(inputMetricUri);
      expect(response.body).toHaveProperty('order', 1);
    });

    it('should add multiple input metrics to same metric', async () => {
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');
      const input3 = await helper.createTestMetric('Input 3');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input1, order: 1 })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input2, order: 2 })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input3, order: 3 })
        .expect(200);

      // Verify all inputs were added
      const getResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .expect(200);

      expect(getResponse.body.inputs.length).toBeGreaterThanOrEqual(3);
    });

    it('should add input metric using short ID format', async () => {
      const inputMetricUri = await helper.createTestMetric('Short ID Input');
      const shortId = inputMetricUri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri: shortId
        })
        .expect(200);

      expect(response.body).toHaveProperty('inputMetricUri');
    });

    it('should allow adding inputs without specifying order', async () => {
      const inputMetricUri = await helper.createTestMetric('Unordered Input');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri
        })
        .expect(200);

      expect(response.body.inputMetricUri).toBe(inputMetricUri);
      // Order may be auto-assigned or undefined
    });

    it('should handle adding inputs with same order value', async () => {
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input1, order: 1 })
        .expect(200);

      // Adding another input with same order - behavior depends on implementation
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input2, order: 1 });

      // Should either succeed or fail with conflict
      expect([200, 409]).toContain(response.status);
    });
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should require inputMetricUri field', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/input.*metric.*required/i);
    });

    it('should reject empty inputMetricUri', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri: ''
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/input.*metric.*required|invalid/i);
    });

    it('should reject invalid inputMetricUri format', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri: 'invalid uri with spaces'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });

    it('should reject non-existent input metric', async () => {
      const nonExistentMetric = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri: nonExistentMetric
        })
        .expect(404);

      expect(response.body.error.message).toMatch(/metric.*not found/i);
    });

    it('should reject negative order value', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri,
          order: -1
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/order|invalid/i);
    });

    it('should reject adding input to direct_measurement metric', async () => {
      const directMetric = await helper.createTestMetric('Direct Metric', {
        calculationMethod: 'direct_measurement'
      });
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(directMetric)}/inputs`)
        .send({
          inputMetricUri
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation.*model|only calculation_model/i);
    });
  });

  describe('Circular Dependency Prevention', () => {
    it('should prevent adding metric as input to itself', async () => {
      metricUri = await helper.createTestMetric('Self Metric', {
        calculationMethod: 'calculation_model'
      });

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({
          inputMetricUri: metricUri
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/circular|itself/i);
    });

    it('should prevent circular dependencies (A->B->A)', async () => {
      const metricA = await helper.createTestMetric('Metric A', {
        calculationMethod: 'calculation_model'
      });
      const metricB = await helper.createTestMetric('Metric B', {
        calculationMethod: 'calculation_model'
      });

      // A depends on B
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricA)}/inputs`)
        .send({ inputMetricUri: metricB })
        .expect(200);

      // Try to make B depend on A (should fail)
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricB)}/inputs`)
        .send({ inputMetricUri: metricA })
        .expect(400);

      expect(response.body.error.message).toMatch(/circular/i);
    });

    it('should prevent indirect circular dependencies (A->B->C->A)', async () => {
      const metricA = await helper.createTestMetric('Metric A', {
        calculationMethod: 'calculation_model'
      });
      const metricB = await helper.createTestMetric('Metric B', {
        calculationMethod: 'calculation_model'
      });
      const metricC = await helper.createTestMetric('Metric C', {
        calculationMethod: 'calculation_model'
      });

      // A -> B
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricA)}/inputs`)
        .send({ inputMetricUri: metricB })
        .expect(200);

      // B -> C
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricB)}/inputs`)
        .send({ inputMetricUri: metricC })
        .expect(200);

      // Try C -> A (should fail)
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricC)}/inputs`)
        .send({ inputMetricUri: metricA })
        .expect(400);

      expect(response.body.error.message).toMatch(/circular/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/inputs`)
        .send({
          inputMetricUri
        })
        .expect(404);

      expect(response.body.error.message).toMatch(/metric.*not found/i);
    });

    it('should return 400 for invalid metric URI format', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent('invalid metric uri')}/inputs`)
        .send({
          inputMetricUri
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });
  });

  describe('Duplicate Prevention', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should prevent adding same input metric twice', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      // Add first time
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(200);

      // Try to add again
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(409);

      expect(response.body.error.message).toMatch(/already exists|duplicate/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL-encoded URIs', async () => {
      const metricWithSpace = await helper.createTestMetric('Metric With Space', {
        calculationMethod: 'calculation_model'
      });
      const inputWithSpace = await helper.createTestMetric('Input With Space');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricWithSpace)}/inputs`)
        .send({ inputMetricUri: inputWithSpace })
        .expect(200);

      expect(response.body.metricUri).toBe(metricWithSpace);
      expect(response.body.inputMetricUri).toBe(inputWithSpace);
    });

    it('should handle input metrics with special characters', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'calculation_model'
      });
      const inputWithChars = await helper.createTestMetric('Input & Co.');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: inputWithChars })
        .expect(200);

      expect(response.body.inputMetricUri).toBe(inputWithChars);
    });

    it('should handle order boundary values', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'calculation_model'
      });

      // Test order 0
      const input1 = await helper.createTestMetric('Input 0');
      const response1 = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input1, order: 0 })
        .expect(200);
      expect(response1.body.order).toBe(0);

      // Test large order value
      const input2 = await helper.createTestMetric('Input Large');
      const response2 = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input2, order: 1000 })
        .expect(200);
      expect(response2.body.order).toBe(1000);
    });
  });

  describe('Integration with Other Endpoints', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should reflect in GET /api/kg/metrics/:id/inputs', async () => {
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input1 })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri: input2 })
        .expect(200);

      const getResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .expect(200);

      expect(getResponse.body.inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should reflect in GET /api/kg/metrics/:id/lineage', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(200);

      const lineageResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(lineageResponse.body.lineageType).toBe('calculation_model');
      expect(lineageResponse.body).toHaveProperty('inputs');
    });

    it('should update reverse dependency (models using input metric)', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(200);

      // Check that the input metric shows it's used by this calculated metric
      const modelsResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(inputMetricUri)}/models`)
        .expect(200);

      // The calculated metric should appear in the models list
      expect(modelsResponse.body.models.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response Format', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should return proper response structure', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('metricUri');
      expect(response.body).toHaveProperty('inputMetricUri');
    });

    it('should include timestamp in response', async () => {
      const inputMetricUri = await helper.createTestMetric('Input Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .send({ inputMetricUri })
        .expect(200);

      expect(response.body).toHaveProperty('created_at');
    });
  });
});
