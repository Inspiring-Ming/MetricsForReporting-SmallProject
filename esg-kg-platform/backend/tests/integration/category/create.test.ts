import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - POST /api/kg/categories (Create)', () => {
  beforeEach(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  afterAll(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  describe('Normal Creation', () => {
    it('should create category with minimal fields (label only)', async () => {
      const newCategory = {
        label: 'Test Category'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', newCategory.label);
      expect(response.body).toHaveProperty('created_at');

      const exists = await helper.categoryExists(response.body.iri);
      expect(exists).toBe(true);
    });

    it('should create category with all fields', async () => {
      const metric1 = await helper.createTestMetric('Test Metric 1');
      const metric2 = await helper.createTestMetric('Test Metric 2');

      const newCategory = {
        label: 'Complete Category',
        metrics: [metric1, metric2]
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', newCategory.label);

      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.metrics).toHaveLength(2);
      expect(detail.metrics.map((m: any) => m.iri)).toContain(metric1);
      expect(detail.metrics.map((m: any) => m.iri)).toContain(metric2);
    });

    it('should create category with special characters in label', async () => {
      const newCategory = {
        label: 'Category with Special-Characters_Test'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body.label).toBe(newCategory.label);
      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.label).toBe(newCategory.label);
    });

    it('should create category with long label (200 characters)', async () => {
      const longLabel = 'A'.repeat(200);
      const newCategory = {
        label: longLabel
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body.label).toBe(longLabel);
    });

    it('should create multiple categories with different labels', async () => {
      const category1 = { label: 'Category One' };
      const category2 = { label: 'Category Two' };
      const category3 = { label: 'Category Three' };

      await request(app).post(baseUrl).send(category1).expect(201);
      await request(app).post(baseUrl).send(category2).expect(201);
      await request(app).post(baseUrl).send(category3).expect(201);

      const count = await helper.getCategoryCount();
      expect(count).toBe(3);
    });
  });

  describe('Validation Errors', () => {
    it('should reject creation without label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation with empty label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation with whitespace-only label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body.error.message).toMatch(/label is required/i);
    });

    it('should reject creation with label exceeding 200 characters', async () => {
      const longLabel = 'A'.repeat(201);
      const response = await request(app)
        .post(baseUrl)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body.error.message).toMatch(/must not exceed 200 characters/i);
    });

    it('should reject creation with invalid metric URI format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Category',
          metrics: ['invalid-iri']
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject creation with non-existent metric URI', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Category',
          metrics: ['http://example.org/esg#NonExistentMetric']
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });

    it('should reject creation with mixed valid and invalid metric URIs', async () => {
      const validMetric = await helper.createTestMetric('Valid Metric');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Category',
          metrics: [validMetric, 'http://example.org/esg#InvalidMetric']
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid metric iri/i);
    });
  });

  describe('Uniqueness Constraints', () => {
    it('should reject creation with duplicate label', async () => {
      const category = { label: 'Duplicate Category' };

      await request(app).post(baseUrl).send(category).expect(201);

      const response = await request(app)
        .post(baseUrl)
        .send(category)
        .expect(409);

      expect(response.body.error.message).toMatch(/already exists/i);
    });

    it('should reject creation with case-sensitive duplicate label', async () => {
      await request(app)
        .post(baseUrl)
        .send({ label: 'Test Category' })
        .expect(201);

      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Category' })
        .expect(409);

      expect(response.body.error.message).toMatch(/already exists/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle creation with empty metrics array', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Category with Empty Metrics',
          metrics: []
        })
        .expect(201);

      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.metrics).toEqual([]);
    });

    it('should create category with numbers in label', async () => {
      const newCategory = {
        label: 'Category 2024 Version 2'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body.label).toBe(newCategory.label);
      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.label).toBe(newCategory.label);
    });

    it('should handle creation with duplicate metrics in array', async () => {
      const metric = await helper.createTestMetric('Test Metric');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Category',
          metrics: [metric, metric, metric]
        })
        .expect(201);

      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.metrics).toHaveLength(1);
    });

    it('should create category with many metrics', async () => {
      const metrics = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          helper.createTestMetric(`Metric ${i + 1}`)
        )
      );

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Category with Many Metrics',
          metrics
        })
        .expect(201);

      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.metrics).toHaveLength(10);
    });

    it('should handle label with leading/trailing whitespace', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '  Test Category  ' })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.label).toBeTruthy();
    });

    it('should handle label with line breaks', async () => {
      const newCategory = {
        label: 'Category with\nLine Breaks'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body.label).toBe(newCategory.label);
    });

    it('should handle label with multiple spaces', async () => {
      const newCategory = {
        label: 'Category   with   Multiple   Spaces'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newCategory)
        .expect(201);

      expect(response.body.label).toBe(newCategory.label);
      const detail = await helper.getCategoryDetail(response.body.iri);
      expect(detail.label).toBe(newCategory.label);
    });
  });

  describe('Concurrent Creation', () => {
    it('should handle concurrent category creations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post(baseUrl)
          .send({ label: `Concurrent Category ${i + 1}` })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('iri');
      });

      const count = await helper.getCategoryCount();
      expect(count).toBe(5);
    });
  });
});
