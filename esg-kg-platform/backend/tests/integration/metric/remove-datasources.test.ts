import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - DELETE /api/kg/metrics/:id/datasources/:datasourceId (Remove Datasource)', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  describe('Successful Deletions', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should remove datasource from metric', async () => {
      const datasourceUri = await helper.createTestDatasource('Test Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const datasourceId = encodeURIComponent(datasourceUri);
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${datasourceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', metricUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
      expect(response.body).toHaveProperty('removed_at');

      // Verify the association was removed
      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).not.toContain(datasourceUri);
    });

    it('should remove datasource using short ID format', async () => {
      const datasourceUri = await helper.createTestDatasource('Short ID Test');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const shortId = datasourceUri.split('#')[1];
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${shortId}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('datasource_iri');
      expect(response.body).toHaveProperty('removed_at');
    });

    it('should handle removing one datasource while others remain', async () => {
      const datasource1 = await helper.createTestDatasource('Datasource 1');
      const datasource2 = await helper.createTestDatasource('Datasource 2');
      const datasource3 = await helper.createTestDatasource('Datasource 3');

      await helper.addDatasourceToMetric(metricUri, datasource1);
      await helper.addDatasourceToMetric(metricUri, datasource2);
      await helper.addDatasourceToMetric(metricUri, datasource3);

      // Remove datasource2
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasource2)}`)
        .expect(200);

      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toContain(datasource1);
      expect(datasources).not.toContain(datasource2);
      expect(datasources).toContain(datasource3);
    });

    it('should successfully remove last datasource from metric', async () => {
      const datasourceUri = await helper.createTestDatasource('Only Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toHaveLength(0);
    });
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should return 200 even when datasource is not associated with metric (idempotent)', async () => {
      const datasourceUri = await helper.createTestDatasource('Unassociated Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', metricUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
    });

    it('should return 200 for non-existent datasource (idempotent)', async () => {
      const nonExistentDatasource = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(nonExistentDatasource)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', metricUri);
      expect(response.body).toHaveProperty('datasource_iri', nonExistentDatasource);
    });

    it('should return 400 for invalid datasource URI format', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent('invalid iri')}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });
  });

  describe('Error Cases', () => {
    it('should return 200 for non-existent metric (idempotent)', async () => {
      const nonExistentMetric = 'http://example.org/esg#NonExistent';
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentMetric)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', nonExistentMetric);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
    });

    it('should return 400 for invalid metric URI format', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent('invalid metric iri')}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should handle deletion from calculation_model metric (returns 200)', async () => {
      const calculatedMetric = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(calculatedMetric)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', calculatedMetric);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
    });
  });

  describe('Idempotency', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should return 200 when trying to delete already deleted datasource (idempotent)', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      // First deletion
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      // Second deletion attempt - should still return 200 (idempotent)
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', metricUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL-encoded URIs', async () => {
      const metricWithSpace = await helper.createTestMetric('Metric With Space', {
        calculationMethod: 'direct_measurement'
      });
      const datasourceWithSpace = await helper.createTestDatasource('Datasource With Space');
      await helper.addDatasourceToMetric(metricWithSpace, datasourceWithSpace);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricWithSpace)}/datasources/${encodeURIComponent(datasourceWithSpace)}`)
        .expect(200);

      expect(response.body.metric_iri).toBe(metricWithSpace);
      expect(response.body.datasource_iri).toBe(datasourceWithSpace);
    });

    it('should handle datasource with special characters', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'direct_measurement'
      });
      const datasourceWithChars = await helper.createTestDatasource('Datasource & Co.');
      await helper.addDatasourceToMetric(metricUri, datasourceWithChars);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceWithChars)}`)
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceWithChars);
    });

    it('should handle rapid successive deletions', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'direct_measurement'
      });
      const ds1 = await helper.createTestDatasource('DS1');
      const ds2 = await helper.createTestDatasource('DS2');

      await helper.addDatasourceToMetric(metricUri, ds1);
      await helper.addDatasourceToMetric(metricUri, ds2);

      // Delete both rapidly
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(ds1)}`)
        .expect(200);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(ds2)}`)
        .expect(200);

      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toHaveLength(0);
    });
  });

  describe('Integration with Other Endpoints', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should verify deletion via helper method', async () => {
      const datasource1 = await helper.createTestDatasource('DS1');
      const datasource2 = await helper.createTestDatasource('DS2');

      await helper.addDatasourceToMetric(metricUri, datasource1);
      await helper.addDatasourceToMetric(metricUri, datasource2);

      // Delete one
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasource1)}`)
        .expect(200);

      // Verify via helper method (checks esg:hasDataSource triples)
      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).not.toContain(datasource1);
      expect(datasources).toContain(datasource2);
    });

    it('should verify deletion affects metric state', async () => {
      const datasourceUri = await helper.createTestDatasource('Only Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      // Verify datasource exists before deletion
      let datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toContain(datasourceUri);

      // Delete the datasource
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      // Verify datasource no longer exists
      datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).not.toContain(datasourceUri);
    });

    it('should successfully delete and verify removal', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      // Verify exists before deletion
      let datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toHaveLength(1);
      expect(datasources[0]).toBe(datasourceUri);

      // Delete datasource
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      // Verify removed after deletion
      datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toHaveLength(0);
    });
  });

  describe('Response Format', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should return proper response structure', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('datasource_iri');
      expect(response.body).toHaveProperty('removed_at');
    });

    it('should include timestamp in response', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('removed_at');
      expect(typeof response.body.removed_at).toBe('string');
      expect(new Date(response.body.removed_at).toString()).not.toBe('Invalid Date');
    });
  });
});
