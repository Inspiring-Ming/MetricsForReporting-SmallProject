import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework API - POST /api/kg/frameworks (Create)', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  describe('Normal Creation', () => {
    it('should create framework with minimal fields (label only)', async () => {
      const newFramework = {
        label: 'Test Framework'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newFramework)
        .expect(201);

      expect(response.body).toHaveProperty('uri');
      expect(response.body).toHaveProperty('label', newFramework.label);
      expect(response.body).toHaveProperty('created_at');

      const exists = await helper.frameworkExists(response.body.uri);
      expect(exists).toBe(true);
    });

    it('should create framework with all fields', async () => {
      const category1 = await helper.createTestCategory('Test Category 1');
      const category2 = await helper.createTestCategory('Test Category 2');

      const newFramework = {
        label: 'Complete Framework',
        sourceDocument: 'https://example.com/framework.pdf',
        categories: [category1, category2]
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newFramework)
        .expect(201);

      expect(response.body.label).toBe(newFramework.label);
      expect(response.body.sourceDocument).toBe(newFramework.sourceDocument);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.label).toBe(newFramework.label);
      expect(detail.sourceDocument).toBe(newFramework.sourceDocument);
      expect(detail.categories).toHaveLength(2);
    });

    it('should return correct response structure', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'New Framework' })
        .expect(201);

      expect(response.body).toHaveProperty('uri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('created_at');
      expect(typeof response.body.uri).toBe('string');
      expect(typeof response.body.label).toBe('string');
      expect(typeof response.body.created_at).toBe('string');
    });
  });

  describe('Field Validation', () => {
    it('should reject request without label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ sourceDocument: 'https://example.com/doc.pdf' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with empty label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with whitespace-only label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject label exceeding 200 characters', async () => {
      const longLabel = 'A'.repeat(201);
      
      const response = await request(app)
        .post(baseUrl)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/200 characters/i);
    });

    it('should reject sourceDocument exceeding 500 characters', async () => {
      const longSource = 'https://example.com/' + 'A'.repeat(500);
      
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Test Framework',
          sourceDocument: longSource
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/500 characters/i);
    });

    it('should reject invalid category URI', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Test Framework',
          categories: ['http://example.org/esg#nonexistent']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Uniqueness Validation', () => {
    it('should reject duplicate label', async () => {
      await request(app)
        .post(baseUrl)
        .send({ label: 'Unique Framework' })
        .expect(201);

      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Unique Framework' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/already exists/i);
    });

    it('should allow creating same label after deletion', async () => {
      const response1 = await request(app)
        .post(baseUrl)
        .send({ label: 'Reusable Name' })
        .expect(201);

      const shortId = response1.body.uri.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const response2 = await request(app)
        .post(baseUrl)
        .send({ label: 'Reusable Name' })
        .expect(201);

      expect(response2.body.label).toBe('Reusable Name');
    });
  });

  describe('Special Characters', () => {
    it('should handle label with quotes', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Framework "Test" Name' })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.label).toBe('Framework "Test" Name');
    });

    it('should handle label with special characters', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Framework: Test & Sample' })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.label).toBe('Framework: Test & Sample');
    });

    it('should handle Unicode characters', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '测试框架 中文' })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.label).toBe('测试框架 中文');
    });

    it('should handle emoji in label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Framework 🎯 Test' })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.label).toBe('Framework 🎯 Test');
    });
  });

  describe('Categories Association', () => {
    it('should create framework with single category', async () => {
      const category = await helper.createTestCategory('Test Category');

      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Framework with Category',
          categories: [category]
        })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.categories).toHaveLength(1);
      expect(detail.categories[0].iri).toBe(category);
    });

    it('should create framework with multiple categories', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const cat3 = await helper.createTestCategory('Category 3');

      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Multi-Category Framework',
          categories: [cat1, cat2, cat3]
        })
        .expect(201);

      const detail = await helper.getFrameworkDetail(response.body.uri);
      expect(detail.categories).toHaveLength(3);
    });

    it('should verify categories relationship in database', async () => {
      const category = await helper.createTestCategory('Verified Category');

      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Framework to Verify',
          categories: [category]
        })
        .expect(201);

      const categories = await helper.getFrameworkCategories(response.body.uri);
      expect(categories).toContain(category);
    });
  });
});
