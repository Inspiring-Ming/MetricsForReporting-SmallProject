import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/datasources';

describe('Datasource API - GET /api/kg/datasources/:id (Detail)', () => {
  beforeEach(async () => {
    await helper.cleanAllData();
  });

  afterAll(async () => {
    await helper.cleanAllData();
  });

  describe('Basic Functionality', () => {
    it('should return datasource details by short ID', async () => {
      const uri = await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:TestDataSource a esg:DataSource ;
                            rdfs:label "Test Data Source" ;
                            esg:hasFileName "test_data.csv" ;
                            esg:hasDescription "Test description" ;
                            esg:hasCoverage "2020-2024" ;
                            esg:hasRecordCount 1500 .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/TestDataSource`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label', 'Test Data Source');
      expect(response.body.result).toHaveProperty('fileName', 'test_data.csv');
      expect(response.body.result).toHaveProperty('description', 'Test description');
      expect(response.body.result).toHaveProperty('coverage', '2020-2024');
      expect(response.body.result).toHaveProperty('recordCount', 1500);
    });

    it('should return datasource details by full URI', async () => {
      const uri = await helper.createTestDatasource('Carbon Dataset');

      const fullUri = uri;  // Use the actual URI returned by helper
      const encodedUri = encodeURIComponent(fullUri);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('label', 'Carbon Dataset');
    });

    it('should return datasource with minimal fields', async () => {
      const uri = await helper.createTestDatasource('Minimal Dataset');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label', 'Minimal Dataset');
      expect(response.body.result.fileName).toBeUndefined();
      expect(response.body.result.description).toBeUndefined();
    });

    it('should include variables using this datasource', async () => {
      // Create datasource
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:FinancialData a esg:DataSource ;
                           rdfs:label "Financial Dataset" .
                           
          esg:Variable1 a esg:DatasetVariable ;
                       rdfs:label "Variable 1" ;
                       esg:sourceFrom esg:FinancialData .
                       
          esg:Variable2 a esg:DatasetVariable ;
                       rdfs:label "Variable 2" ;
                       esg:sourceFrom esg:FinancialData .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/FinancialData`)
        .expect(200);

      expect(response.body.result).toHaveProperty('variables');
      expect(response.body.result.variables).toHaveLength(2);
      expect(response.body.result.variables[0]).toHaveProperty('iri');
      expect(response.body.result.variables[0]).toHaveProperty('label');
    });

    it('should return datasource without variables if none use it', async () => {
      const uri = await helper.createTestDatasource('Unused Dataset');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.variables).toBeUndefined();
    });
  });

  describe('Response Structure', () => {
    it('should have correct response structure', async () => {
      const uri = await helper.createTestDatasource('Test Dataset');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(typeof response.body.result).toBe('object');
      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label');
    });

    it('should return all optional fields when present', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:CompleteData a esg:DataSource ;
                          rdfs:label "Complete Dataset" ;
                          esg:hasFileName "complete.csv" ;
                          esg:hasDescription "Full description" ;
                          esg:hasCoverage "Global" ;
                          esg:hasRecordCount 5000 .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/CompleteData`)
        .expect(200);

      const result = response.body.result;
      expect(result.iri).toBeTruthy();
      expect(result.label).toBe('Complete Dataset');
      expect(result.fileName).toBe('complete.csv');
      expect(result.description).toBe('Full description');
      expect(result.coverage).toBe('Global');
      expect(result.recordCount).toBe(5000);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent datasource', async () => {
      const response = await request(app)
        .get(`${baseUrl}/NonExistentDataSource`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 404 for non-existent full URI', async () => {
      const fullUri = 'http://example.org/esg#NonExistent';
      const encodedUri = encodeURIComponent(fullUri);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for empty ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/%20`)  // URL encoded space
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle special characters in ID', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:Data_With_Underscores a esg:DataSource ;
                                    rdfs:label "Data With Underscores" .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/Data_With_Underscores`)
        .expect(200);

      expect(response.body.result.label).toBe('Data With Underscores');
    });
  });

  describe('URI Format Support', () => {
    let testUri: string;
    
    beforeEach(async () => {
      testUri = await helper.createTestDatasource('Test Dataset');
    });

    it('should accept short ID format', async () => {
      // Extract short ID from URI
      const shortId = testUri.split('#')[1];
      const response = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body.result).toBeTruthy();
    });

    it('should accept full URI with namespace', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(testUri)}`)
        .expect(200);

      expect(response.body.result).toBeTruthy();
    });

    it('should return same data for short ID and full URI', async () => {
      const shortId = testUri.split('#')[1];
      const shortIdResponse = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      const fullUriResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(testUri)}`)
        .expect(200);

      expect(shortIdResponse.body.result.label).toBe(fullUriResponse.body.result.label);
      expect(shortIdResponse.body.result.iri).toBe(fullUriResponse.body.result.iri);
    });
  });

  describe('Related Data', () => {
    it('should list multiple variables using the datasource', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:SharedData a esg:DataSource ;
                        rdfs:label "Shared Dataset" .
                        
          esg:Var1 a esg:DatasetVariable ;
                  rdfs:label "Variable One" ;
                  esg:sourceFrom esg:SharedData .
                  
          esg:Var2 a esg:DatasetVariable ;
                  rdfs:label "Variable Two" ;
                  esg:sourceFrom esg:SharedData .
                  
          esg:Var3 a esg:DatasetVariable ;
                  rdfs:label "Variable Three" ;
                  esg:sourceFrom esg:SharedData .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/SharedData`)
        .expect(200);

      expect(response.body.result.variables).toHaveLength(3);
      const labels = response.body.result.variables.map((v: any) => v.label);
      expect(labels).toContain('Variable One');
      expect(labels).toContain('Variable Two');
      expect(labels).toContain('Variable Three');
    });

    it('should not include variables from other datasources', async () => {
      await helper.executeSparql(`
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        INSERT DATA {
          esg:DataA a esg:DataSource ;
                   rdfs:label "Dataset A" .
                   
          esg:DataB a esg:DataSource ;
                   rdfs:label "Dataset B" .
                   
          esg:VarA a esg:DatasetVariable ;
                  rdfs:label "Variable A" ;
                  esg:sourceFrom esg:DataA .
                  
          esg:VarB a esg:DatasetVariable ;
                  rdfs:label "Variable B" ;
                  esg:sourceFrom esg:DataB .
        }
      `);

      const response = await request(app)
        .get(`${baseUrl}/DataA`)
        .expect(200);

      expect(response.body.result.variables).toHaveLength(1);
      expect(response.body.result.variables[0].label).toBe('Variable A');
    });
  });
});
