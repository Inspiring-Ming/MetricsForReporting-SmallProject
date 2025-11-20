import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - PATCH /api/kg/datasources/:id (Update)', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Single Field Update', () => {
    it('should update label only', async () => {
      // Create a datasource first
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Original Name',
          description: 'Original Description',
          fileName: 'original.csv'
        })
        .expect(201);

      const datasourceUri = createResponse.body.uri;
      const shortId = datasourceUri.split('#')[1];

      // Update only the label
      const updateResponse = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated Name' })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('uri', datasourceUri);
      expect(updateResponse.body).toHaveProperty('label', 'Updated Name');
      expect(updateResponse.body).toHaveProperty('updated_at');

      // Verify other fields unchanged
      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.label).toBe('Updated Name');
      expect(detailResponse.body.result.description).toBe('Original Description');
      expect(detailResponse.body.result.fileName).toBe('original.csv');
    });

    it('should update description only', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          description: 'Original Description'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const updateResponse = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'Updated Description' })
        .expect(200);

      expect(updateResponse.body.label).toBe('Test Dataset');

      // Verify update
      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe('Updated Description');
    });

    it('should update fileName only', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          fileName: 'old_file.csv'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ fileName: 'new_file.csv' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.fileName).toBe('new_file.csv');
    });

    it('should update coverage only', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          coverage: '2020-2023'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ coverage: '2020-2024' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.coverage).toBe('2020-2024');
    });

    it('should update recordCount only', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          recordCount: 1000
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ recordCount: 2000 })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.recordCount).toBe(2000);
    });
  });

  describe('Multiple Fields Update', () => {
    it('should update multiple fields at once', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Old Name',
          description: 'Old Description',
          fileName: 'old_file.csv',
          recordCount: 1000
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const updateResponse = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          description: 'New Description',
          recordCount: 5000
        })
        .expect(200);

      expect(updateResponse.body.label).toBe('New Name');

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.label).toBe('New Name');
      expect(detailResponse.body.result.description).toBe('New Description');
      expect(detailResponse.body.result.recordCount).toBe(5000);
      expect(detailResponse.body.result.fileName).toBe('old_file.csv'); // unchanged
    });

    it('should update all fields at once', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Old Dataset',
          fileName: 'old.csv',
          description: 'Old Desc',
          coverage: '2020',
          recordCount: 100
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Dataset',
          fileName: 'new.csv',
          description: 'New Desc',
          coverage: '2024',
          recordCount: 5000,
          disclosureType: 'Public'
        })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.label).toBe('New Dataset');
      expect(detailResponse.body.result.fileName).toBe('new.csv');
      expect(detailResponse.body.result.description).toBe('New Desc');
      expect(detailResponse.body.result.coverage).toBe('2024');
      expect(detailResponse.body.result.recordCount).toBe(5000);
    });
  });

  describe('Field Deletion', () => {
    it('should delete description by setting to empty string', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          description: 'To be deleted'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: '' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBeUndefined();
    });

    it('should delete optional fields by setting to empty string', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          fileName: 'file.csv',
          coverage: '2020-2024',
          description: 'Description'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          fileName: '',
          coverage: '',
          description: ''
        })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.fileName).toBeUndefined();
      expect(detailResponse.body.result.coverage).toBeUndefined();
      expect(detailResponse.body.result.description).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    it('should reject empty request body', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('At least one field');
    });

    it('should reject negative recordCount', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ recordCount: -100 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('non-negative');
    });

    it('should reject invalid data types', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ recordCount: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept recordCount as 0', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset', recordCount: 100 })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ recordCount: 0 })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.recordCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent datasource', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/nonexistent`)
        .send({ label: 'New Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle update by full URI', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const fullUri = createResponse.body.uri;
      const encodedUri = encodeURIComponent(fullUri);

      await request(app)
        .patch(`${baseUrl}/${encodedUri}`)
        .send({ description: 'Updated by URI' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodedUri}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe('Updated by URI');
    });

    it('should handle special characters in label update', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Original' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'New Name with "quotes" and \\backslash\\' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.label).toBe('New Name with "quotes" and \\backslash\\');
    });
  });

  describe('Idempotency', () => {
    it('should handle multiple updates to same field', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({ label: 'Original' })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      // First update
      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'First Update' })
        .expect(200);

      // Second update
      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'Second Update' })
        .expect(200);

      // Third update
      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'Final Update' })
        .expect(200);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe('Final Update');
    });

    it('should handle update with same values', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          description: 'Original Description'
        })
        .expect(201);

      const shortId = createResponse.body.uri.split('#')[1];

      // Update with same values
      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'Test Dataset',
          description: 'Original Description'
        })
        .expect(200);

      expect(response.body.label).toBe('Test Dataset');
    });
  });
});
