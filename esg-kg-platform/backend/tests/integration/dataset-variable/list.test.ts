import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - GET /api/kg/dataset-variables (List)', () => {
  beforeEach(async () => {
    // Clean up before each test
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Basic Functionality', () => {
    it('should return empty list when no dataset variables exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return all dataset variables when data exists', async () => {
      // Create test data
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:TestVariable1 a esg:DatasetVariable ;
                            rdfs:label "TEST_VARIABLE_1" ;
                            esg:hasConfidenceScore 100 ;
                            esg:alignmentReason "Test alignment 1" .
                            
          esg:TestVariable2 a esg:DatasetVariable ;
                            rdfs:label "TEST_VARIABLE_2" ;
                            esg:hasConfidenceScore 95 ;
                            esg:alignmentReason "Test alignment 2" .
                            
          esg:TestDataSource a esg:DataSource ;
                             rdfs:label "Test Data Source" .
                             
          esg:TestVariable1 esg:sourceFrom esg:TestDataSource .
          esg:TestVariable2 esg:sourceFrom esg:TestDataSource .
        }
      `);

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.result).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.result[0]).toHaveProperty('iri');
      expect(response.body.result[0]).toHaveProperty('label');
      expect(response.body.result[0]).toHaveProperty('sources');
    });

    it('should return correct data structure for each variable', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:PolicyHoldersVar a esg:DatasetVariable ;
                               rdfs:label "POLICY_HOLDERS" ;
                               esg:hasConfidenceScore 100 ;
                               esg:alignmentReason "Direct mapping" ;
                               esg:isUnitCompatible "Yes" .
                               
          esg:FinancialDataSource a esg:DataSource ;
                                  rdfs:label "Financial Dataset" ;
                                  esg:hasRecordCount 1500 .
                                  
          esg:PolicyHoldersVar esg:sourceFrom esg:FinancialDataSource .
        }
      `);

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      const variable = response.body.result[0];
      expect(variable).toHaveProperty('iri');
      expect(variable).toHaveProperty('label', 'POLICY_HOLDERS');
      expect(variable).toHaveProperty('confidenceScore', 100);
      expect(variable).toHaveProperty('alignmentReason', 'Direct mapping');
      expect(variable).toHaveProperty('isUnitCompatible', 'Yes');
      expect(variable).toHaveProperty('sources');
      expect(variable.sources).toHaveLength(1);
      expect(variable.sources[0]).toHaveProperty('label', 'Financial Dataset');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 25 test variables
      let insertQuery = `
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:TestDataSource a esg:DataSource ;
                             rdfs:label "Test Data Source" .
      `;
      
      for (let i = 1; i <= 25; i++) {
        const paddedNum = i.toString().padStart(2, '0');
        insertQuery += `
          esg:Variable${paddedNum} a esg:DatasetVariable ;
                                    rdfs:label "VARIABLE_${paddedNum}" ;
                                    esg:hasConfidenceScore ${50 + i} ;
                                    esg:sourceFrom esg:TestDataSource .
        `;
      }
      
      insertQuery += `}`;
      await helper.executeSparql(insertQuery);
    });

    it('should use default pagination (page=1, size=20)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(20);
      expect(response.body.result.length).toBeLessThanOrEqual(20);
      expect(response.body.total).toBe(25);
      expect(response.body.totalPages).toBe(2);
    });

    it('should support custom pagination', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 2, size: 10 })
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.size).toBe(10);
      expect(response.body.result).toHaveLength(10);
      expect(response.body.total).toBe(25);
    });

    it('should return correct data on last page', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 3, size: 10 })
        .expect(200);

      expect(response.body.result).toHaveLength(5);
      expect(response.body.total).toBe(25);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:WaterConsumption a esg:DatasetVariable ;
                               rdfs:label "WATER_CONSUMPTION" ;
                               esg:hasConfidenceScore 95 .
                               
          esg:EnergyUsage a esg:DatasetVariable ;
                          rdfs:label "ENERGY_USAGE" ;
                          esg:hasConfidenceScore 90 .
                          
          esg:GHGEmissions a esg:DatasetVariable ;
                           rdfs:label "GHG_EMISSIONS" ;
                           esg:hasConfidenceScore 100 .
                           
          esg:WasteRecycled a esg:DatasetVariable ;
                            rdfs:label "WASTE_RECYCLED" ;
                            esg:hasConfidenceScore 85 .
        }
      `);
    });

    it('should find variables by exact match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'WATER_CONSUMPTION' })
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.result[0].label).toBe('WATER_CONSUMPTION');
    });

    it('should find variables by partial match', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'WATER' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      const labels = response.body.result.map((r: any) => r.label);
      expect(labels.some((l: string) => l.includes('WATER'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ search: 'water' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:HighConfidenceVar a esg:DatasetVariable ;
                                rdfs:label "HIGH_CONFIDENCE" ;
                                esg:hasConfidenceScore 95 ;
                                esg:isUnitCompatible "Yes" .
                                
          esg:LowConfidenceVar a esg:DatasetVariable ;
                               rdfs:label "LOW_CONFIDENCE" ;
                               esg:hasConfidenceScore 50 ;
                               esg:isUnitCompatible "No" .
        }
      `);
    });

    it('should filter by minimum confidence score', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ minConfidenceScore: 90 })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      response.body.result.forEach((v: any) => {
        expect(v.confidenceScore).toBeGreaterThanOrEqual(90);
      });
    });

    it('should filter by unit compatibility', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ isUnitCompatible: 'Yes' })
        .expect(200);

      expect(response.body.result.length).toBeGreaterThan(0);
      response.body.result.forEach((v: any) => {
        expect(v.isUnitCompatible).toBe('Yes');
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:VarA a esg:DatasetVariable ;
                   rdfs:label "ALPHA_VAR" ;
                   esg:hasConfidenceScore 80 .
                   
          esg:VarB a esg:DatasetVariable ;
                   rdfs:label "BETA_VAR" ;
                   esg:hasConfidenceScore 95 .
                   
          esg:VarC a esg:DatasetVariable ;
                   rdfs:label "CHARLIE_VAR" ;
                   esg:hasConfidenceScore 70 .
        }
      `);
    });

    it('should sort by label ascending (default)', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'label', order: 'asc' })
        .expect(200);

      const labels = response.body.result.map((r: any) => r.label);
      const sortedLabels = [...labels].sort();
      expect(labels).toEqual(sortedLabels);
    });

    it('should sort by confidence score descending', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ sort: 'confidenceScore', order: 'desc' })
        .expect(200);

      const scores = response.body.result.map((r: any) => r.confidenceScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    });
  });

  describe('Validation', () => {
    it('should reject invalid page number', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ page: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid size', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ size: 101 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid confidence score', async () => {
      const response = await request(app)
        .get(baseUrl)
        .query({ minConfidenceScore: 150 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
