import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/categories';

describe('Category API - GET /api/kg/categories (List)', () => {
  beforeEach(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  afterAll(async () => {
    await helper.cleanCategories();
    await helper.cleanMetrics();
  });

  describe('Empty List', () => {
    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Basic Listing', () => {
    it('should return all categories', async () => {
      await helper.createTestCategory('Category 1');
      await helper.createTestCategory('Category 2');
      await helper.createTestCategory('Category 3');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.total).toBe(3);

      response.body.result.forEach((category: any) => {
        expect(category).toHaveProperty('iri');
        expect(category).toHaveProperty('label');
      });
    });

    it('should return categories sorted by label ascending by default', async () => {
      await helper.createTestCategory('Zebra Category');
      await helper.createTestCategory('Alpha Category');
      await helper.createTestCategory('Beta Category');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const labels = response.body.result.map((c: any) => c.label);
      expect(labels[0]).toBe('Alpha Category');
      expect(labels[1]).toBe('Beta Category');
      expect(labels[2]).toBe('Zebra Category');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 25; i++) {
        await helper.createTestCategory(`Category ${i.toString().padStart(2, '0')}`);
      }
    });

    it('should return first page with default size (20)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1 })
        .expect(200);

      expect(response.body.result).toHaveLength(20);
      expect(response.body.total).toBe(25);
      expect(response.body.page).toBe(1);
    });

    it('should return second page with remaining items', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 2, size: 20 })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBe(25);
      expect(response.body.page).toBe(2);
    });

    it('should handle custom page size', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(10);
      expect(response.body.total).toBe(25);
    });

    it('should return empty array for page beyond total', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 10, size: 20 })
        .expect(200);

      expect(response.body.result).toHaveLength(0);
      expect(response.body.total).toBe(25);
    });

    it('should reject invalid page number (less than 1)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 0 })
        .expect(400);

      expect(response.body.error.message).toMatch(/page must be >= 1/i);
    });

    it('should reject invalid page size (greater than 100)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 101 })
        .expect(400);

      expect(response.body.error.message).toMatch(/size must be between 1 and 100/i);
    });

    it('should reject invalid page size (less than 1)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 0 })
        .expect(400);

      expect(response.body.error.message).toMatch(/size must be between 1 and 100/i);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await helper.createTestCategory('Environmental Impact');
      await helper.createTestCategory('Social Responsibility');
      await helper.createTestCategory('Governance Practices');
      await helper.createTestCategory('Environmental Sustainability');
      await helper.createTestCategory('Data Security');
    });

    it('should search categories by label (case-insensitive)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'environmental' })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);

      const labels = response.body.result.map((c: any) => c.label);
      expect(labels).toContain('Environmental Impact');
      expect(labels).toContain('Environmental Sustainability');
    });

    it('should search categories with partial match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'secur' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toBe('Data Security');
    });

    it('should return empty array when search has no matches', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'NonExistent' })
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should handle search with special characters', async () => {
      await helper.createTestCategory('Category & Co.');

      const response = await request(app)
        .get(baseUrl)
        .query({ search: '&' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
    });
  });

  describe('Filter by Framework', () => {
    let framework1: string;
    let framework2: string;
    let category1: string;
    let category2: string;
    let category3: string;

    beforeEach(async () => {
      framework1 = await helper.createTestFramework('Framework 1');
      framework2 = await helper.createTestFramework('Framework 2');
      category1 = await helper.createTestCategory('Category 1');
      category2 = await helper.createTestCategory('Category 2');
      category3 = await helper.createTestCategory('Category 3');

      await helper.addCategoriesToFramework(framework1, [category1, category2]);
      await helper.addCategoriesToFramework(framework2, [category2, category3]);
    });

    it('should filter categories by framework', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: framework1 })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      const iris = response.body.result.map((c: any) => c.iri);
      expect(iris).toContain(category1);
      expect(iris).toContain(category2);
    });

    it('should return different results for different frameworks', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: framework2 })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      const iris = response.body.result.map((c: any) => c.iri);
      expect(iris).toContain(category2);
      expect(iris).toContain(category3);
    });

    it('should return empty array for framework with no categories', async () => {
      const emptyFramework = await helper.createTestFramework('Empty Framework');

      const response = await request(app)
        .get(baseUrl)
        .query({ framework: emptyFramework })
        .expect(200);

      expect(response.body.result).toEqual([]);
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await helper.createTestCategory('Zebra Category');
      await helper.createTestCategory('Alpha Category');
      await helper.createTestCategory('Gamma Category');
      await helper.createTestCategory('Beta Category');
    });

    it('should sort by label ascending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'asc' })
        .expect(200);

      const labels = response.body.result.map((c: any) => c.label);
      expect(labels).toEqual([
        'Alpha Category',
        'Beta Category',
        'Gamma Category',
        'Zebra Category'
      ]);
    });

    it('should sort by label descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'desc' })
        .expect(200);

      const labels = response.body.result.map((c: any) => c.label);
      expect(labels).toEqual([
        'Zebra Category',
        'Gamma Category',
        'Beta Category',
        'Alpha Category'
      ]);
    });
  });

  describe('Combined Filters', () => {
    let framework: string;
    let category1: string;
    let category2: string;

    beforeEach(async () => {
      framework = await helper.createTestFramework('Test Framework');
      category1 = await helper.createTestCategory('Environmental Data');
      category2 = await helper.createTestCategory('Social Data');
      const category3 = await helper.createTestCategory('Environmental Policy');
      const category4 = await helper.createTestCategory('Governance');

      await helper.addCategoriesToFramework(framework, [category1, category2, category3]);
    });

    it('should combine search and framework filter', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Environmental', framework })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      const labels = response.body.result.map((c: any) => c.label);
      expect(labels).toContain('Environmental Data');
      expect(labels).toContain('Environmental Policy');
    });

    it('should combine search, framework, and pagination', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({
          search: 'Data',
          framework,
          page: 1,
          size: 1
        })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.total).toBe(2);
    });

    it('should combine all filters with sorting', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({
          search: 'Environmental',
          framework,
          sort: 'label',
          order: 'desc',
          page: 1,
          size: 10
        })
        .expect(200);

      const labels = response.body.result.map((c: any) => c.label);
      expect(labels[0]).toBe('Environmental Policy');
      expect(labels[1]).toBe('Environmental Data');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search string', async () => {
      await helper.createTestCategory('Test Category');

      const response = await request(app)
        .get(baseUrl)
        .query({ search: '' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
    });

    it('should handle very long search string', async () => {
      const longSearch = 'A'.repeat(500);

      const response = await request(app)
        .get(baseUrl)
        .query({ search: longSearch })
        .expect(200);

      expect(response.body.result).toEqual([]);
    });

    it('should handle invalid framework URI', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: 'invalid-iri' })
        .expect(200);

      expect(response.body.result).toEqual([]);
    });
  });
});
