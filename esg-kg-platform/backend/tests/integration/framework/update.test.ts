import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework API - PATCH /api/kg/frameworks/:id (Update)', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  describe('Single Field Update', () => {
    it('should update label only', async () => {
      const uri = await helper.createTestFramework('Original Name');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('label', 'Updated Name');
      expect(response.body).toHaveProperty('updated_at');

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.label).toBe('Updated Name');
    });

    it('should update sourceDocument only', async () => {
      const uri = await helper.createTestFramework('Framework Name');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ sourceDocument: 'https://updated.com/doc.pdf' })
        .expect(200);

      expect(response.body.sourceDocument).toBe('https://updated.com/doc.pdf');

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.label).toBe('Framework Name');
      expect(detail.sourceDocument).toBe('https://updated.com/doc.pdf');
    });

    it('should update categories only', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const uri = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(uri, [cat1]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ categories: [cat2] })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.categories).toHaveLength(1);
      expect(detail.categories[0].iri).toBe(cat2);
    });
  });

  describe('Multiple Fields Update', () => {
    it('should update label and sourceDocument together', async () => {
      const uri = await helper.createTestFramework('Old Name');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          sourceDocument: 'https://new.com/doc.pdf'
        })
        .expect(200);

      expect(response.body.label).toBe('New Name');
      expect(response.body.sourceDocument).toBe('https://new.com/doc.pdf');
    });

    it('should update all fields at once', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const uri = await helper.createTestFramework('Old Name');
      await helper.addCategoriesToFramework(uri, [cat1]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          sourceDocument: 'https://new.com/doc.pdf',
          categories: [cat2]
        })
        .expect(200);

      expect(response.body.label).toBe('New Name');
      expect(response.body.sourceDocument).toBe('https://new.com/doc.pdf');

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.categories).toHaveLength(1);
      expect(detail.categories[0].iri).toBe(cat2);
    });
  });

  describe('Clear Field', () => {
    it('should clear sourceDocument', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ sourceDocument: '' })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.sourceDocument).toBeUndefined();
    });

    it('should clear categories', async () => {
      const category = await helper.createTestCategory('Test Category');
      const uri = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(uri, [category]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ categories: [] })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.categories).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should reject empty label', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject label exceeding 200 characters', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];
      const longLabel = 'A'.repeat(201);

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid category URI', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ categories: ['http://example.org/esg#nonexistent'] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate label', async () => {
      await helper.createTestFramework('Existing Framework');
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Existing Framework' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject update without any fields', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when updating non-existent framework', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/nonexistent`)
        .send({ label: 'New Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return updated_at timestamp', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated Framework' })
        .expect(200);

      expect(response.body).toHaveProperty('updated_at');
      expect(typeof response.body.updated_at).toBe('string');
    });
  });

  describe('URI Format Support', () => {
    it('should update by short ID', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated' })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.label).toBe('Updated');
    });

    it('should update by full URI', async () => {
      const uri = await helper.createTestFramework('Test Framework');

      await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(uri)}`)
        .send({ label: 'Updated' })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.label).toBe('Updated');
    });

    it('should update by namespace format', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/esg:${shortId}`)
        .send({ label: 'Updated' })
        .expect(200);

      const detail = await helper.getFrameworkDetail(uri);
      expect(detail.label).toBe('Updated');
    });
  });
});
