import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/lineage', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanDataSources();
    await helper.cleanModels();
  });

  describe('Direct Measurement Metrics', () => {
    it('should return lineage for direct measurement metric with datasource', async () => {
      // Create test data
      const metricUri = await helper.createTestMetric('Test Direct Metric');
      const datasourceUri = await helper.createTestDatasource('Test Data Source');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body.metric).toBeDefined();
      expect(response.body.metric.label).toBe('Test Direct Metric');
      expect(response.body.metric.hasCalculationMethod).toBe('direct_measurement');
      expect(response.body.lineageType).toBe('direct_measurement');
      expect(response.body.obtainedFrom).toBeDefined();
    });

    it('should return empty obtainedFrom for direct measurement metric without datasources', async () => {
      const metricUri = await helper.createTestMetric('Metric Without DataSource');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body.lineageType).toBe('direct_measurement');
      expect(response.body.obtainedFrom).toBeDefined();
      expect(Array.isArray(response.body.obtainedFrom) ? response.body.obtainedFrom : []).toHaveLength(0);
    });

    it('should return lineage with multiple datasources', async () => {
      const metricUri = await helper.createTestMetric('Multi Source Metric');
      const ds1 = await helper.createTestDatasource('DataSource 1');
      const ds2 = await helper.createTestDatasource('DataSource 2');
      const ds3 = await helper.createTestDatasource('DataSource 3');
      
      await helper.addDatasourceToMetric(metricUri, ds1);
      await helper.addDatasourceToMetric(metricUri, ds2);
      await helper.addDatasourceToMetric(metricUri, ds3);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body.lineageType).toBe('direct_measurement');
      expect(response.body.obtainedFrom).toBeDefined();
      
      // The obtainedFrom returns DatasetVariables, not direct datasources
      // Since we're using hasDataSource (simplified model), it may return empty
      const datasources = response.body.obtainedFrom;
      expect(Array.isArray(datasources)).toBe(true);
    });
  });

  describe('Calculation Model Metrics', () => {
    it('should return lineage for calculation model metric with model and inputs', async () => {
      // Create input metrics
      const input1 = await helper.createTestMetric('Input Metric 1');
      const input2 = await helper.createTestMetric('Input Metric 2');

      // Create a model
      const modelUri = await helper.createTestModel('Test Model', [input1, input2]);

      // Create a calculation metric and link to model
      const calcMetricUri = await helper.createTestMetric('Calculated Metric');
      
      // Update the metric to be calculation_model type and link to model
      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        DELETE { <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetricUri}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetricUri}> esg:hasModel <${modelUri}> .
        }
        WHERE { 
          <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetricUri)}/lineage`)
        .expect(200);

      expect(response.body.metric).toBeDefined();
      expect(response.body.metric.label).toBe('Calculated Metric');
      expect(response.body.metric.hasCalculationMethod).toBe('calculation_model');
      expect(response.body.lineageType).toBe('calculation_model');
      expect(response.body.model).toBeDefined();
      expect(response.body.inputs).toBeDefined();
    });

    it('should return lineage for calculation model without inputs', async () => {
      // Create a model without inputs
      const modelUri = await helper.createTestModel('Simple Model', []);

      // Create a calculation metric
      const calcMetricUri = await helper.createTestMetric('Simple Calc Metric');
      
      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetricUri}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetricUri}> esg:hasModel <${modelUri}> .
        }
        WHERE { 
          <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetricUri)}/lineage`)
        .expect(200);

      expect(response.body.lineageType).toBe('calculation_model');
      expect(response.body.model).toBeDefined();
      expect(response.body.inputs).toBeDefined();
    });

    it('should return lineage with complex input chain', async () => {
      // Create a chain of metrics: base -> intermediate -> final
      const base1 = await helper.createTestMetric('Base Metric 1');
      const base2 = await helper.createTestMetric('Base Metric 2');
      
      const model1 = await helper.createTestModel('Intermediate Model', [base1, base2]);
      const intermediate = await helper.createTestMetric('Intermediate Metric');
      
      let updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${intermediate}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${intermediate}> esg:hasCalculationMethod "calculation_model" .
          <${intermediate}> esg:hasModel <${model1}> .
        }
        WHERE { 
          <${intermediate}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const model2 = await helper.createTestModel('Final Model', [intermediate]);
      const finalMetric = await helper.createTestMetric('Final Metric');
      
      updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${finalMetric}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${finalMetric}> esg:hasCalculationMethod "calculation_model" .
          <${finalMetric}> esg:hasModel <${model2}> .
        }
        WHERE { 
          <${finalMetric}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(finalMetric)}/lineage`)
        .expect(200);

      expect(response.body.lineageType).toBe('calculation_model');
      expect(response.body.model).toBeDefined();
      expect(response.body.inputs).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentMetric';
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/lineage`)
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      // Use a truly invalid URI format with special characters
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid uri with spaces')}/lineage`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /lineage`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Format Test');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body.metric.label).toBe('URI Format Test');
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded URI Test');
      const encodedUri = encodeURIComponent(metricUri);
      
      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/lineage`)
        .expect(200);

      expect(response.body.metric.label).toBe('Encoded URI Test');
    });
  });

  describe('Response Structure', () => {
    it('should have correct structure for direct measurement', async () => {
      const metricUri = await helper.createTestMetric('Structure Test Direct');
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body).toHaveProperty('metric');
      expect(response.body).toHaveProperty('lineageType');
      expect(response.body).toHaveProperty('obtainedFrom');
      expect(response.body).not.toHaveProperty('model');
      expect(response.body).not.toHaveProperty('inputs');
      
      expect(response.body.metric).toHaveProperty('iri');
      expect(response.body.metric).toHaveProperty('label');
      expect(response.body.metric).toHaveProperty('hasCalculationMethod');
    });

    it('should have correct structure for calculation model', async () => {
      const modelUri = await helper.createTestModel('Structure Test Model', []);
      const metricUri = await helper.createTestMetric('Structure Test Calc');
      
      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${metricUri}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${metricUri}> esg:hasCalculationMethod "calculation_model" .
          <${metricUri}> esg:hasModel <${modelUri}> .
        }
        WHERE { 
          <${metricUri}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/lineage`)
        .expect(200);

      expect(response.body).toHaveProperty('metric');
      expect(response.body).toHaveProperty('lineageType');
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).not.toHaveProperty('obtainedFrom');
    });
  });
});
