import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework API - DELETE /api/kg/frameworks/:id', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
    await helper.cleanCategories();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
    await helper.cleanCategories();
  });

  describe('Normal Deletion', () => {
    it('should delete a framework without associations', async () => {
      const iri = await helper.createTestFramework('To Be Deleted');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        deleted: true,
        iri: expect.any(String),
        deleted_at: expect.any(String)
      });

      const exists = await helper.frameworkExists(iri);
      expect(exists).toBe(false);
    });

    it('should return 404 when deleting non-existent framework', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/nonexistent`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle deletion by full URI format', async () => {
      const iri = await helper.createTestFramework('Test Framework');
      const encodedUri = encodeURIComponent(iri);

      await request(app)
        .delete(`${baseUrl}/${encodedUri}`)
        .expect(200);

      const exists = await helper.frameworkExists(iri);
      expect(exists).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('should return 409 when deleting framework used by industry (without force)', async () => {
      const framework = await helper.createTestFramework('Protected Framework');
      await helper.createTestIndustry('Test Industry', 'Desc', [framework]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'DELETE_CONFLICT',
        message: expect.stringContaining('referenced by industry')
      });

      const exists = await helper.frameworkExists(framework);
      expect(exists).toBe(true);
    });

    it('should list associated industries in conflict error', async () => {
      const framework = await helper.createTestFramework('Protected Framework');
      await helper.createTestIndustry('Industry 1', 'Desc', [framework]);
      await helper.createTestIndustry('Industry 2', 'Desc', [framework]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(409);

      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Force Delete', () => {
    it('should delete framework with industry associations when force=true', async () => {
      const framework = await helper.createTestFramework('Force Delete Framework');
      await helper.createTestIndustry('Test Industry', 'Desc', [framework]);
      const shortId = framework.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .query({ force: true })
        .expect(200);

      expect(response.body.deleted).toBe(true);

      const exists = await helper.frameworkExists(framework);
      expect(exists).toBe(false);
    });

    it('should clean up industry reportsUsing relationships', async () => {
      const framework = await helper.createTestFramework('Framework to Force Delete');
      const industryUri = await helper.createTestIndustry('Test Industry', 'Desc', [framework]);
      const shortId = framework.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .query({ force: true })
        .expect(200);

      const industryDetail = await helper.getIndustryDetail(industryUri);
      expect(industryDetail.frameworks).toHaveLength(0);
    });
  });

  describe('Cascade Deletion', () => {
    it('should delete esg:includes relationships with categories', async () => {
      const category = await helper.createTestCategory('Test Category');
      const framework = await helper.createTestFramework('Framework with Category');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const categories = await helper.getFrameworkCategories(framework);
      expect(categories).toHaveLength(0);
    });

    it('should not delete category entities themselves', async () => {
      const category = await helper.createTestCategory('Test Category');
      const framework = await helper.createTestFramework('Framework with Category');
      await helper.addCategoriesToFramework(framework, [category]);
      const shortId = framework.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const categoryExists = await helper.categoryExists(category);
      expect(categoryExists).toBe(true);
    });

    it('should delete all framework relationships', async () => {
      const cat1 = await helper.createTestCategory('Category 1');
      const cat2 = await helper.createTestCategory('Category 2');
      const framework = await helper.createTestFramework('Framework with Multiple Relations');
      await helper.addCategoriesToFramework(framework, [cat1, cat2]);
      await helper.createTestIndustry('Industry', 'Desc', [framework]);
      const shortId = framework.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .query({ force: true })
        .expect(200);

      const exists = await helper.frameworkExists(framework);
      expect(exists).toBe(false);
    });
  });

  describe('URI Format Support', () => {
    it('should delete by short ID', async () => {
      const iri = await helper.createTestFramework('Test Framework');
      const shortId = iri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const exists = await helper.frameworkExists(iri);
      expect(exists).toBe(false);
    });

    it('should delete by full URI', async () => {
      const iri = await helper.createTestFramework('Test Framework');

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      const exists = await helper.frameworkExists(iri);
      expect(exists).toBe(false);
    });

    it('should delete by namespace format', async () => {
      const iri = await helper.createTestFramework('Test Framework');
      const shortId = iri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/esg:${shortId}`)
        .expect(200);

      const exists = await helper.frameworkExists(iri);
      expect(exists).toBe(false);
    });
  });
});
