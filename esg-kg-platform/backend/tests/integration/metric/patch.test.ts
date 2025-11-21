import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - PATCH /api/kg/metrics/:id (Partial Update)', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
  });

  describe('Successful Partial Updates', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Original Metric', {
        description: 'Original description',
        unit: 'kg',
        code: 'ORIG_001',
        calculationMethod: 'direct_measurement'
      });
    });

    it('should update only label field', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Updated Label'
        })
        .expect(200);

      expect(response.body).toHaveProperty('iri', metricUri);
      expect(response.body).toHaveProperty('label', 'Updated Label');
      expect(response.body).toHaveProperty('updated_at');

      // Verify other fields remain unchanged
      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBe('Original description');
      expect(detail.hasUnit).toBe('kg');
      expect(detail.hasCalculationMethod).toBe('direct_measurement');
    });

    it('should update only description field', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body).toHaveProperty('iri', metricUri);
      expect(response.body).toHaveProperty('updated_at');

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBe('Updated description');
      expect(detail.label).toBe('Original Metric');
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'New Label',
          description: 'New description',
          unit: 'tonnes'
        })
        .expect(200);

      expect(response.body).toHaveProperty('iri', metricUri);
      expect(response.body).toHaveProperty('label', 'New Label');

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('New Label');
      expect(detail.description).toBe('New description');
      expect(detail.hasUnit).toBe('tonnes');
      expect(detail.hasCalculationMethod).toBe('direct_measurement'); // Unchanged
    });

    it('should update calculation method', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          calculationMethod: 'calculation_model'
        })
        .expect(200);

      expect(response.body).toHaveProperty('calculationMethod', 'calculation_model');

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasCalculationMethod).toBe('calculation_model');
    });

    it('should update dataType field', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          dataType: 'Quantitative'
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.hasMetricType).toBe('Quantitative');
    });

    it('should handle null/undefined values (clearing fields)', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          description: null,
          unit: null
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.description).toBeUndefined();
      expect(detail.hasUnit).toBeUndefined();
      expect(detail.label).toBe('Original Metric'); // Unchanged
    });
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric');
    });

    it('should reject empty request body', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/at least one field/i);
    });

    it('should reject empty label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: ''
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/label.*empty/i);
    });

    it('should reject whitespace-only label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: '   '
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/label.*empty|whitespace/i);
    });

    it('should reject label exceeding 200 characters', async () => {
      const longLabel = 'a'.repeat(201);

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: longLabel
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/label.*200/i);
    });

    it('should reject invalid calculation method', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          calculationMethod: 'invalid_method'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/calculation method.*direct_measurement.*calculation_model/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .send({
          label: 'New Label'
        })
        .expect(404);

      expect(response.body.error.message).toMatch(/metric.*not found/i);
    });

    it('should return 400 for invalid metric URI format', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent('invalid iri')}`)
        .send({
          label: 'New Label'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        description: 'Original',
        unit: 'kg'
      });
    });

    it('should handle URL-encoded metric URI', async () => {
      const metricWithSpace = await helper.createTestMetric('Metric With Space');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricWithSpace)}`)
        .send({
          label: 'Updated Label'
        })
        .expect(200);

      expect(response.body.iri).toBe(metricWithSpace);
    });

    it('should handle rapid successive patches', async () => {
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ label: 'First Update' })
        .expect(200);

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ description: 'Second Update' })
        .expect(200);

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({ unit: 'tonnes' })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('First Update');
      expect(detail.description).toBe('Second Update');
      expect(detail.hasUnit).toBe('tonnes');
    });

    it('should preserve other properties when patching label', async () => {
      const metricWithProps = await helper.createTestMetric('Rich Metric', {
        description: 'Test description',
        unit: 'kg',
        calculationMethod: 'direct_measurement'
      });

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricWithProps)}`)
        .send({
          label: 'Updated Label'
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricWithProps);
      expect(detail.label).toBe('Updated Label');
      expect(detail.description).toBe('Test description');
      expect(detail.hasUnit).toBe('kg');
      expect(detail.hasCalculationMethod).toBe('direct_measurement');
    });

    it('should handle special characters in updated fields', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Metric & Co. (2024)',
          description: 'Description with "quotes" and <tags>'
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('Metric & Co. (2024)');
      expect(detail.description).toBe('Description with "quotes" and <tags>');
    });
  });

  describe('Integration with Other Endpoints', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Original Metric', {
        description: 'Original description'
      });
    });

    it('should be reflected in GET /api/kg/metrics/:id', async () => {
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Patched Label',
          unit: 'tonnes'
        })
        .expect(200);

      const getResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      expect(getResponse.body.result.label).toBe('Patched Label');
      expect(getResponse.body.result.hasUnit).toBe('tonnes');
    });

    it('should be reflected in subsequent GET by ID', async () => {
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Updated via PATCH'
        })
        .expect(200);

      // Verify change persisted by fetching again
      const getResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      expect(getResponse.body.result.label).toBe('Updated via PATCH');
    });
  });

  describe('Response Format', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric');
    });

    it('should return proper response structure', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'Updated Label'
        })
        .expect(200);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('updated_at');
      expect(typeof response.body.updated_at).toBe('string');
      expect(new Date(response.body.updated_at).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Comparison with PUT', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        description: 'Original description',
        unit: 'kg',
        calculationMethod: 'direct_measurement'
      });
    });

    it('should preserve unspecified fields (unlike PUT)', async () => {
      // PATCH only updates specified fields
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .send({
          label: 'New Label'
        })
        .expect(200);

      const detail = await helper.getMetricDetail(metricUri);
      expect(detail.label).toBe('New Label');
      expect(detail.description).toBe('Original description'); // Preserved
      expect(detail.hasUnit).toBe('kg'); // Preserved
      expect(detail.hasCalculationMethod).toBe('direct_measurement'); // Preserved
    });
  });
});
