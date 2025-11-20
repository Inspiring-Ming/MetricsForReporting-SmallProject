import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework Categories API', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanCategories();
  });

  describe('GET /api/kg/frameworks/:id/categories', () => {
    it('should get categories for framework with categories', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [cat1, cat2]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/categories`)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.result[0]).toHaveProperty('iri');
      expect(response.body.result[0]).toHaveProperty('label');
    });

    it('should return empty array for framework without categories', async () => {
      const framework = await helper.createTestFramework('Empty Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/categories`)
        .expect(200);

      expect(response.body.result).toEqual([]);
    });

    it('should sort categories by label', async () => {
      const catZ = await helper.createTestCategory('Zebra Category');
      const catA = await helper.createTestCategory('Alpha Category');
      const catB = await helper.createTestCategory('Beta Category');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [catZ, catA, catB]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}/categories`)
        .expect(200);

      expect(response.body.result[0].label).toBe('Alpha Category');
      expect(response.body.result[2].label).toBe('Zebra Category');
    });

    it('should return 404 for non-existent framework', async () => {
      const response = await request(app)
        .get(`${baseUrl}/nonexistent/categories`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/kg/frameworks/:id/categories', () => {
    it('should add single category to framework', async () => {
      const category = await helper.createTestCategory('New Category');
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [category] })
        .expect(201);

      expect(response.body).toHaveProperty('framework_uri');
      expect(response.body).toHaveProperty('added_categories');
      expect(response.body.added_categories).toHaveLength(1);
      expect(response.body).toHaveProperty('added_at');
    });

    it('should add multiple categories to framework', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const cat3 = await helper.createTestCategory('Category 3');
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [cat1, cat2, cat3] })
        .expect(201);

      expect(response.body.added_categories).toHaveLength(3);

      const detail = await helper.getFrameworkDetail(framework);
      expect(detail.categories).toHaveLength(3);
    });

    it('should verify categories are added in database', async () => {
      const category = await helper.createTestCategory('Verified Category');
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [category] })
        .expect(201);

      const categories = await helper.getFrameworkCategories(framework);
      expect(categories).toContain(category);
    });

    it('should handle duplicate category addition (idempotent)', async () => {
      const category = await helper.createTestCategory('Duplicate Category');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [category] })
        .expect(201);

      const detail = await helper.getFrameworkDetail(framework);
      expect(detail.categories.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent framework', async () => {
      const category = await helper.createTestCategory('Test Category');

      const response = await request(app)
        .post(`${baseUrl}/nonexistent/categories`)
        .send({ categories: [category] })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid category URI', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: ['http://example.org/esg#nonexistent'] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when categories field is missing', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when categories is empty array', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/kg/frameworks/:id/categories/:cid', () => {
    it('should remove category from framework', async () => {
      const category = await helper.createTestCategory('To Remove');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];
      const catShortId = category.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}/categories/${catShortId}`)
        .expect(200);

      expect(response.body).toHaveProperty('framework_uri');
      expect(response.body).toHaveProperty('removed_category_uri');
      expect(response.body).toHaveProperty('removed_at');
    });

    it('should verify category is removed from database', async () => {
      const category = await helper.createTestCategory('To Remove');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];
      const catShortId = category.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}/categories/${catShortId}`)
        .expect(200);

      const categories = await helper.getFrameworkCategories(framework);
      expect(categories).not.toContain(category);
    });

    it('should not delete category entity itself', async () => {
      const category = await helper.createTestCategory('Persistent Category');
      const framework = await helper.createTestFramework('Test Framework');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];
      const catShortId = category.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}/categories/${catShortId}`)
        .expect(200);

      const categoryExists = await helper.categoryExists(category);
      expect(categoryExists).toBe(true);
    });

    it('should handle removal of non-existent category gracefully', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      const shortId = framework.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}/categories/nonexistent`)
        .expect(200);
    });

    it('should return 404 for non-existent framework', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/nonexistent/categories/somecategory`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full lifecycle: create -> add -> list -> remove', async () => {
      const category = await helper.createTestCategory('Lifecycle Category');
      const framework = await helper.createTestFramework('Lifecycle Framework');
      const shortId = framework.split('#')[1];
      const catShortId = category.split('#')[1];

      await request(app)
        .post(`${baseUrl}/${shortId}/categories`)
        .send({ categories: [category] })
        .expect(201);

      let response = await request(app)
        .get(`${baseUrl}/${shortId}/categories`)
        .expect(200);
      expect(response.body.result).toHaveLength(1);

      await request(app)
        .delete(`${baseUrl}/${shortId}/categories/${catShortId}`)
        .expect(200);

      response = await request(app)
        .get(`${baseUrl}/${shortId}/categories`)
        .expect(200);
      expect(response.body.result).toHaveLength(0);
    });

    it('should support multiple frameworks sharing same category', async () => {
      const category = await helper.createTestCategory('Shared Category');
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      
      await helper.addCategoriesToFramework(fw1, [category]);
      await helper.addCategoriesToFramework(fw2, [category]);

      const fw1Categories = await helper.getFrameworkCategories(fw1);
      const fw2Categories = await helper.getFrameworkCategories(fw2);

      expect(fw1Categories).toContain(category);
      expect(fw2Categories).toContain(category);
    });

    it('should not affect category when deleting one framework', async () => {
      const category = await helper.createTestCategory('Shared Category');
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      
      await helper.addCategoriesToFramework(fw1, [category]);
      await helper.addCategoriesToFramework(fw2, [category]);

      const fw1ShortId = fw1.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${fw1ShortId}`)
        .expect(200);

      const categoryExists = await helper.categoryExists(category);
      expect(categoryExists).toBe(true);

      const fw2Categories = await helper.getFrameworkCategories(fw2);
      expect(fw2Categories).toContain(category);
    });
  });
});
