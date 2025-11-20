import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - DELETE /api/kg/datasources/:id', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Normal Deletion', () => {
    it('should delete a datasource without dependencies', async () => {
      // Create a datasource first
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'To Be Deleted',
          description: 'This will be deleted'
        })
        .expect(201);

      const datasourceUri = createResponse.body.uri;
      const shortId = datasourceUri.split('#')[1];

      // Delete the datasource
      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        deleted: true,
        uri: datasourceUri,
        deleted_at: expect.any(String)
      });

      // Verify deletion - datasource should not be found
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent datasource', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/nonexistent`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle deletion by full URI', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const fullUri = createResponse.body.uri;
      const encodedUri = encodeURIComponent(fullUri);

      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${encodedUri}`)
        .expect(200);

      expect(deleteResponse.body.deleted).toBe(true);

      // Verify deletion
      await request(app)
        .get(`${baseUrl}/${encodedUri}`)
        .expect(404);
    });

    it('should delete datasource with all optional fields', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Complete Dataset',
          fileName: 'data.csv',
          description: 'Full description',
          coverage: '2020-2024',
          recordCount: 5000,
          disclosureType: 'Public'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      // Verify all data is deleted
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(404);
    });
  });

  describe('Dependency Checking', () => {
    it('should prevent deletion when datasource is used by dataset variables (without force)', async () => {
      // Create a datasource
      const dsResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Protected Dataset' })
        .expect(201);

      const datasourceUri = dsResponse.body.uri;
      const shortId = datasourceUri.split('#')[1];

      // Create a dataset variable that uses this datasource
      await request(app)
        .post('/api/kg/dataset-variables')
        .send({
          label: 'Test Variable',
          sources: [datasourceUri]
        })
        .expect(201);

      // Try to delete without force - should fail
      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('dataset variables');

      // Verify datasource still exists
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);
    });
  });

  describe('Force Delete', () => {
    it('should delete datasource with dependencies when force=true', async () => {
      // Create a datasource
      const dsResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Force Delete Dataset' })
        .expect(201);

      const datasourceUri = dsResponse.body.uri;
      const shortId = datasourceUri.split('#')[1];

      // Create a dataset variable that uses this datasource
      await request(app)
        .post('/api/kg/dataset-variables')
        .send({
          label: 'Test Variable',
          sources: [datasourceUri]
        })
        .expect(201);

      // Delete with force=true
      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${shortId}?force=true`)
        .expect(200);

      expect(deleteResponse.body.deleted).toBe(true);

      // Verify datasource is deleted
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(404);
    });

    it('should cascade delete all triples when force=true', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Cascade Delete Dataset',
          fileName: 'data.csv',
          description: 'Description',
          coverage: '2020-2024',
          recordCount: 1000
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}?force=true`)
        .expect(200);

      // Verify no data remains
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(404);
    });

    it('should accept force=false and still check dependencies', async () => {
      // Create a datasource
      const dsResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const datasourceUri = dsResponse.body.uri;
      const shortId = datasourceUri.split('#')[1];

      // Create a dataset variable dependency
      await request(app)
        .post('/api/kg/dataset-variables')
        .send({
          label: 'Test Variable',
          sources: [datasourceUri]
        })
        .expect(201);

      // Try to delete with force=false
      await request(app)
        .delete(`${baseUrl}/${shortId}?force=false`)
        .expect(400);

      // Verify datasource still exists
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);
    });

    it('should handle force parameter with different formats', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      // Test force=1 (should work)
      const ds1Response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 1' })
        .expect(201);
      const shortId1 = ds1Response.body.uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId1}?force=1`)
        .expect(200);

      // Test force=true (should work)
      const ds2Response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 2' })
        .expect(201);
      const shortId2 = ds2Response.body.uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId2}?force=true`)
        .expect(200);
    });
  });

  describe('Database Verification', () => {
    it('should decrease datasource count after deletion', async () => {
      // Create multiple datasources
      await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 1' })
        .expect(201);

      await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 2' })
        .expect(201);

      const ds3Response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 3' })
        .expect(201);

      // Get count before deletion
      const beforeList = await request(app)
        .get(baseUrl)
        .expect(200);

      const countBefore = beforeList.body.total;
      expect(countBefore).toBe(3);

      // Delete one datasource
      const shortId3 = ds3Response.body.uri.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${shortId3}`)
        .expect(200);

      // Get count after deletion
      const afterList = await request(app)
        .get(baseUrl)
        .expect(200);

      const countAfter = afterList.body.total;
      expect(countAfter).toBe(2);
    });

    it('should delete all triples associated with datasource', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Full Dataset',
          fileName: 'file.csv',
          description: 'Description',
          coverage: '2020-2024',
          recordCount: 1000
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      // Delete datasource
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      // Verify nothing remains - should get 404
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for whitespace-only ID', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/ `)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle deletion of already deleted datasource', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Temporary Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      // First deletion
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      // Second deletion attempt - should fail
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(404);
    });

    it('should handle special characters in datasource ID', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Special_Dataset_Name' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle deletion while other datasources exist', async () => {
      // Create multiple datasources
      const ds1 = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 1' })
        .expect(201);

      const ds2 = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 2' })
        .expect(201);

      const ds3 = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 3' })
        .expect(201);

      // Delete middle one
      const shortId2 = ds2.body.uri.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${shortId2}`)
        .expect(200);

      // Verify others still exist
      const shortId1 = ds1.body.uri.split('#')[1];
      await request(app)
        .get(`${baseUrl}/${shortId1}`)
        .expect(200);

      const shortId3 = ds3.body.uri.split('#')[1];
      await request(app)
        .get(`${baseUrl}/${shortId3}`)
        .expect(200);
    });
  });

  describe('Response Format', () => {
    it('should return correct response format', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('uri');
      expect(deleteResponse.body).toHaveProperty('deleted', true);
      expect(deleteResponse.body).toHaveProperty('deleted_at');
      expect(deleteResponse.body.uri).toContain('http://example.org/esg#');
      
      // Verify deleted_at is a valid ISO timestamp
      const deletedAt = new Date(deleteResponse.body.deleted_at);
      expect(deletedAt).toBeInstanceOf(Date);
      expect(deletedAt.toString()).not.toBe('Invalid Date');
    });
  });
});
