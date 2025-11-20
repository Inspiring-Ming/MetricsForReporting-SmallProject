import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - POST /api/kg/dataset-variables/:id/datasources', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Add Datasource to Variable', () => {
    it('should add a datasource to a dataset variable', async () => {
      // Create datasource
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({
          label: 'Test Datasource',
          fileName: 'test.csv'
        })
        .expect(201);

      const datasourceUri = dsResponse.body.uri;

      // Create dataset variable without datasources
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const variableUri = varResponse.body.uri;
      const shortId = variableUri.split('#')[1];

      // Add datasource to variable
      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri })
        .expect(200);

      expect(response.body).toHaveProperty('variable_uri', variableUri);
      expect(response.body).toHaveProperty('datasource_uri', datasourceUri);
      expect(response.body).toHaveProperty('added_at');
      expect(response.body.added_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verify the association was created
      const getResponse = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(getResponse.body.datasources).toHaveLength(1);
      expect(getResponse.body.datasources[0].iri).toBe(datasourceUri);
    });

    it('should add datasource using short ID', async () => {
      // Create datasource
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const datasourceUri = dsResponse.body.uri;
      const datasourceShortId = datasourceUri.split('#')[1];

      // Create variable
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // Add datasource using short ID
      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: datasourceShortId })
        .expect(200);

      expect(response.body.datasource_uri).toContain(datasourceShortId);

      // Verify
      const getResponse = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(getResponse.body.datasources).toHaveLength(1);
    });

    it('should add multiple datasources to same variable', async () => {
      // Create multiple datasources
      const ds1Response = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Datasource 1' })
        .expect(201);

      const ds2Response = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Datasource 2' })
        .expect(201);

      const ds3Response = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Datasource 3' })
        .expect(201);

      // Create variable
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // Add datasources one by one
      await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: ds1Response.body.uri })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: ds2Response.body.uri })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: ds3Response.body.uri })
        .expect(200);

      // Verify all datasources are associated
      const getResponse = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(getResponse.body.datasources).toHaveLength(3);
      expect(getResponse.body.total).toBe(3);
    });

    it('should handle request by full variable URI', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const fullUri = varResponse.body.uri;
      const encodedUri = encodeURIComponent(fullUri);

      const response = await request(app)
        .post(`${baseUrl}/${encodedUri}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      expect(response.body.variable_uri).toBe(fullUri);
    });
  });

  describe('Validation', () => {
    it('should reject request without datasourceUri', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Datasource URI is required');
    });

    it('should reject empty datasourceUri', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject whitespace-only datasourceUri', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate datasource association', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // First add should succeed
      await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      // Second add should fail
      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('already associated');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent variable', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const response = await request(app)
        .post(`${baseUrl}/nonexistent/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Dataset variable not found');
    });

    it('should return 404 for non-existent datasource', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: 'http://example.org/esg#NonExistentDatasource' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Datasource not found');
    });

    it('should handle invalid variable ID format', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const response = await request(app)
        .post(`${baseUrl}/ /datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle adding datasources to different variables concurrently', async () => {
      // Create datasource
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Shared Datasource' })
        .expect(201);

      // Create two variables
      const var1Response = await request(app)
        .post(baseUrl)
        .send({ label: 'Variable 1' })
        .expect(201);

      const var2Response = await request(app)
        .post(baseUrl)
        .send({ label: 'Variable 2' })
        .expect(201);

      const var1Id = var1Response.body.uri.split('#')[1];
      const var2Id = var2Response.body.uri.split('#')[1];

      // Add same datasource to both variables
      await request(app)
        .post(`${baseUrl}/${var1Id}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      await request(app)
        .post(`${baseUrl}/${var2Id}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      // Verify both associations exist
      const get1Response = await request(app)
        .get(`${baseUrl}/${var1Id}/datasources`)
        .expect(200);

      const get2Response = await request(app)
        .get(`${baseUrl}/${var2Id}/datasources`)
        .expect(200);

      expect(get1Response.body.datasources).toHaveLength(1);
      expect(get2Response.body.datasources).toHaveLength(1);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      expect(response.body).toHaveProperty('variable_uri');
      expect(response.body).toHaveProperty('datasource_uri');
      expect(response.body).toHaveProperty('added_at');

      expect(typeof response.body.variable_uri).toBe('string');
      expect(typeof response.body.datasource_uri).toBe('string');
      expect(typeof response.body.added_at).toBe('string');

      // Verify URIs are valid
      expect(response.body.variable_uri).toContain('http://example.org/esg#');
      expect(response.body.datasource_uri).toContain('http://example.org/esg#');

      // Verify timestamp is valid ISO format
      const timestamp = new Date(response.body.added_at);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Integration with GET endpoint', () => {
    it('should see added datasource in GET response', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({
          label: 'Complete Datasource',
          fileName: 'complete.csv',
          description: 'A complete datasource',
          coverage: '2020-2024',
          recordCount: 1000
        })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // Add datasource
      await request(app)
        .post(`${baseUrl}/${shortId}/datasources`)
        .send({ datasourceUri: dsResponse.body.uri })
        .expect(200);

      // Get datasources and verify all fields
      const getResponse = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(getResponse.body.datasources[0]).toMatchObject({
        iri: dsResponse.body.uri,
        label: 'Complete Datasource',
        fileName: 'complete.csv',
        description: 'A complete datasource',
        coverage: '2020-2024',
        recordCount: 1000
      });
    });
  });
});
