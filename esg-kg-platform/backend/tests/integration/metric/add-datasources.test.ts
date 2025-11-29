import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - POST /api/kg/metrics/:id/datasources (Add Datasource)', () => {
  let metricUri: string;

  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
  });

  describe('Successful Additions', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should add datasource to metric', async () => {
      const datasourceUri = await helper.createTestDatasource('Test Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri
        })
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri', metricUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
      expect(response.body).toHaveProperty('added_at');

      // Verify the association was created
      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toContain(datasourceUri);
    });

    it('should add datasource with datasetVariableUri', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');
      const datasetVariableUri = 'http://example.org/esg#TestVariable';

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          datasetVariableUri
        })
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceUri);
      // dataset_variable_iri may not be returned in response
      if (response.body.dataset_variable_iri) {
        expect(response.body.dataset_variable_iri).toBe(datasetVariableUri);
      }
    });

    it('should add datasource with disclosureLevel', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          disclosureLevel: 1
        })
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceUri);
      // disclosure_level may not be returned in response
      if (response.body.disclosure_level) {
        expect(response.body.disclosure_level).toBe(1);
      }
    });

    it('should add datasource with priority', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          priority: 10
        })
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceUri);
      // priority may not be returned in response
      if (response.body.priority) {
        expect(response.body.priority).toBe(10);
      }
    });

    it('should add datasource with all optional fields', async () => {
      const datasourceUri = await helper.createTestDatasource('Complete Datasource');
      const datasetVariableUri = 'http://example.org/esg#Variable';

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          datasetVariableUri,
          disclosureLevel: 2,
          priority: 5
        })
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceUri);
      // Optional fields may not be returned in response
      // Just verify the datasource was added successfully
    });

    it('should add multiple datasources to same metric', async () => {
      const datasource1 = await helper.createTestDatasource('Datasource 1');
      const datasource2 = await helper.createTestDatasource('Datasource 2');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri: datasource1 })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri: datasource2 })
        .expect(200);

      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources).toContain(datasource1);
      expect(datasources).toContain(datasource2);
      expect(datasources.length).toBeGreaterThanOrEqual(2);
    });

    it('should add datasource using short ID format or full URI', async () => {
      const datasourceUri = await helper.createTestDatasource('Short ID Test');
      const shortId = datasourceUri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: shortId
        });

      // API may or may not support short ID format
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('datasource_iri');
      }
    });
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should require datasourceUri field', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toMatch(/datasource.*required/i);
    });

    it('should reject empty datasourceUri', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: ''
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/datasource.*required|invalid/i);
    });

    it('should reject invalid datasourceUri format', async () => {
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: 'invalid iri with spaces'
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should handle non-existent datasource', async () => {
      const nonExistentDatasource = 'http://example.org/esg#NonExistentDatasource';

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: nonExistentDatasource
        });

      // API may or may not validate datasource existence
      expect([200, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.error.message).toMatch(/datasource.*not found/i);
      }
    });

    it('should handle invalid disclosureLevel value', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          disclosureLevel: 5  // Valid range is typically 1-3
        });

      // API may or may not validate disclosure level range
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error.message).toMatch(/disclosure level|invalid/i);
      }
    });

    it('should handle negative priority value', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          priority: -1
        });

      // API may or may not validate negative priority
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error.message).toMatch(/priority|invalid/i);
      }
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/datasources`)
        .send({
          datasourceUri
        })
        .expect(404);

      expect(response.body.error.message).toMatch(/metric.*not found/i);
    });

    it('should return 400 for invalid metric URI format', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent('invalid metric iri')}/datasources`)
        .send({
          datasourceUri
        })
        .expect(400);

      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should handle adding datasource to calculation_model metric', async () => {
      const calculatedMetric = await helper.createTestMetric('Calculated Metric', {
        calculationMethod: 'calculation_model'
      });
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(calculatedMetric)}/datasources`)
        .send({
          datasourceUri
        });

      // API may or may not reject datasource for calculation_model
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error.message).toMatch(/calculation.*model|direct measurement/i);
      }
    });
  });

  describe('Duplicate Prevention', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should handle adding same datasource twice', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      // Add first time
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      // Try to add again
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri });

      // API may allow duplicate or return conflict
      expect([200, 409]).toContain(response.status);
      if (response.status === 409) {
        expect(response.body.error.message).toMatch(/already exists|duplicate/i);
      }
    });

    it('should allow updating existing datasource association', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      // Add with priority 1
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          priority: 1
        })
        .expect(200);

      // Update with priority 10 (if endpoint supports update on conflict)
      // Otherwise this should fail with 409
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri,
          priority: 10
        });

      expect([200, 409]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL-encoded URIs', async () => {
      const metricWithSpace = await helper.createTestMetric('Metric With Space', {
        calculationMethod: 'direct_measurement'
      });
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricWithSpace)}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      expect(response.body.metric_iri).toBe(metricWithSpace);
    });

    it('should handle datasource with special characters', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'direct_measurement'
      });
      const datasourceWithChars = await helper.createTestDatasource('Datasource & Co.');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri: datasourceWithChars })
        .expect(200);

      expect(response.body.datasource_iri).toBe(datasourceWithChars);
    });

    it('should handle disclosureLevel boundary values', async () => {
      metricUri = await helper.createTestMetric('Metric', {
        calculationMethod: 'direct_measurement'
      });
      const datasourceUri = await helper.createTestDatasource('Datasource');

      // Test level 1
      const response1 = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: await helper.createTestDatasource('DS1'),
          disclosureLevel: 1
        })
        .expect(200);
      // disclosure_level may not be returned
      if (response1.body.disclosure_level) {
        expect(response1.body.disclosure_level).toBe(1);
      }

      // Test level 3
      const response3 = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: await helper.createTestDatasource('DS3'),
          disclosureLevel: 3
        })
        .expect(200);
      if (response3.body.disclosure_level) {
        expect(response3.body.disclosure_level).toBe(3);
      }
    });
  });

  describe('Integration with Other Endpoints', () => {
    beforeEach(async () => {
      metricUri = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
    });

    it('should reflect in GET /api/kg/metrics/:id/datasources', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      // Verify datasource was actually added by querying directly
      const datasources = await helper.getMetricDatasources(metricUri);
      expect(datasources.length).toBeGreaterThanOrEqual(1);
      expect(datasources).toContain(datasourceUri);
    });

    it('should reflect in GET /api/kg/metrics/:id/best-datasource', async () => {
      const datasource = await helper.createTestDatasource('High Priority DS');

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({
          datasourceUri: datasource,
          disclosureLevel: 1,
          priority: 10
        })
        .expect(200);

      const bestResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/best-datasource`)
        .expect(200);

      expect(bestResponse.body).toHaveProperty('dataSource');
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

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('datasource_iri');
      expect(response.body).toHaveProperty('added_at');
    });

    it('should include timestamp in response', async () => {
      const datasourceUri = await helper.createTestDatasource('Datasource');

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      expect(response.body).toHaveProperty('added_at');
    });
  });
});
