import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework API - GET /api/kg/frameworks/:id (Detail)', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  describe('Normal Query', () => {
    it('should get framework detail by full URI', async () => {
      const uri = await helper.createTestFramework('Test Framework');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri', uri);
      expect(response.body.result).toHaveProperty('label', 'Test Framework');
    });

    it('should get framework detail by short ID', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri', uri);
      expect(response.body.result).toHaveProperty('label', 'Test Framework');
    });

    it('should get framework detail by namespace format', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const shortId = uri.split('#')[1];
      const namespaceId = `esg:${shortId}`;

      const response = await request(app)
        .get(`${baseUrl}/${namespaceId}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('label', 'Test Framework');
    });

    it('should return complete information structure', async () => {
      const uri = await helper.createTestFramework('Complete Framework');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label');
    });
  });

  describe('Categories Association', () => {
    it('should return undefined categories when no categories associated', async () => {
      const uri = await helper.createTestFramework('Framework Without Categories');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.categories).toBeUndefined();
    });

    it('should return single associated category', async () => {
      const category = await helper.createTestCategory('Test Category');
      const uri = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(uri, [category]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.categories).toHaveLength(1);
      expect(response.body.result.categories[0]).toHaveProperty('iri', category);
      expect(response.body.result.categories[0]).toHaveProperty('label');
    });

    it('should return multiple associated categories', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const cat3 = await helper.createTestCategory('Category 3');

      const uri = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(uri, [cat1, cat2, cat3]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.categories).toHaveLength(3);
    });

    it('should include category iri and label', async () => {
      const category = await helper.createTestCategory('Verified Category');
      const uri = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(uri, [category]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      const cat = response.body.result.categories[0];
      expect(cat).toHaveProperty('iri');
      expect(cat).toHaveProperty('label');
      expect(typeof cat.iri).toBe('string');
      expect(typeof cat.label).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent framework', async () => {
      const response = await request(app)
        .get(`${baseUrl}/nonexistent`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for invalid URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/http://invalid.uri/test`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('URI Format Support', () => {
    it('should support URL encoded full URI', async () => {
      const uri = await helper.createTestFramework('Test Framework');
      const encodedUri = encodeURIComponent(uri);

      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}`)
        .expect(200);

      expect(response.body.result.label).toBe('Test Framework');
    });

    it('should support short ID format', async () => {
      const uri = await helper.createTestFramework('Short ID Test');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body.result.label).toBe('Short ID Test');
    });

    it('should support namespace format (esg:id)', async () => {
      const uri = await helper.createTestFramework('Namespace Test');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/esg:${shortId}`)
        .expect(200);

      expect(response.body.result.label).toBe('Namespace Test');
    });
  });
});
