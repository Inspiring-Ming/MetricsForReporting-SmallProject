import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/industries';

describe('Industry API - GET /api/kg/industries (List)', () => {
  beforeEach(async () => {
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanIndustries();
  });

  describe('Basic Functionality', () => {
    it('should return empty list when no industries exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return all industries when data exists', async () => {
      await helper.createTestIndustry('Test Industry 1', 'Description 1');
      await helper.createTestIndustry('Test Industry 2', 'Description 2');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.result[0]).toHaveProperty('iri');
      expect(response.body.result[0]).toHaveProperty('label');
    });

    it('should return correct data structure for each industry', async () => {
      await helper.createTestIndustry('Tech Industry', 'Technology sector');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const industry = response.body.result[0];
      expect(industry).toHaveProperty('iri');
      expect(industry).toHaveProperty('label', 'Tech Industry');
      expect(industry).toHaveProperty('description', 'Technology sector');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 15 test industries
      for (let i = 1; i <= 15; i++) {
        await helper.createTestIndustry(`Industry ${i.toString().padStart(2, '0')}`);
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
  });

  describe('Search', () => {
    beforeEach(async () => {
      await helper.createTestIndustry('Commercial Banks', 'Banking sector');
      await helper.createTestIndustry('Technology Sector', 'Tech companies');
      await helper.createTestIndustry('Semiconductors', 'Chip manufactiring');
      await helper.createTestIndustry('Oil & Gas', 'Energy sector');
    });

    it('should find industries by exact match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Commercial Banks' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toBe('Commercial Banks');
    });

    it('should find industries by partial match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'tech' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      const labels = response.body.result.map((r: any) => r.label);
      expect(labels.some((l: string) => l.toLowerCase().includes('tech'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'TECHNOLOGY' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      expect(response.body.result[0].label).toContain('Technology');
    });

    it('should return empty array when no match found', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'NonExistentIndustry' })
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should handle special characters in search', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Oil & Gas' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toBe('Oil & Gas');
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await helper.createTestIndustry('Zebra Industry');
      await helper.createTestIndustry('Alpha Industry');
      await helper.createTestIndustry('Beta Industry');
    });

    it('should sort by label ascending by default', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const labels = response.body.result.map((r: any) => r.label);
      expect(labels[0]).toBe('Alpha Industry');
      expect(labels[labels.length - 1]).toBe('Zebra Industry');
    });

    it('should sort by label descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'desc' })
        .expect(200);

      const labels = response.body.result.map((r: any) => r.label);
      expect(labels[0]).toBe('Zebra Industry');
      expect(labels[labels.length - 1]).toBe('Alpha Industry');
    });
  });

  describe('Combined Queries', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 20; i++) {
        const label = i % 2 === 0 ? `Tech Company ${i}` : `Banking Corp ${i}`;
        await helper.createTestIndustry(label);
      }
    });

    it('should support pagination with search', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Tech', page: 1, size: 5 })
        .expect(200);

      expect(response.body.result.length).toBeLessThanOrEqual(5);
      expect(response.body.result.every((r: any) => r.label.includes('Tech'))).toBe(true);
    });

    it('should support pagination with sorting', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, size: 5, sort: 'label', order: 'desc' })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      const labels = response.body.result.map((r: any) => r.label);
      // Check descending order
      for (let i = 0; i < labels.length - 1; i++) {
        expect(labels[i] >= labels[i + 1]).toBe(true);
      }
    });

    it('should support all parameters combined', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'Banking', page: 1, size: 3, sort: 'label', order: 'asc' })
        .expect(200);

      expect(response.body.result.length).toBeLessThanOrEqual(3);
      expect(response.body.result.every((r: any) => r.label.includes('Banking'))).toBe(true);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle invalid page number (0)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid page number (negative)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid size (0)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid size (exceeds maximum)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 101 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
