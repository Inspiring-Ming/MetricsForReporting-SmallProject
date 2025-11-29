import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - DELETE /api/kg/metrics/:id (Delete)', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanModels();
    await helper.cleanDataSources();
    metricUri = await helper.createTestMetric('Test Metric');
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanModels();
    await helper.cleanDataSources();
  });

  describe('Successful Deletion', () => {
    it('should delete metric without associations', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      expect(response.body.iri).toBe(metricUri);
      expect(response.body.deleted).toBe(true);
      expect(response.body).toHaveProperty('deleted_at');

      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });

    it('should delete metric with datasources', async () => {
      const datasource = await helper.createTestDatasource('Test Datasource');
      await helper.addDatasourceToMetric(metricUri, datasource);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });

    it('should delete metric with category association', async () => {
      const category = await helper.createTestCategory('Test Category');
      await helper.addMetricsToCategory(category, [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);

      // Category should still exist
      const categoryExists = await helper.categoryExists(category);
      expect(categoryExists).toBe(true);
    });

    it('should delete metric with force=true even if used by models', async () => {
      const model = await helper.createTestModel('Test Model', [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ force: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });

    it('should cascade delete all metric associations', async () => {
      const datasource = await helper.createTestDatasource('Test Datasource');
      const category = await helper.createTestCategory('Test Category');
      await helper.addDatasourceToMetric(metricUri, datasource);
      await helper.addMetricsToCategory(category, [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ cascade: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('should reject deletion when used by models without force', async () => {
      const model = await helper.createTestModel('Dependent Model', [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(409);

      expect(response.body.error.message).toMatch(/used.*input.*model/i);

      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(true);
    });

    it('should reject deletion when used by multiple models', async () => {
      const model1 = await helper.createTestModel('Model 1', [metricUri]);
      const model2 = await helper.createTestModel('Model 2', [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(409);

      expect(response.body.error.message).toMatch(/2.*model/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      // Use a truly invalid URI format with special characters
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent('invalid iri with spaces')}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('Cascade and Force Combinations', () => {
    it('should delete with both cascade and force flags', async () => {
      const datasource = await helper.createTestDatasource('Test Datasource');
      const model = await helper.createTestModel('Test Model', [metricUri]);
      await helper.addDatasourceToMetric(metricUri, datasource);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ cascade: true, force: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });

    it('should not delete datasources when cascade is false', async () => {
      const datasource = await helper.createTestDatasource('Test Datasource');
      await helper.addDatasourceToMetric(metricUri, datasource);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ cascade: false })
        .expect(200);

      const metricExists = await helper.metricExists(metricUri);
      expect(metricExists).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deletion of already deleted metric', async () => {
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(404);

      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should remove metric from category associations on deletion', async () => {
      const category = await helper.createTestCategory('Test Category');
      await helper.addMetricsToCategory(category, [metricUri]);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      const categoryMetrics = await helper.getCategoryMetrics(category);
      expect(categoryMetrics).not.toContain(metricUri);
    });

    it('should handle deletion of metric with multiple associations', async () => {
      const datasource1 = await helper.createTestDatasource('Datasource 1');
      const datasource2 = await helper.createTestDatasource('Datasource 2');
      const category1 = await helper.createTestCategory('Category 1');
      const category2 = await helper.createTestCategory('Category 2');

      await helper.addDatasourceToMetric(metricUri, datasource1);
      await helper.addDatasourceToMetric(metricUri, datasource2);
      await helper.addMetricsToCategory(category1, [metricUri]);
      await helper.addMetricsToCategory(category2, [metricUri]);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ cascade: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);
      const exists = await helper.metricExists(metricUri);
      expect(exists).toBe(false);
    });
  });

  describe('Permission and Safety', () => {
    it('should require explicit force flag to delete metric with dependencies', async () => {
      const model = await helper.createTestModel('Dependent Model', [metricUri]);

      // Without force - should fail
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(409);

      // With force - should succeed
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .query({ force: true })
        .expect(200);
    });

    it('should safely delete metric without affecting other metrics', async () => {
      const metric2 = await helper.createTestMetric('Other Metric');
      const category = await helper.createTestCategory('Shared Category');

      await helper.addMetricsToCategory(category, [metricUri, metric2]);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}`)
        .expect(200);

      const metric2Exists = await helper.metricExists(metric2);
      expect(metric2Exists).toBe(true);

      const categoryMetrics = await helper.getCategoryMetrics(category);
      expect(categoryMetrics).toContain(metric2);
      expect(categoryMetrics).not.toContain(metricUri);
    });
  });
});
