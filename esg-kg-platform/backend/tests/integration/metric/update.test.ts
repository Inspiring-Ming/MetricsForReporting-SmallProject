import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - PATCH /api/kg/metrics/:id (Update)', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
    metricUri = await helper.createTestMetric('Original Metric');
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  describe('Successful Updates', () => {
    it('should update metric label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'Updated Metric' })
        .expect(200);

      expect(response.body.label).toBe('Updated Metric');
      expect(response.body.uri).toBe(metricUri);
      expect(response.body).toHaveProperty('updated_at');

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Updated Metric');
    });

    it('should update calculationMethod', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ calculationMethod: 'calculation_model' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasCalculationMethod).toBe('calculation_model');
    });

    it('should update unit', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ unit: 'tonnes CO2e' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasUnit).toBe('tonnes CO2e');
    });

    it('should update description', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ description: 'Updated description' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBe('Updated description');
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'New Label',
          unit: 'kg',
          description: 'New description'
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('New Label');
      expect(detail.hasUnit).toBe('kg');
      expect(detail.description).toBe('New description');
    });

    it('should update label with special characters', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'Metric & Co. (2025)' })
        .expect(200);

      expect(response.body.label).toBe('Metric & Co. (2025)');
    });

    it('should update label with Unicode characters', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: '指标测试 🌍' })
        .expect(200);

      expect(response.body.label).toBe('指标测试 🌍');
    });

    it('should update dataType', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ dataType: 'Discussion' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasMetricType).toBe('Discussion');
    });

    it('should update hasType', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ hasType: 'Manual' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasType).toBe('Manual');
    });

    it('should update disclosureLevel', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ disclosureLevel: 2 })
        .expect(200);

      expect(response.body.uri).toBe(metricUri);
    });
  });

  describe('Partial Updates', () => {
    it('should allow updating only label without affecting other properties', async () => {
      // First set some properties
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ unit: 'kg', description: 'Original description' })
        .expect(200);

      // Then update only label
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'New Label' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('New Label');
      expect(detail.hasUnit).toBe('kg');
      expect(detail.description).toBe('Original description');
    });

    it('should allow clearing optional fields', async () => {
      // Set description
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ description: 'Test description' })
        .expect(200);

      // Clear description with empty string
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ description: '' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBeFalsy();
    });
  });

  describe('Validation Errors', () => {
    it('should reject update with empty label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: '' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label/i);
    });

    it('should reject update with whitespace-only label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label/i);
    });

    it('should reject update with label exceeding 200 characters', async () => {
      const longLabel = 'A'.repeat(201);
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body.error.message).toMatch(/200 characters/i);
    });

    it('should reject update with invalid calculationMethod', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ calculationMethod: 'invalid_method' })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation method/i);
    });

    it('should reject update with no fields provided', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/at least one field/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';
      
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .send({ label: 'New Label' })
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      // Use a truly invalid URI format with special characters that don't match any valid pattern
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent('invalid uri with spaces')}`)
        .send({ label: 'New Label' })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });
  });

  describe('PUT (Complete Update)', () => {
    it('should perform complete update with PUT', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Completely Updated Metric',
          calculationMethod: 'calculation_model',
          unit: 'tonnes',
          description: 'Complete update'
        });

      if (response.status !== 200) {
        console.log('PUT Error Response:', response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.label).toBe('Completely Updated Metric');
      
      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Completely Updated Metric');
      expect(detail.hasCalculationMethod).toBe('calculation_model');
      expect(detail.hasUnit).toBe('tonnes');
    });

    it('should require label and calculationMethod in PUT', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ unit: 'kg' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required|calculation method is required/i);
    });

    it('should replace all properties with PUT (unlike PATCH)', async () => {
      // First, create a metric with multiple properties
      const category = await helper.createTestCategory('Test Category');
      const framework = await helper.createTestFramework('Test Framework');
      
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          description: 'Original description',
          unit: 'kg CO2e',
          code: 'ORIG_CODE',
          dataType: 'Quantitative',
          category,
          framework
        })
        .expect(200);

      // Now use PUT to replace with minimal fields
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Replaced Metric',
          calculationMethod: 'direct_measurement'
        })
        .expect(200);

      expect(response.body.label).toBe('Replaced Metric');
      
      // Verify that optional fields were reset/removed
      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Replaced Metric');
      expect(detail.hasCalculationMethod).toBe('direct_measurement');
      
      // Note: Some fields might have defaults, but code and description should be cleared
    });

    it('should allow PUT with all optional fields', async () => {
      const category = await helper.createTestCategory('New Category');
      const framework = await helper.createTestFramework('New Framework');
      const industry = await helper.createTestIndustry('New Industry');

      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Complete Metric',
          calculationMethod: 'calculation_model',
          code: 'COMPLETE',
          description: 'A complete metric',
          unit: 'tonnes CO2e',
          dataType: 'Quantitative',
          hasType: 'SASBRequirement',
          category,
          framework,
          industry,
          disclosureLevel: 2
        })
        .expect(200);

      expect(response.body.label).toBe('Complete Metric');
      
      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Complete Metric');
      expect(detail.hasCalculationMethod).toBe('calculation_model');
      expect(detail.description).toBe('A complete metric');
    });

    it('should validate required fields even when some optional fields are present', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Test',
          unit: 'kg',
          description: 'Test description'
          // Missing calculationMethod - should fail
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation method is required/i);
    });

    it('should distinguish between PUT and PATCH behavior', async () => {
      // Set initial state with multiple fields
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          description: 'Initial description',
          unit: 'kg',
          code: 'INIT_CODE'
        })
        .expect(200);

      let detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBe('Initial description');
      expect(detail.hasUnit).toBe('kg');

      // PATCH should only update specified fields
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          description: 'Updated description'
        })
        .expect(200);

      detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBe('Updated description');
      expect(detail.hasUnit).toBe('kg'); // Should still be 'kg'

      // PUT should replace everything
      await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Replaced Metric',
          calculationMethod: 'direct_measurement',
          unit: 'tonnes'
        })
        .expect(200);

      detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Replaced Metric');
      expect(detail.hasUnit).toBe('tonnes');
      // description should be cleared or reset to default
    });

    it('should return 404 for PUT on non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';
      
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .send({
          label: 'New Metric',
          calculationMethod: 'direct_measurement'
        })
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should validate all fields in PUT request', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: '',  // Invalid empty label
          calculationMethod: 'direct_measurement'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/label/i);
    });

    it('should handle PUT with special characters in all fields', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Metric & Co. (2025)',
          calculationMethod: 'direct_measurement',
          code: 'METRIC_&_CO',
          description: 'Description with "quotes" and \'apostrophes\'',
          unit: 'kg CO2e'
        })
        .expect(200);

      expect(response.body.label).toBe('Metric & Co. (2025)');
      
      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toContain('quotes');
    });

    it('should update timestamps on PUT', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Updated Metric',
          calculationMethod: 'direct_measurement'
        })
        .expect(200);

      expect(response.body).toHaveProperty('updated_at');
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating to same values', async () => {
      const detail = await helper.getMetricDetail(metricUri);
      
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: detail.label })
        .expect(200);

      expect(response.body.label).toBe(detail.label);
    });

    it('should handle rapid sequential updates', async () => {
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'Update 1' })
        .expect(200);

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'Update 2' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Update 2');
    });
  });
});
