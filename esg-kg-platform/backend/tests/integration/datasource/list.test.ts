import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - GET /api/kg/datasources (List)', () => {
  beforeEach(async () => {
    // Clean up before each test
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Basic Functionality', () => {
    it('should return empty list when no datasources exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(20);
      expect(response.body.totalPages).toBe(0);
    });

    it('should return all datasources when data exists', async () => {
      // Create test datasources
      await helper.createTestDatasource('Carbon Emissions Dataset');
      await helper.createTestDatasource('Water Usage Dataset');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.totalPages).toBe(1);
    });

    it('should return correct data structure for each datasource', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:FinancialDataset a esg:DataSource ;
                               rdfs:label "Financial Dataset" ;
                               esg:hasFileName "financial_data.csv" ;
                               esg:hasDescription "Company financial information" ;
                               esg:hasCoverage "2020-2024" ;
                               esg:hasRecordCount 1500 .
        }
      `);

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const datasource = response.body.result[0];
      expect(datasource).toHaveProperty('iri');
      expect(datasource).toHaveProperty('label', 'Financial Dataset');
      expect(datasource).toHaveProperty('fileName', 'financial_data.csv');
      expect(datasource).toHaveProperty('description', 'Company financial information');
      expect(datasource).toHaveProperty('coverage', '2020-2024');
      expect(datasource).toHaveProperty('recordCount', 1500);
    });

    it('should handle datasources with minimal fields', async () => {
      await helper.createTestDatasource('Minimal Dataset');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const datasource = response.body.result[0];
      expect(datasource).toHaveProperty('iri');
      expect(datasource).toHaveProperty('label', 'Minimal Dataset');
      expect(datasource.fileName).toBeUndefined();
      expect(datasource.description).toBeUndefined();
      expect(datasource.coverage).toBeUndefined();
      expect(datasource.recordCount).toBeUndefined();
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 25 test datasources
      for (let i = 1; i <= 25; i++) {
        await helper.createTestDatasource(`Dataset ${i.toString().padStart(2, '0')}`);
      }
    });

    it('should return first page by default', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(20);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(20);
      expect(response.body.total).toBe(25);
      expect(response.body.totalPages).toBe(2);
    });

    it('should return second page when requested', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=2`)
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.page).toBe(2);
      expect(response.body.total).toBe(25);
    });

    it('should respect custom page size', async () => {
      const response = await request(app)
        .get(`${baseUrl}?size=10`)
        .expect(200);

      expect(response.body.result).toHaveLength(10);
      expect(response.body.size).toBe(10);
      expect(response.body.totalPages).toBe(3);
    });

    it('should handle large page size', async () => {
      const response = await request(app)
        .get(`${baseUrl}?size=100`)
        .expect(200);

      expect(response.body.result).toHaveLength(25);
      expect(response.body.size).toBe(100);
      expect(response.body.totalPages).toBe(1);
    });

    it('should return empty array for page beyond total', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=10`)
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.page).toBe(10);
      expect(response.body.total).toBe(25);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:CarbonData a esg:DataSource ;
                         rdfs:label "Carbon Emissions Dataset" ;
                         esg:hasFileName "carbon_emissions.csv" .
                         
          esg:WaterData a esg:DataSource ;
                        rdfs:label "Water Usage Dataset" ;
                        esg:hasFileName "water_usage.csv" .
                        
          esg:EnergyData a esg:DataSource ;
                         rdfs:label "Energy Consumption Dataset" ;
                         esg:hasFileName "energy_data.xlsx" .
        }
      `);
    });

    it('should search by label (case insensitive)', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=carbon`)
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toContain('Carbon');
    });

    it('should search by fileName', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=csv`)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.result.every((ds: any) => ds.fileName?.includes('.csv'))).toBe(true);
    });

    it('should search with partial match', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=data`)
        .expect(200);

      expect(response.body.result).toHaveLength(3);
    });

    it('should return empty for no matches', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=nonexistent`)
        .expect(200);

      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should handle special characters in search', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=energy_data`)
        .expect(200);

      expect(response.body.result).toHaveLength(1);
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:AlphaData a esg:DataSource ;
                        rdfs:label "Alpha Dataset" ;
                        esg:hasFileName "a_file.csv" ;
                        esg:hasRecordCount 100 .
                        
          esg:BetaData a esg:DataSource ;
                       rdfs:label "Beta Dataset" ;
                       esg:hasFileName "b_file.csv" ;
                       esg:hasRecordCount 500 .
                       
          esg:GammaData a esg:DataSource ;
                        rdfs:label "Gamma Dataset" ;
                        esg:hasFileName "c_file.csv" ;
                        esg:hasRecordCount 300 .
        }
      `);
    });

    it('should sort by label ascending by default', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result[0].label).toBe('Alpha Dataset');
      expect(response.body.result[1].label).toBe('Beta Dataset');
      expect(response.body.result[2].label).toBe('Gamma Dataset');
    });

    it('should sort by label descending', async () => {
      const response = await request(app)
        .get(`${baseUrl}?sort=label&order=desc`)
        .expect(200);

      expect(response.body.result[0].label).toBe('Gamma Dataset');
      expect(response.body.result[1].label).toBe('Beta Dataset');
      expect(response.body.result[2].label).toBe('Alpha Dataset');
    });

    it('should sort by fileName ascending', async () => {
      const response = await request(app)
        .get(`${baseUrl}?sort=fileName&order=asc`)
        .expect(200);

      expect(response.body.result[0].fileName).toBe('a_file.csv');
      expect(response.body.result[1].fileName).toBe('b_file.csv');
      expect(response.body.result[2].fileName).toBe('c_file.csv');
    });

    it('should sort by recordCount descending', async () => {
      const response = await request(app)
        .get(`${baseUrl}?sort=recordCount&order=desc`)
        .expect(200);

      expect(response.body.result[0].recordCount).toBe(500);
      expect(response.body.result[1].recordCount).toBe(300);
      expect(response.body.result[2].recordCount).toBe(100);
    });

    it('should sort by recordCount ascending', async () => {
      const response = await request(app)
        .get(`${baseUrl}?sort=recordCount&order=asc`)
        .expect(200);

      expect(response.body.result[0].recordCount).toBe(100);
      expect(response.body.result[1].recordCount).toBe(300);
      expect(response.body.result[2].recordCount).toBe(500);
    });
  });

  describe('Validation', () => {
    it('should reject invalid page number', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=0`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Page must be a positive integer');
    });

    it('should reject negative page number', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=-1`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid size', async () => {
      const response = await request(app)
        .get(`${baseUrl}?size=0`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Size must be between 1 and 100');
    });

    it('should reject size exceeding maximum', async () => {
      const response = await request(app)
        .get(`${baseUrl}?size=101`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid sort field', async () => {
      const response = await request(app)
        .get(`${baseUrl}?sort=invalid`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Sort must be one of');
    });

    it('should reject invalid order value', async () => {
      const response = await request(app)
        .get(`${baseUrl}?order=invalid`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Order must be either "asc" or "desc"');
    });

    it('should handle non-numeric page', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=abc`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Combined Filters', () => {
    beforeEach(async () => {
      // Create diverse test data
      for (let i = 1; i <= 30; i++) {
        const label = i % 2 === 0 ? `Carbon Dataset ${i}` : `Water Dataset ${i}`;
        await helper.executeSparql(`
          PREFIX esg: <http://example.org/esg#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          
          INSERT DATA {
            esg:Dataset${i} a esg:DataSource ;
                           rdfs:label "${label}" ;
                           esg:hasRecordCount ${i * 10} .
          }
        `);
      }
    });

    it('should combine search with pagination', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=carbon&page=1&size=5`)
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBe(15);
      expect(response.body.result.every((ds: any) => ds.label.includes('Carbon'))).toBe(true);
    });

    it('should combine search with sorting', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=water&sort=recordCount&order=desc`)
        .expect(200);

      expect(response.body.result.every((ds: any) => ds.label.includes('Water'))).toBe(true);
      
      // Verify descending order by recordCount
      for (let i = 1; i < response.body.result.length; i++) {
        expect(response.body.result[i - 1].recordCount).toBeGreaterThanOrEqual(
          response.body.result[i].recordCount
        );
      }
    });

    it('should combine all filters together', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=carbon&page=2&size=3&sort=label&order=asc`)
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.page).toBe(2);
      expect(response.body.result.every((ds: any) => ds.label.includes('Carbon'))).toBe(true);
    });
  });

  describe('Response Structure', () => {
    it('should have correct pagination metadata', async () => {
      await helper.createTestDatasource('Test Dataset');

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPages');
      
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.size).toBe('number');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
    });

    it('should calculate totalPages correctly', async () => {
      // Create 25 datasources
      for (let i = 1; i <= 25; i++) {
        await helper.createTestDatasource(`Dataset ${i}`);
      }

      const response = await request(app)
        .get(`${baseUrl}?size=10`)
        .expect(200);

      expect(response.body.totalPages).toBe(3);
    });
  });
});
