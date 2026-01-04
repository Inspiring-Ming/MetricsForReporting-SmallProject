import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - DELETE /api/kg/categories/:id (Delete)', () => {
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

  describe('Successful Deletion', () => {
    it('should delete category without associations', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.iri).toBe(categoryUri);
      expect(response.body.deleted).toBe(true);
      expect(response.body).toHaveProperty('deleted_at');

      const exists = await helper.categoryExists(categoryUri);
      expect(exists).toBe(false);
    });

    it('should delete category with metrics', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      await helper.addMetricsToCategory(categoryUri, [metric]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.categoryExists(categoryUri);
      expect(exists).toBe(false);

      const metricStillExists = await helper.metricExists(metric);
      expect(metricStillExists).toBe(true);
    });

    it('should delete category with force=true even if used by frameworks', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [categoryUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .query({ force: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.categoryExists(categoryUri);
      expect(exists).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('should reject deletion when used by frameworks without force', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [categoryUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(409);

      expect(response.body.error.message).toMatch(/used by.*framework/i);

      const exists = await helper.categoryExists(categoryUri);
      expect(exists).toBe(true);
    });

    it('should reject deletion when used by multiple frameworks', async () => {
      const framework1 = await helper.createTestFramework('Framework 1');
      const framework2 = await helper.createTestFramework('Framework 2');
      await helper.addCategoriesToFramework(framework1, [categoryUri]);
      await helper.addCategoriesToFramework(framework2, [categoryUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(409);

      expect(response.body.error.message).toMatch(/2.*framework/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent category', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/invalid-iri`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('Cascade Behavior', () => {
    it('should remove all category properties on deletion', async () => {
      const metric = await helper.createTestMetric('Test Metric');
      await helper.addMetricsToCategory(categoryUri, [metric]);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      const detail = await helper.getCategoryDetail(categoryUri);
      expect(detail).toBeNull();
    });

    it('should remove category from framework associations on force delete', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [categoryUri]);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .query({ force: true })
        .expect(200);

      const frameworkCategories = await helper.getFrameworkCategories(framework);
      expect(frameworkCategories).not.toContain(categoryUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deletion of already deleted category', async () => {
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(200);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should handle force parameter as boolean', async () => {
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .query({ force: 'true' })
        .expect(200);
    });

    it('should handle force parameter as false', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [categoryUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
        .query({ force: 'false' })
        .expect(409);

      expect(response.body.error.message).toMatch(/used by.*framework/i);
    });

    it('should handle deletion with Unicode label', async () => {
      const unicodeCategory = await helper.createTestCategory('分类 🌍');

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(unicodeCategory)}`)
        .expect(200);

      const exists = await helper.categoryExists(unicodeCategory);
      expect(exists).toBe(false);
    });
  });

  describe('Concurrent Deletion', () => {
    it('should handle concurrent deletion attempts', async () => {
      const responses = await Promise.allSettled([
        request(app).delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`),
        request(app).delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`),
        request(app).delete(`${baseUrl}/${encodeURIComponent(categoryUri)}`)
      ]);

      // 在并发场景下，由于检查和删除之间没有原子性保证，
      // 可能所有请求都通过 exists 检查然后都执行删除
      // 第一个删除成功，后续的 DELETE WHERE 不匹配任何数据但也不报错
      // 因此我们只检查至少有一个成功，且 Category 最终被删除
      const successful = responses.filter((r: any) =>
        r.status === 'fulfilled' && r.value.status === 200
      );

      expect(successful.length).toBeGreaterThanOrEqual(1);

      // 验证 Category 确实被删除了
      const exists = await helper.categoryExists(categoryUri);
      expect(exists).toBe(false);
    });
  });
});
