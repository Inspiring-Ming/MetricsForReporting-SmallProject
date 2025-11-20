import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - GET /api/kg/categories/:id (Detail)', () => {
  let categoryUri: string;

  beforeEach(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
    await helper.cleanFrameworks();
    categoryUri = await helper.createTestCategory('Test Category');
  });

  afterAll(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
    await helper.cleanFrameworks();
  });

  describe('Successful Retrieval', () => {
    it('should get category detail by URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri', categoryUri);
      expect(response.body.result).toHaveProperty('label', 'Test Category');
    });

    it('should include associated metrics', async () => {
      const metric1 = await helper.createTestMetric('Metric 1');
      const metric2 = await helper.createTestMetric('Metric 2');
      await helper.addMetricsToCategory(categoryUri, [metric1, metric2]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.metrics).toHaveLength(2);
      const metricIris = response.body.result.metrics.map((m: any) => m.iri);
      expect(metricIris).toContain(metric1);
      expect(metricIris).toContain(metric2);
    });

    it('should include frameworks using this category (reverse relationship)', async () => {
      const framework1 = await helper.createTestFramework('Framework 1');
      const framework2 = await helper.createTestFramework('Framework 2');
      await helper.addCategoriesToFramework(framework1, [categoryUri]);
      await helper.addCategoriesToFramework(framework2, [categoryUri]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.frameworks).toHaveLength(2);
      const frameworkIris = response.body.result.frameworks.map((f: any) => f.iri);
      expect(frameworkIris).toContain(framework1);
      expect(frameworkIris).toContain(framework2);
    });

    it('should return category with no metrics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.metrics).toBeUndefined();
    });

    it('should return category with no frameworks', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.frameworks).toBeUndefined();
    });
  });

  describe('URI Format Handling', () => {
    it('should handle URL-encoded URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.iri).toBe(categoryUri);
    });

    it('should handle double-encoded URI', async () => {
      const doubleEncoded = encodeURIComponent(encodeURIComponent(categoryUri));
      const response = await request(app)
        .get(`${baseUrl}/${doubleEncoded}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });

    it('should handle URI with special characters', async () => {
      const specialCategory = await helper.createTestCategory('Category & Co.');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(specialCategory)}`)
        .expect(200);

      expect(response.body.result.label).toBe('Category & Co.');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent category', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentCategory';
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/invalid-uri`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });

    it('should return 400 for whitespace-only URI', async () => {
      // URL 编码的空格
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('   ')}`)
        .expect(400);
        
      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });

    it('should return 400 for malformed URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('not a uri')}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*uri/i);
    });
  });

  describe('Complex Relationships', () => {
    it('should show category with many metrics', async () => {
      const metrics = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          helper.createTestMetric(`Metric ${i + 1}`)
        )
      );
      await helper.addMetricsToCategory(categoryUri, metrics);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.metrics).toHaveLength(10);
    });

    it('should show category used by many frameworks', async () => {
      const frameworks = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          helper.createTestFramework(`Framework ${i + 1}`)
        )
      );
      
      for (const framework of frameworks) {
        await helper.addCategoriesToFramework(framework, [categoryUri]);
      }

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.frameworks).toHaveLength(5);
    });

    it('should show all relationships simultaneously', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addMetricsToCategory(categoryUri, [metric]);
      await helper.addCategoriesToFramework(framework, [categoryUri]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.result.metrics).toHaveLength(1);
      expect(response.body.result.frameworks).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle category with Unicode label', async () => {
      const unicodeCategory = await helper.createTestCategory('分类 🌍');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(unicodeCategory)}`)
        .expect(200);

      expect(response.body.result.label).toBe('分类 🌍');
    });

    it('should handle very long category URI', async () => {
      const longLabel = 'A'.repeat(100);
      const longCategory = await helper.createTestCategory(longLabel);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(longCategory)}`)
        .expect(200);

      expect(response.body.result.label).toBe(longLabel);
    });
  });
});
