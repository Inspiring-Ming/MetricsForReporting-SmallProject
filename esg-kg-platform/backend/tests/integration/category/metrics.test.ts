import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - Metrics Association Management', () => {
  let categoryUri: string;

  beforeEach(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
    categoryUri = await helper.createTestCategory('Test Category');
  });

  afterAll(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  describe('GET /:id/metrics - Get Category Metrics', () => {
    it('should return empty array when category has no metrics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .expect(200);

      expect(response.body.result).toEqual([]);
    });

    it('should return all metrics of category', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      await helper.addMetricsToCategory(categoryUri, [metric1, metric2]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      response.body.result.forEach((metric: any) => {
        expect(metric).toHaveProperty('iri');
        expect(metric).toHaveProperty('label');
        expect(metric).toHaveProperty('hasCalculationMethod');
      });
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/invalid-iri/metrics`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('POST /:id/metrics - Add Metrics to Category', () => {
    it('should add single metric to category', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric] })
        .expect(200);

      expect(response.body.category_iri).toBe(categoryUri);
      expect(response.body.added_metrics).toHaveLength(1);
      expect(response.body).toHaveProperty('added_at');

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toContain(metric);
    });

    it('should add multiple metrics to category', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const metric3 = await helper.createTestMetric('Metric 3');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric1, metric2, metric3] })
        .expect(200);

      expect(response.body.added_metrics).toHaveLength(3);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toHaveLength(3);
    });

    it('should not duplicate existing metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      await helper.addMetricsToCategory(categoryUri, [metric1]);

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric1, metric2] })
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toHaveLength(2);
    });

    it('should reject adding metrics without metrics array', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/at least one metric.*required/i);
    });

    it('should reject adding empty metrics array', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [] })
        .expect(400);

      expect(response.body.error.message).toMatch(/at least one metric.*required/i);
    });

    it('should reject adding invalid metric URI', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: ['invalid-iri'] })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject adding non-existent metric', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: ['http://example.org/esg#NonExistentMetric'] })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject adding metrics to non-existent category', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics`)
        .send({ metrics: [metric] })
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should handle adding many metrics at once', async () => {
      const metrics = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          helper.createTestMetric(`Metric ${i + 1}`)
        )
      );

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics })
        .expect(200);

      expect(response.body.added_metrics).toHaveLength(20);
    });
  });

  describe('DELETE /:id/metrics/:mid - Remove Metric from Category', () => {
    let metric1: string;
    let metric2: string;

    beforeEach(async () => {
      metric1 = await helper.createTestMetric('Metric 1');
      metric2 = await helper.createTestMetric('Metric 2');
      await helper.addMetricsToCategory(categoryUri, [metric1, metric2]);
    });

    it('should remove metric from category', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric1)}`)
        .expect(200);

      expect(response.body.category_iri).toBe(categoryUri);
      expect(response.body.removed_metric_iri).toBe(metric1);
      expect(response.body).toHaveProperty('removed_at');

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).not.toContain(metric1);
      expect(categoryMetrics).toContain(metric2);
    });

    it('should remove last metric from category', async () => {
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric1)}`)
        .expect(200);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric2)}`)
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toHaveLength(0);
    });

    it('should return 404 for non-existent metric association', async () => {
      const nonAssociatedMetric = await helper.createTestMetric('Non Associated');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(nonAssociatedMetric)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/metrics/${encodeURIComponent(metric1)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid category URI', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/invalid-iri/metrics/${encodeURIComponent(metric1)}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should return 400 for invalid metric URI', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/invalid-iri`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should not affect metric existence after removal', async () => {
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric1)}`)
        .expect(200);

      const metricStillExists = await helper.metricExists(metric1);
      expect(metricStillExists).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should add and remove metrics in sequence', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const metric3 = await helper.createTestMetric('Metric 3');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric1, metric2] })
        .expect(200);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric1)}`)
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric3] })
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toContain(metric2);
      expect(categoryMetrics).toContain(metric3);
      expect(categoryMetrics).not.toContain(metric1);
    });

    it('should handle removing already removed metric', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      await helper.addMetricsToCategory(categoryUri, [metric]);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric)}`)
        .expect(200);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics/${encodeURIComponent(metric)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should handle concurrent metric additions', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      const metric3 = await helper.createTestMetric('Metric 3');

      await Promise.all([
        request(app)
          .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
          .send({ metrics: [metric1] }),
        request(app)
          .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
          .send({ metrics: [metric2] }),
        request(app)
          .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
          .send({ metrics: [metric3] })
      ]);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle metric with special characters in URI', async () => {
      const metric = await helper.createTestMetric('Metric & Co.');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric] })
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toContain(metric);
    });

    it('should handle adding duplicate metrics in same request', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(categoryUri)}/metrics`)
        .send({ metrics: [metric, metric, metric] })
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(categoryUri);
      expect(categoryMetrics).toHaveLength(1);
    });
  });
});
