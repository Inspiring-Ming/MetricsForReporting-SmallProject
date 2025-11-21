import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - PATCH /api/kg/categories/:id (Update)', () => {
  let categoryUri: string;

  beforeEach(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
    categoryUri = await helper.createTestCategory('Original Category');
  });

  afterAll(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  describe('Successful Updates', () => {
    it('should update category label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Updated Category' })
        .expect(200);

      expect(response.body.label).toBe('Updated Category');
      expect(response.body.iri).toBe(categoryUri);
      expect(response.body).toHaveProperty('updated_at');

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.label).toBe('Updated Category');
    });

    it('should update metrics association', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: [metric1, metric2] })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.metrics).toHaveLength(2);
    });

    it('should update both label and metrics', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({
          label: 'New Label',
          metrics: [metric]
        })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.label).toBe('New Label');
      expect(detail.metrics).toHaveLength(1);
    });

    it('should clear metrics by setting empty array', async () => {
      const metric = await helper.createTestMetric('Metric');
      await helper.addMetricsToCategory(categoryUri, [metric]);

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: [] })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.metrics).toEqual([]);
    });

    it('should update label to special characters', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Category & Co. (2025)' })
        .expect(200);

      expect(response.body.label).toBe('Category & Co. (2025)');
    });

    it('should update label to Unicode', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: '分类测试 🌍' })
        .expect(200);

      expect(response.body.label).toBe('分类测试 🌍');
    });
  });

  describe('Partial Updates', () => {
    it('should allow updating only label without affecting metrics', async () => {
      const metric = await helper.createTestMetric('Existing Metric');
      await helper.addMetricsToCategory(categoryUri, [metric]);

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'New Label' })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.label).toBe('New Label');
      expect(detail.metrics).toHaveLength(1);
    });

    it('should allow updating only metrics without affecting label', async () => {
      const metric = await helper.createTestMetric('New Metric');

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: [metric] })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.label).toBe('Original Category');
      expect(detail.metrics).toHaveLength(1);
    });
  });

  describe('Validation Errors', () => {
    it('should reject update with empty label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: '' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label cannot be empty/i);
    });

    it('should reject update with whitespace-only label', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label cannot be empty/i);
    });

    it('should reject update with label exceeding 200 characters', async () => {
      const longLabel = 'A'.repeat(201);
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body.error.message).toMatch(/must not exceed 200 characters/i);
    });

    it('should reject update with invalid metric URI', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: ['invalid-iri'] })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject update with non-existent metric', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: ['http://example.org/esg#NonExistentMetric'] })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/at least one field must be provided/i);
    });
  });

  describe('Uniqueness Constraints', () => {
    it('should reject update to duplicate label', async () => {
      await helper.createTestCategory('Existing Category');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Existing Category' })
        .expect(409);

      expect(response.body.error.message).toMatch(/already exists/i);
    });

    it('should allow update to same label (no change)', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Original Category' })
        .expect(200);

      expect(response.body.label).toBe('Original Category');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent category', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .send({ label: 'New Label' })
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid category URI', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/invalid-iri`)
        .send({ label: 'New Label' })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('Complex Updates', () => {
    it('should replace metrics completely', async () => {
      const oldMetric = await helper.createTestMetric('Old Metric');
      const newMetric1 = await helper.createTestMetric('New Metric 1');
      const newMetric2 = await helper.createTestMetric('New Metric 2');

      await helper.addMetricsToCategory(categoryUri, [oldMetric]);

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: [newMetric1, newMetric2] })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      const metricIris = detail.metrics.map((m: any) => m.iri);
      expect(metricIris).not.toContain(oldMetric);
      expect(metricIris).toContain(newMetric1);
      expect(metricIris).toContain(newMetric2);
    });

    it('should handle updating with many metrics', async () => {
      const metrics = await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          helper.createTestMetric(`Metric ${i + 1}`)
        )
      );

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.metrics).toHaveLength(15);
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate metrics in update array', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ metrics: [metric, metric, metric] })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.metrics).toHaveLength(1);
    });

    it('should handle label with line breaks', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Category\nWith\nLine Breaks' })
        .expect(200);

      expect(response.body.label).toBe('Category\nWith\nLine Breaks');
    });

    it('should handle rapid successive updates', async () => {
      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Update 1' })
        .expect(200);

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .send({ label: 'Update 2' })
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail.label).toBe('Update 2');
    });
  });
});
