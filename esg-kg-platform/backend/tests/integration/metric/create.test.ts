import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - POST /api/kg/metrics (Create)', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  describe('Normal Creation', () => {
    it('should create metric with minimal fields (label and calculationMethod)', async () => {
      const newMetric = {
        label: 'Test Metric',
        calculationMethod: 'direct_measurement' as const
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body).toHaveProperty('uri');
      expect(response.body).toHaveProperty('label', newMetric.label);
      expect(response.body).toHaveProperty('calculationMethod', newMetric.calculationMethod);
      expect(response.body).toHaveProperty('created_at');

      const exists = await helper.metricExists(response.body.uri);
      expect(exists).toBe(true);
    });

    it('should create metric with all fields', async () => {
      const category = await helper.createTestCategory('Test Category');
      const framework = await helper.createTestFramework('Test Framework');
      const industry = await helper.createTestIndustry('Test Industry');

      const newMetric = {
        label: 'Complete Metric',
        code: 'COMPLETE_METRIC',
        description: 'This is a complete test metric',
        unit: 'kg CO2e',
        dataType: 'Quantitative' as const,
        calculationMethod: 'direct_measurement' as const,
        hasType: 'SASBRequirement' as const,
        category,
        framework,
        industry,
        disclosureLevel: 1,
        additionalProperties: {
          customField: 'customValue'
        }
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body).toHaveProperty('uri');
      expect(response.body).toHaveProperty('label', newMetric.label);
      expect(response.body).toHaveProperty('code', newMetric.code);

      const exists = await helper.metricExists(response.body.uri);
      expect(exists).toBe(true);
    });

    it('should create calculation_model metric', async () => {
      const newMetric = {
        label: 'Calculated Metric',
        calculationMethod: 'calculation_model' as const,
        unit: 'tonnes'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body.calculationMethod).toBe('calculation_model');
    });

    it('should create metric with special characters in label', async () => {
      const newMetric = {
        label: 'Metric & Co. (2025) - Test',
        calculationMethod: 'direct_measurement' as const
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body.label).toBe(newMetric.label);
      const detail = await helper.getMetricDetail(response.body.uri);
      expect(detail.label).toBe(newMetric.label);
    });

    it('should create metric with Unicode characters', async () => {
      const newMetric = {
        label: '指标测试 🌍',
        calculationMethod: 'direct_measurement' as const
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body.label).toBe(newMetric.label);
    });

    it('should create metric with long label (200 characters)', async () => {
      const longLabel = 'A'.repeat(200);
      const newMetric = {
        label: longLabel,
        calculationMethod: 'direct_measurement' as const
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body.label).toBe(longLabel);
    });

    it('should create multiple metrics with different labels', async () => {
      const metric1 = { label: 'Metric One', calculationMethod: 'direct_measurement' as const };
      const metric2 = { label: 'Metric Two', calculationMethod: 'calculation_model' as const };
      const metric3 = { label: 'Metric Three', calculationMethod: 'direct_measurement' as const };

      await request(app).post(baseUrl).send(metric1).expect(201);
      await request(app).post(baseUrl).send(metric2).expect(201);
      await request(app).post(baseUrl).send(metric3).expect(201);

      const count = await helper.getMetricCount();
      expect(count).toBe(3);
    });

    it('should create metric with code as unique identifier', async () => {
      const newMetric = {
        label: 'Test Metric',
        code: 'TEST_METRIC_001',
        calculationMethod: 'direct_measurement' as const
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newMetric)
        .expect(201);

      expect(response.body.uri).toContain('TEST_METRIC_001');
    });
  });

  describe('Validation Errors', () => {
    it('should reject creation without label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ calculationMethod: 'direct_measurement' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation with empty label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '', calculationMethod: 'direct_measurement' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation with whitespace-only label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '   ', calculationMethod: 'direct_measurement' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation without calculationMethod', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Metric' })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation method is required/i);
    });

    it('should reject creation with invalid calculationMethod', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Test Metric', 
          calculationMethod: 'invalid_method' 
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation method/i);
    });

    it('should reject creation with label exceeding 200 characters', async () => {
      const longLabel = 'A'.repeat(201);
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: longLabel, 
          calculationMethod: 'direct_measurement' 
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/must not exceed 200 characters/i);
    });

    it('should reject creation with invalid category URI format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Metric',
          calculationMethod: 'direct_measurement',
          category: 'invalid uri with spaces'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*category.*uri/i);
    });

    it('should reject creation with invalid industry URI format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Metric',
          calculationMethod: 'direct_measurement',
          industry: 'invalid uri with spaces'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*industry.*uri/i);
    });

    it('should reject creation with invalid framework URI format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Metric',
          calculationMethod: 'direct_measurement',
          framework: 'invalid uri with spaces'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*framework.*uri/i);
    });
  });

  describe('Duplicate Detection', () => {
    it('should reject creation with duplicate label', async () => {
      const metricData = {
        label: 'Duplicate Metric',
        calculationMethod: 'direct_measurement' as const
      };

      await request(app).post(baseUrl).send(metricData).expect(201);

      const response = await request(app)
        .post(baseUrl)
        .send(metricData)
        .expect(400);

      expect(response.body.error.message).toMatch(/already exists/i);
    });
  });

  describe('Association Creation', () => {
    it('should create metric associated with category', async () => {
      const category = await helper.createTestCategory('Test Category');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Associated Metric',
          calculationMethod: 'direct_measurement',
          category
        })
        .expect(201);

      const categoryMetrics = await helper.getCategoryMetrics(category);
      expect(categoryMetrics).toContain(response.body.uri);
    });

    it('should create metric with full hierarchy (industry > framework > category)', async () => {
      const industry = await helper.createTestIndustry('Test Industry');
      const framework = await helper.createTestFramework('Test Framework');
      const category = await helper.createTestCategory('Test Category');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Hierarchical Metric',
          calculationMethod: 'direct_measurement',
          industry,
          framework,
          category
        })
        .expect(201);

      expect(response.body.uri).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle creation with null additionalProperties', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Metric With Null Props',
          calculationMethod: 'direct_measurement',
          additionalProperties: null
        })
        .expect(201);

      expect(response.body.uri).toBeDefined();
    });

    it('should handle creation with empty additionalProperties', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Metric With Empty Props',
          calculationMethod: 'direct_measurement',
          additionalProperties: {}
        })
        .expect(201);

      expect(response.body.uri).toBeDefined();
    });

    it('should handle creation with disclosureLevel boundaries', async () => {
      // Test level 1
      const response1 = await request(app)
        .post(baseUrl)
        .send({
          label: 'Metric Level 1',
          calculationMethod: 'direct_measurement',
          disclosureLevel: 1
        })
        .expect(201);
      expect(response1.body.uri).toBeDefined();

      // Test level 3
      const response3 = await request(app)
        .post(baseUrl)
        .send({
          label: 'Metric Level 3',
          calculationMethod: 'direct_measurement',
          disclosureLevel: 3
        })
        .expect(201);
      expect(response3.body.uri).toBeDefined();
    });
  });
});
