import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - GET /api/kg/dataset-variables/:id (Detail)', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Basic Functionality', () => {
    it('should return dataset variable details by ID', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:TestVariable a esg:DatasetVariable ;
                           rdfs:label "TEST_VARIABLE" ;
                           esg:hasConfidenceScore 100 ;
                           esg:alignmentReason "Direct mapping" ;
                           esg:isUnitCompatible "Yes" .
                           
          esg:TestSource a esg:DataSource ;
                         rdfs:label "Test Source" ;
                         esg:hasRecordCount 1500 .
                         
          esg:TestVariable esg:sourceFrom esg:TestSource .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/TestVariable`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label', 'TEST_VARIABLE');
      expect(response.body.result).toHaveProperty('confidenceScore', 100);
      expect(response.body.result).toHaveProperty('alignmentReason', 'Direct mapping');
      expect(response.body.result).toHaveProperty('isUnitCompatible', 'Yes');
      expect(response.body.result).toHaveProperty('sources');
    });

    it('should include data sources in the response', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:PolicyVar a esg:DatasetVariable ;
                        rdfs:label "POLICY_VAR" .
                        
          esg:Source1 a esg:DataSource ;
                      rdfs:label "Financial Dataset" ;
                      esg:fileName "financial.csv" ;
                      esg:hasRecordCount 2000 ;
                      esg:coverage "2020-2024" .
                      
          esg:Source2 a esg:DataSource ;
                      rdfs:label "Compliance Dataset" ;
                      esg:fileName "compliance.csv" ;
                      esg:hasRecordCount 1000 .
                      
          esg:PolicyVar esg:sourceFrom esg:Source1, esg:Source2 .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/PolicyVar`)
        .expect(200);

      expect(response.body.result.sources).toHaveLength(2);
      expect(response.body.result.sources[0]).toHaveProperty('iri');
      expect(response.body.result.sources[0]).toHaveProperty('label');
      expect(response.body.result.sources[0]).toHaveProperty('fileName');
    });

    it('should include metrics that use this variable', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:WaterVar a esg:DatasetVariable ;
                       rdfs:label "WATER_CONSUMPTION" .
                       
          esg:WaterMetric a esg:Metric ;
                          rdfs:label "Total Water Consumption" ;
                          esg:hasCalculationMethod "direct_measurement" ;
                          esg:obtainedFrom esg:WaterVar .
                          
          esg:IntensityMetric a esg:Metric ;
                              rdfs:label "Water Intensity" ;
                              esg:hasCalculationMethod "calculation_model" ;
                              esg:obtainedFrom esg:WaterVar .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/WaterVar`)
        .expect(200);

      expect(response.body.result).toHaveProperty('metrics');
      expect(response.body.result.metrics).toHaveLength(2);
      expect(response.body.result.metrics[0]).toHaveProperty('iri');
      expect(response.body.result.metrics[0]).toHaveProperty('label');
      expect(response.body.result.metrics[0]).toHaveProperty('hasCalculationMethod');
    });
  });

  describe('URI Format Support', () => {
    beforeEach(async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:TestVar a esg:DatasetVariable ;
                      rdfs:label "TEST_VAR" .
        }
      `);
    });

    it('should accept simple ID format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/TestVar`)
        .expect(200);

      expect(response.body.result.label).toBe('TEST_VAR');
    });

    it('should accept namespaced ID format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/esg:TestVar`)
        .expect(200);

      expect(response.body.result.label).toBe('TEST_VAR');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent variable', async () => {
      const response = await request(app)
        .get(`${baseUrl}/NonExistentVariable`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 400 for empty ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/%20`)  // URL 编码的空格
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
