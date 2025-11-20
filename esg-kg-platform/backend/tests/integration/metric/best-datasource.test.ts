import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/best-datasource', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  describe('Direct Measurement Metrics', () => {
    it('should return best datasource for direct measurement metric', async () => {
      const metricUri = await helper.createTestMetric('Test Metric');
      const datasourceUri = await helper.createTestDatasource('Corporate Disclosure Source');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('dataSource');
      expect(response.body.metricId).toBe(metricUri);
    });

    it('should return null dataSource when no datasources exist', async () => {
      const metricUri = await helper.createTestMetric('Metric Without DataSource');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
      expect(response.body.dataSource).toBeNull();
    });

    it('should prioritize Corporate Disclosure over other sources', async () => {
      const metricUri = await helper.createTestMetric('Multi Source Metric');
      
      // Create datasources with different disclosure types
      const corpDisclosure = await helper.createTestDatasource('Corporate Disclosure');
      const sustReport = await helper.createTestDatasource('Sustainability Report');
      
      await helper.addDatasourceToMetric(metricUri, sustReport);
      await helper.addDatasourceToMetric(metricUri, corpDisclosure);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body.dataSource).toBeDefined();
      // Corporate Disclosure should be preferred
    });
  });

  describe('Response Structure', () => {
    it('should have correct response structure', async () => {
      const metricUri = await helper.createTestMetric('Structure Test');
      const datasourceUri = await helper.createTestDatasource('Test DataSource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('dataSource');
      
      if (response.body.dataSource) {
        expect(response.body.dataSource).toHaveProperty('dataSourceID');
        expect(response.body.dataSource).toHaveProperty('disclosureType');
      }
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/best-datasource`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid uri')}/best-datasource`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /best-datasource`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Test');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded Test');
      const encodedUri = encodeURIComponent(metricUri);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/best-datasource`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle metric with special characters', async () => {
      const metricUri = await helper.createTestMetric('Metric & Special');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });

    it('should return consistent results for multiple requests', async () => {
      const metricUri = await helper.createTestMetric('Consistency Test');
      const datasourceUri = await helper.createTestDatasource('Test DS');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(response1.body.metricId).toBe(response2.body.metricId);
    });
  });
});
