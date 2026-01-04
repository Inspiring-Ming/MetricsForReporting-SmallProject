import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/frameworks';

describe('Framework API - GET /api/kg/frameworks (List)', () => {
  beforeEach(async () => {
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  describe('Basic Functionality', () => {
    it('should return empty list when no frameworks exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return all frameworks when data exists', async () => {
      await helper.createTestFramework('Test Framework 1');
      await helper.createTestFramework('Test Framework 2');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.result[0]).toHaveProperty('iri');
      expect(response.body.result[0]).toHaveProperty('label');
    });

    it('should return correct data structure for each framework', async () => {
      await helper.createTestFramework('SASB Framework');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const framework = response.body.result[0];
      expect(framework).toHaveProperty('iri');
      expect(framework).toHaveProperty('label', 'SASB Framework');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 15; i++) {
        await helper.createTestFramework(`Framework ${i.toString().padStart(2, '0')}`);
      }
    });

    it('should use default pagination (page=1, size=10)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(10);
      expect(response.body.result.length).toBeLessThanOrEqual(10);
      expect(response.body.total).toBe(15);
    });

    it('should support custom pagination', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 2, size: 5 })
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.size).toBe(5);
      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBe(15);
    });

    it('should return correct data on last page with fewer items', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 2, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBe(15);
    });

    it('should return empty array when page exceeds total pages', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 10, size: 10 })
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(15);
    });

    it('should handle size parameter correctly', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 3 })
        .expect(200);

      expect(response.body.result).toHaveLength(3);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await helper.createTestFramework('SASB Standards');
      await helper.createTestFramework('GRI Framework');
      await helper.createTestFramework('TCFD Recommendations');
      await helper.createTestFramework('CDP Climate');
    });

    it('should search by label (case insensitive)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'sasb' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      expect(response.body.result[0].label).toContain('SASB');
    });

    it('should return empty for non-existent search', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'NonExistent' })
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return multiple matching results', async () => {
      await helper.createTestFramework('Framework Alpha');
      await helper.createTestFramework('Framework Beta');

      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Framework' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
    });

    it('should search with partial match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'TC' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toBe('TCFD Recommendations');
    });
  });

  describe('Industry Filter', () => {
    beforeEach(async () => {
      const fw1 = await helper.createTestFramework('Framework A');
      const fw2 = await helper.createTestFramework('Framework B');
      const fw3 = await helper.createTestFramework('Framework C');

      await helper.createTestIndustry('Technology', 'Tech sector', [fw1, fw2]);
      await helper.createTestIndustry('Healthcare', 'Health sector', [fw2, fw3]);
    });

    it('should filter by industry', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry: 'Technology' })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
    });

    it('should return empty for industry with no frameworks', async () => {
      await helper.createTestIndustry('Empty Industry', 'No frameworks');

      const response = await request(app)
        .get(baseUrl)
        .query({ industry: 'Empty Industry' })
        .expect(200);

      expect(response.body.result).toEqual([]);
    });

    it('should filter industry with multiple frameworks', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry: 'Healthcare' })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await helper.createTestFramework('Zebra Framework');
      await helper.createTestFramework('Alpha Framework');
      await helper.createTestFramework('Beta Framework');
    });

    it('should sort by label ascending (default)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'asc' })
        .expect(200);

      expect(response.body.result[0].label).toBe('Alpha Framework');
      expect(response.body.result[2].label).toBe('Zebra Framework');
    });

    it('should sort by label descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'desc' })
        .expect(200);

      expect(response.body.result[0].label).toBe('Zebra Framework');
      expect(response.body.result[2].label).toBe('Alpha Framework');
    });
  });

  describe('Combined Parameters', () => {
    beforeEach(async () => {
      const fw1 = await helper.createTestFramework('SASB Industry Framework');
      const fw2 = await helper.createTestFramework('SASB General Framework');
      const fw3 = await helper.createTestFramework('GRI Framework');

      await helper.createTestIndustry('Finance', 'Financial sector', [fw1, fw2, fw3]);
    });

    it('should combine pagination, search, and filter', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ 
          page: 1,
          size: 5,
          search: 'SASB',
          industry: 'Finance'
        })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should verify total count with filters', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ 
          search: 'Framework',
          industry: 'Finance'
        })
        .expect(200);

      expect(response.body.total).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid page number', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid size (too small)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid size (too large)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 101 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle large dataset', async () => {
      for (let i = 1; i <= 100; i++) {
        await helper.createTestFramework(`Framework ${i}`);
      }

      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, size: 50 })
        .expect(200);

      expect(response.body.result).toHaveLength(50);
      expect(response.body.total).toBe(100);
    });
  });
});
