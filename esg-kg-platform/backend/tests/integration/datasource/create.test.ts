import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - POST /api/kg/datasources (Create)', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Basic Functionality', () => {
    it('should create datasource with only required fields', async () => {
      const newDatasource = {
        label: 'New Test Dataset'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newDatasource)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', 'New Test Dataset');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.iri).toContain('http://example.org/esg#');
      expect(response.body.iri).toContain('New_Test_Dataset');
    });

    it('should create datasource with all fields', async () => {
      const newDatasource = {
        label: 'Complete Dataset',
        fileName: 'complete_data.csv',
        description: 'A complete dataset with all fields',
        coverage: '2020-2024',
        recordCount: 5000,
        disclosureType: 'Public'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newDatasource)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', 'Complete Dataset');
      expect(response.body).toHaveProperty('created_at');

      // Verify datasource was created with all fields
      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.fileName).toBe('complete_data.csv');
      expect(detailResponse.body.result.description).toBe('A complete dataset with all fields');
      expect(detailResponse.body.result.coverage).toBe('2020-2024');
      expect(detailResponse.body.result.recordCount).toBe(5000);
    });

    it('should create datasource with some optional fields', async () => {
      const newDatasource = {
        label: 'Partial Dataset',
        fileName: 'partial.csv',
        recordCount: 100
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newDatasource)
        .expect(201);

      expect(response.body.label).toBe('Partial Dataset');

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.fileName).toBe('partial.csv');
      expect(detailResponse.body.result.recordCount).toBe(100);
      expect(detailResponse.body.result.description).toBeUndefined();
      expect(detailResponse.body.result.coverage).toBeUndefined();
    });

    it('should generate unique URIs for datasources with same label', async () => {
      const datasource1 = await request(app)
        .post(baseUrl)
        .send({ label: 'Duplicate Name' })
        .expect(201);

      const datasource2 = await request(app)
        .post(baseUrl)
        .send({ label: 'Duplicate Name' })
        .expect(201);

      expect(datasource1.body.iri).not.toBe(datasource2.body.iri);
      expect(datasource1.body.label).toBe(datasource2.body.label);
    });
  });

  describe('Response Structure', () => {
    it('should return properly structured response', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('created_at');

      expect(typeof response.body.iri).toBe('string');
      expect(typeof response.body.label).toBe('string');
      expect(typeof response.body.created_at).toBe('string');
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const timestamp = new Date(response.body.created_at);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(response.body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return recent timestamp', async () => {
      const before = Date.now();

      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Test Dataset' })
        .expect(201);

      const after = Date.now();
      const responseTime = new Date(response.body.created_at).getTime();

      expect(responseTime).toBeGreaterThanOrEqual(before - 1000);
      expect(responseTime).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('Validation', () => {
    it('should reject missing label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Label is required');
    });

    it('should reject empty label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('empty');
    });

    it('should reject whitespace-only label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-string label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('must be a string');
    });

    it('should reject negative recordCount', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          recordCount: -1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('non-negative');
    });

    it('should accept recordCount of 0', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Empty Dataset',
          recordCount: 0
        })
        .expect(201);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.recordCount).toBe(0);
    });

    it('should accept large recordCount', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Large Dataset',
          recordCount: 1000000
        })
        .expect(201);

      expect(response.body.label).toBe('Large Dataset');
    });

    it('should reject non-string fileName', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          fileName: 123
        })
        .expect(400);

      expect(response.body.error.message).toContain('File name must be a string');
    });

    it('should reject non-string description', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          description: { text: 'description' }
        })
        .expect(400);

      expect(response.body.error.message).toContain('Description must be a string');
    });

    it('should reject non-string coverage', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          coverage: ['2020', '2024']
        })
        .expect(400);

      expect(response.body.error.message).toContain('Coverage must be a string');
    });

    it('should reject non-number recordCount', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Dataset',
          recordCount: '1000'
        })
        .expect(400);

      expect(response.body.error.message).toContain('must be a non-negative number');
    });
  });

  describe('Special Characters', () => {
    it('should handle label with spaces', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset With Spaces' })
        .expect(201);

      expect(response.body.label).toBe('Dataset With Spaces');
      expect(response.body.iri).toContain('Dataset_With_Spaces');
    });

    it('should handle label with special characters', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset-With_Special.Chars!@#' })
        .expect(201);

      expect(response.body.label).toBe('Dataset-With_Special.Chars!@#');
    });

    it('should handle label with numbers', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 2024 v1.0' })
        .expect(201);

      expect(response.body.label).toBe('Dataset 2024 v1.0');
    });

    it('should handle description with quotes', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Quoted Dataset',
          description: 'Dataset with "quoted" text'
        })
        .expect(201);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe('Dataset with "quoted" text');
    });

    it('should handle multiline description', async () => {
      const description = 'Line 1\nLine 2\nLine 3';
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Multiline Dataset',
          description
        })
        .expect(201);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe(description);
    });
  });

  describe('Data Persistence', () => {
    it('should persist datasource and be retrievable', async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .send({
          label: 'Persistent Dataset',
          fileName: 'persistent.csv',
          recordCount: 100
        })
        .expect(201);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(createResponse.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.label).toBe('Persistent Dataset');
      expect(detailResponse.body.result.fileName).toBe('persistent.csv');
      expect(detailResponse.body.result.recordCount).toBe(100);
    });

    it('should appear in list after creation', async () => {
      await request(app)
        .post(baseUrl)
        .send({ label: 'Listed Dataset' })
        .expect(201);

      const listResponse = await request(app)
        .get(baseUrl)
        .expect(200);

      const labels = listResponse.body.result.map((ds: any) => ds.label);
      expect(labels).toContain('Listed Dataset');
    });

    it('should create multiple datasources', async () => {
      await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 1' })
        .expect(201);

      await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 2' })
        .expect(201);

      await request(app)
        .post(baseUrl)
        .send({ label: 'Dataset 3' })
        .expect(201);

      const listResponse = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(listResponse.body.total).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Boundary Values', () => {
    it('should handle very long label', async () => {
      const longLabel = 'A'.repeat(500);
      const response = await request(app)
        .post(baseUrl)
        .send({ label: longLabel })
        .expect(201);

      expect(response.body.label).toBe(longLabel);
    });

    it('should handle very long description', async () => {
      const longDescription = 'This is a very long description. '.repeat(100);
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Long Description Dataset',
          description: longDescription
        })
        .expect(201);

      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(response.body.iri)}`)
        .expect(200);

      expect(detailResponse.body.result.description).toBe(longDescription);
    });

    it('should handle maximum safe integer for recordCount', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Max Records Dataset',
          recordCount: Number.MAX_SAFE_INTEGER
        })
        .expect(201);

      expect(response.body.label).toBe('Max Records Dataset');
    });
  });
});
