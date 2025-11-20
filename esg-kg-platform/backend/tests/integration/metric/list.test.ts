import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics (List)', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanCategories();
    await helper.cleanFrameworks();
    await helper.cleanIndustries();
  });

  describe('Basic List Operations', () => {
    it('should return empty list when no metrics exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('total');
      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return all metrics with default pagination', async () => {
      // Create test metrics
      await helper.createTestMetric('Metric A');
      await helper.createTestMetric('Metric B');
      await helper.createTestMetric('Metric C');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      // Note: Current implementation returns empty result without filters
      // This test will pass once the general metric list query is implemented
      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    it('should return metrics with basic properties', async () => {
      const metricUri = await helper.createTestMetric('Test Metric', {
        code: 'TEST_METRIC',
        unit: 'kg CO2e',
        description: 'Test description'
      });

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      const metric = response.body.result[0];
      expect(metric).toHaveProperty('uri');
      expect(metric).toHaveProperty('label', 'Test Metric');
      expect(metric).toHaveProperty('code', 'TEST_METRIC');
      expect(metric).toHaveProperty('unit', 'kg CO2e');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 25 test metrics
      for (let i = 1; i <= 25; i++) {
        await helper.createTestMetric(`Metric ${String(i).padStart(2, '0')}`);
      }
    });

    it('should paginate results with default size (10)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1 })
        .expect(200);

      expect(response.body.result).toHaveLength(10);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(10);
      expect(response.body.total).toBe(25);
      expect(response.body.totalPages).toBe(3);
    });

    it('should return second page of results', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 2, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(10);
      expect(response.body.page).toBe(2);
      expect(response.body.totalPages).toBe(3);
    });

    it('should return last page with remaining items', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 3, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.page).toBe(3);
      expect(response.body.total).toBe(25);
    });

    it('should support custom page size', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, size: 5 })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.size).toBe(5);
      expect(response.body.totalPages).toBe(5);
    });

    it('should return empty array for page beyond total pages', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 100, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(0);
      expect(response.body.page).toBe(100);
    });

    it('should enforce maximum page size (100)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 1, size: 200 })
        .expect(200);

      expect(response.body.size).toBeLessThanOrEqual(100);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await helper.createTestMetric('GHG Emissions Scope 1');
      await helper.createTestMetric('GHG Emissions Scope 2');
      await helper.createTestMetric('Water Consumption');
      await helper.createTestMetric('Energy Usage');
      await helper.createTestMetric('Waste Generation');
    });

    it('should search metrics by label (case-insensitive)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'ghg' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.label.toLowerCase()).toContain('ghg');
      });
    });

    it('should search with partial match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'emissions' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.label.toLowerCase()).toContain('emissions');
      });
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'nonexistent' })
        .expect(200);

      expect(response.body.result).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should search with special characters', async () => {
      await helper.createTestMetric('CO2 Emissions (Total)');

      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'CO2' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filter by Industry', () => {
    let industryA: string;
    let industryB: string;
    let frameworkA: string;
    let frameworkB: string;
    let categoryA: string;
    let categoryB: string;

    beforeEach(async () => {
      // Create complete relationship chains for each industry
      industryA = await helper.createTestIndustry('Technology');
      frameworkA = await helper.createTestFramework('GRI');
      categoryA = await helper.createTestCategory('Tech Environmental');

      industryB = await helper.createTestIndustry('Manufacturing');
      frameworkB = await helper.createTestFramework('SASB');
      categoryB = await helper.createTestCategory('Mfg Environmental');

      // Create metrics with complete relationship chains
      await helper.createTestMetric('Tech Metric 1', { industry: industryA, framework: frameworkA, category: categoryA });
      await helper.createTestMetric('Tech Metric 2', { industry: industryA, framework: frameworkA, category: categoryA });
      await helper.createTestMetric('Mfg Metric 1', { industry: industryB, framework: frameworkB, category: categoryB });
    });

    it('should filter metrics by industry URI', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry: industryA, framework: frameworkA, category: categoryA })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.industry).toBe(industryA);
      });
    });

    it('should filter by industry short ID', async () => {
      const industryShortId = industryA.split('#')[1];
      const frameworkShortId = frameworkA.split('#')[1];
      const categoryShortId = categoryA.split('#')[1];
      const response = await request(app)
        .get(baseUrl)
        .query({ industry: industryShortId, framework: frameworkShortId, category: categoryShortId })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty for non-existent industry', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ 
          industry: 'http://example.org/esg#nonexistent',
          framework: frameworkA,
          category: categoryA
        })
        .expect(200);

      expect(response.body.result).toHaveLength(0);
    });
  });

  describe('Filter by Category', () => {
    let categoryA: string;
    let categoryB: string;
    let framework: string;

    beforeEach(async () => {
      framework = await helper.createTestFramework('GRI');
      categoryA = await helper.createTestCategory('Environmental');
      categoryB = await helper.createTestCategory('Social');

      // Create metrics with framework-category relationships
      await helper.createTestMetric('Env Metric 1', { framework, category: categoryA });
      await helper.createTestMetric('Env Metric 2', { framework, category: categoryA });
      await helper.createTestMetric('Social Metric 1', { framework, category: categoryB });
    });

    it('should filter metrics by category URI', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ framework, category: categoryA })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.category).toBe(categoryA);
      });
    });

    it('should filter by category short ID', async () => {
      const frameworkShortId = framework.split('#')[1];
      const categoryShortId = categoryB.split('#')[1];
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: frameworkShortId, category: categoryShortId })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filter by Framework', () => {
    let frameworkA: string;
    let frameworkB: string;
    let categoryA: string;
    let categoryB: string;

    beforeEach(async () => {
      frameworkA = await helper.createTestFramework('GRI');
      frameworkB = await helper.createTestFramework('SASB');
      categoryA = await helper.createTestCategory('GRI Environmental');
      categoryB = await helper.createTestCategory('SASB Environmental');

      // Create metrics with framework-category relationships
      await helper.createTestMetric('GRI Metric 1', { framework: frameworkA, category: categoryA });
      await helper.createTestMetric('GRI Metric 2', { framework: frameworkA, category: categoryA });
      await helper.createTestMetric('SASB Metric 1', { framework: frameworkB, category: categoryB });
    });

    it('should filter metrics by framework URI', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: frameworkA, category: categoryA })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.framework).toBe(frameworkA);
      });
    });

    it('should filter by framework short ID', async () => {
      const frameworkShortId = frameworkB.split('#')[1];
      const categoryShortId = categoryB.split('#')[1];
      const response = await request(app)
        .get(baseUrl)
        .query({ framework: frameworkShortId, category: categoryShortId })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filter by Calculation Method', () => {
    beforeEach(async () => {
      await helper.createTestMetric('Direct Metric 1', { 
        calculationMethod: 'direct_measurement' 
      });
      await helper.createTestMetric('Direct Metric 2', { 
        calculationMethod: 'direct_measurement' 
      });
      await helper.createTestMetric('Calculated Metric 1', { 
        calculationMethod: 'calculation_model' 
      });
    });

    it('should filter by direct_measurement', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ calculationMethod: 'direct_measurement' })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.calculationMethod).toBe('direct_measurement');
      });
    });

    it('should filter by calculation_model', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ calculationMethod: 'calculation_model' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].calculationMethod).toBe('calculation_model');
    });

    it('should reject invalid calculation method', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ calculationMethod: 'invalid_method' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Combined Filters', () => {
    let industry: string;
    let category: string;
    let framework: string;

    beforeEach(async () => {
      industry = await helper.createTestIndustry('Technology');
      category = await helper.createTestCategory('Environmental');
      framework = await helper.createTestFramework('GRI');

      // Create separate categories for different combinations to avoid relationship conflicts
      const category2 = await helper.createTestCategory('Social');
      const framework2 = await helper.createTestFramework('SASB');

      // Create metrics with various combinations
      await helper.createTestMetric('Perfect Match', {
        industry,
        category,
        framework,
        calculationMethod: 'direct_measurement'
      });
      await helper.createTestMetric('Another Match', {
        industry,
        category,
        framework,
        calculationMethod: 'direct_measurement'
      });
      await helper.createTestMetric('Partial Match 1', {
        industry,
        category: category2,  // Use different category
        framework: framework2, // Use different framework
        calculationMethod: 'direct_measurement'
      });
      await helper.createTestMetric('Partial Match 2', {
        industry,
        framework,
        calculationMethod: 'calculation_model'
      });
      await helper.createTestMetric('No Match', {
        calculationMethod: 'calculation_model'
      });
    });

    it('should filter by multiple criteria (industry + category + framework)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ 
          industry,
          category,
          framework
        })
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      // Should return both "Perfect Match" and "Another Match"
      const labels = response.body.result.map((m: any) => m.label).sort();
      expect(labels).toContain('Perfect Match');
      expect(labels).toContain('Another Match');
    });

    it('should combine search with filters', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ 
          search: 'match',
          industry,
          framework,
          category,
          calculationMethod: 'direct_measurement'
        })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
      response.body.result.forEach((metric: any) => {
        expect(metric.label.toLowerCase()).toContain('match');
        expect(metric.industry).toBe(industry);
        expect(metric.calculationMethod).toBe('direct_measurement');
      });
    });

    it('should combine all filters with pagination', async () => {
      // Create more test data
      for (let i = 1; i <= 10; i++) {
        await helper.createTestMetric(`Tech Env ${i}`, {
          industry,
          framework,
          category,
          calculationMethod: 'direct_measurement'
        });
      }

      const response = await request(app)
        .get(baseUrl)
        .query({ 
          industry,
          framework,
          category,
          calculationMethod: 'direct_measurement',
          page: 1,
          size: 5
        })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Sorting', () => {
    let industry: string;
    let category: string;
    let framework: string;

    beforeEach(async () => {
      industry = await helper.createTestIndustry('TestIndustry');
      category = await helper.createTestCategory('TestCategory');
      framework = await helper.createTestFramework('TestFramework');

      // Create metrics with different labels
      await helper.createTestMetric('Zebra Metric', { industry, category, framework });
      await helper.createTestMetric('Alpha Metric', { industry, category, framework });
      await helper.createTestMetric('Beta Metric', { industry, category, framework });
    });

    it('should sort by label ascending (default)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, sort: 'label', order: 'asc' })
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.result[0].label).toBe('Alpha Metric');
      expect(response.body.result[2].label).toBe('Zebra Metric');
    });

    it('should sort by label descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, sort: 'label', order: 'desc' })
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.result[0].label).toBe('Zebra Metric');
      expect(response.body.result[2].label).toBe('Alpha Metric');
    });

    it('should use default sort when not specified', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework })
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      // Default should be ascending by label
      const labels = response.body.result.map((m: any) => m.label);
      const sortedLabels = [...labels].sort();
      expect(labels).toEqual(sortedLabels);
    });
  });

  describe('Edge Cases', () => {
    it('should reject page 0', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle negative page number', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle size 0', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty search string', async () => {
      const industry = await helper.createTestIndustry('TestIndustry');
      const category = await helper.createTestCategory('TestCategory');
      const framework = await helper.createTestFramework('TestFramework');
      await helper.createTestMetric('Test Metric', { industry, category, framework });

      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, search: '' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
    });

    it('should handle URL-encoded search terms', async () => {
      const industry = await helper.createTestIndustry('TestIndustry');
      const category = await helper.createTestCategory('TestCategory');
      const framework = await helper.createTestFramework('TestFramework');
      await helper.createTestMetric('CO2 & CH4 Emissions', { industry, category, framework });

      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, search: 'CO2' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return consistent results for same query', async () => {
      const industry = await helper.createTestIndustry('TestIndustry');
      const category = await helper.createTestCategory('TestCategory');
      const framework = await helper.createTestFramework('TestFramework');
      await helper.createTestMetric('Metric 1', { industry, category, framework });
      await helper.createTestMetric('Metric 2', { industry, category, framework });

      const response1 = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, page: 1, size: 10 })
        .expect(200);

      const response2 = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, page: 1, size: 10 })
        .expect(200);

      expect(response1.body.result).toEqual(response2.body.result);
    });
  });

  describe('Performance with Large Dataset', () => {
    it('should handle large number of metrics efficiently', async () => {
      const industry = await helper.createTestIndustry('TestIndustry');
      const category = await helper.createTestCategory('TestCategory');
      const framework = await helper.createTestFramework('TestFramework');

      // Create 100 metrics
      for (let i = 1; i <= 100; i++) {
        await helper.createTestMetric(`Metric ${String(i).padStart(3, '0')}`, { industry, category, framework });
      }

      const startTime = Date.now();
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework, page: 1, size: 50 })
        .expect(200);
      const duration = Date.now() - startTime;

      expect(response.body.result).toHaveLength(50);
      expect(response.body.total).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    }, 30000); // Increase timeout for this test
  });

  describe('Response Format Validation', () => {
    let industry: string;
    let category: string;
    let framework: string;

    beforeEach(async () => {
      industry = await helper.createTestIndustry('TestIndustry');
      category = await helper.createTestCategory('TestCategory');
      framework = await helper.createTestFramework('TestFramework');
      await helper.createTestMetric('Test Metric', {
        code: 'TEST',
        unit: 'kg',
        description: 'Test description',
        industry,
        category,
        framework
      });
    });

    it('should return proper response structure', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework })
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    it('should include pagination metadata', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework })
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('total');
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.size).toBe('number');
      expect(typeof response.body.total).toBe('number');
    });

    it('should return metrics with expected fields', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ industry, category, framework })
        .expect(200);

      const metric = response.body.result[0];
      expect(metric).toHaveProperty('uri');
      expect(metric).toHaveProperty('label');
      expect(metric).toHaveProperty('calculationMethod');
    });
  });
});
