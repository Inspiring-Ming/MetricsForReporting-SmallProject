import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - GET /api/kg/dataset-variables/:id/datasources', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Get Datasources for Variable', () => {
    it('should get all datasources for a dataset variable', async () => {
      // Create datasources
      const ds1Response = await request(app)
        .post('/api/kg/datasources')
        .send({
          label: 'Financial Dataset',
          fileName: 'financial.csv',
          recordCount: 1000
        })
        .expect(201);

      const ds2Response = await request(app)
        .post('/api/kg/datasources')
        .send({
          label: 'Environmental Dataset',
          fileName: 'environmental.csv',
          recordCount: 500
        })
        .expect(201);

      const datasource1Uri = ds1Response.body.uri;
      const datasource2Uri = ds2Response.body.uri;

      // Create dataset variable with datasources
      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Variable',
          sources: [datasource1Uri, datasource2Uri]
        })
        .expect(201);

      const variableUri = varResponse.body.uri;
      const shortId = variableUri.split('#')[1];

      // Get datasources for the variable
      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id', variableUri);
      expect(response.body).toHaveProperty('variable_label', 'Test Variable');
      expect(response.body).toHaveProperty('datasources');
      expect(response.body).toHaveProperty('total', 2);

      expect(response.body.datasources).toHaveLength(2);
      
      const datasourceLabels = response.body.datasources.map((ds: any) => ds.label);
      expect(datasourceLabels).toContain('Financial Dataset');
      expect(datasourceLabels).toContain('Environmental Dataset');

      // Verify datasource details
      const financialDs = response.body.datasources.find((ds: any) => ds.label === 'Financial Dataset');
      expect(financialDs).toMatchObject({
        iri: datasource1Uri,
        label: 'Financial Dataset',
        fileName: 'financial.csv',
        recordCount: 1000
      });
    });

    it('should return empty datasources array for variable with no datasources', async () => {
      // Create dataset variable without datasources
      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Variable Without Sources'
        })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // Get datasources
      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body.datasources).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.variable_label).toBe('Variable Without Sources');
    });

    it('should handle request by full URI', async () => {
      // Create datasource and variable
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Test Datasource' })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Variable',
          sources: [dsResponse.body.uri]
        })
        .expect(201);

      const fullUri = varResponse.body.uri;
      const encodedUri = encodeURIComponent(fullUri);

      // Get by full URI
      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/datasources`)
        .expect(200);

      expect(response.body.variable_id).toBe(fullUri);
      expect(response.body.datasources).toHaveLength(1);
    });

    it('should return 404 for non-existent variable', async () => {
      const response = await request(app)
        .get(`${baseUrl}/nonexistent/datasources`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include all datasource properties', async () => {
      // Create datasource with all fields
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({
          label: 'Complete Dataset',
          fileName: 'complete.csv',
          description: 'A complete dataset',
          coverage: '2020-2024',
          recordCount: 2000
        })
        .expect(201);

      // Create variable with datasource
      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Variable',
          sources: [dsResponse.body.uri]
        })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      // Get datasources
      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body.datasources[0]).toMatchObject({
        iri: dsResponse.body.uri,
        label: 'Complete Dataset',
        fileName: 'complete.csv',
        description: 'A complete dataset',
        coverage: '2020-2024',
        recordCount: 2000
      });
    });

    it('should handle variable with single datasource', async () => {
      const dsResponse = await request(app)
        .post('/api/kg/datasources')
        .send({ label: 'Single Datasource' })
        .expect(201);

      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Single Source Variable',
          sources: [dsResponse.body.uri]
        })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.datasources).toHaveLength(1);
    });

    it('should handle variable with multiple datasources', async () => {
      // Create 5 datasources
      const datasourceUris = [];
      for (let i = 1; i <= 5; i++) {
        const dsResponse = await request(app)
          .post('/api/kg/datasources')
          .send({ label: `Datasource ${i}` })
          .expect(201);
        datasourceUris.push(dsResponse.body.uri);
      }

      // Create variable with all datasources
      const varResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Multi Source Variable',
          sources: datasourceUris
        })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body.total).toBe(5);
      expect(response.body.datasources).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /datasources`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle special characters in variable ID', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test_Variable_Name' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const varResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Variable' })
        .expect(201);

      const shortId = varResponse.body.uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/datasources`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id');
      expect(response.body).toHaveProperty('variable_label');
      expect(response.body).toHaveProperty('datasources');
      expect(response.body).toHaveProperty('total');

      expect(typeof response.body.variable_id).toBe('string');
      expect(typeof response.body.variable_label).toBe('string');
      expect(Array.isArray(response.body.datasources)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });
  });
});
