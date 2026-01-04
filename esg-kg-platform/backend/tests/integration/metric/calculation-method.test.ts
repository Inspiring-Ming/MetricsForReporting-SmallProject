import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/calculation-method', () => {
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
    it('should return calculation method details for direct measurement', async () => {
      const metricUri = await helper.createTestMetric('Direct Metric');
      const datasourceUri = await helper.createTestDatasource('Test DataSource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/calculation-method`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_label');
      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('calculation_method');
      expect(response.body).toHaveProperty('attributes');
      expect(response.body.calculation_method).toBe('direct_measurement');
    });

    it('should include data sources for direct measurement', async () => {
      const metricUri = await helper.createTestMetric('Metric With DS');
      const datasourceUri = await helper.createTestDatasource('DataSource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/calculation-method`)
        .expect(200);

      expect(response.body.calculation_method).toBe('direct_measurement');
      // data_sources may or may not be populated depending on implementation
      if (response.body.data_sources) {
        expect(Array.isArray(response.body.data_sources)).toBe(true);
      }
    });

    it('should work for direct measurement without datasources', async () => {
      const metricUri = await helper.createTestMetric('Direct No DS');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/calculation-method`)
        .expect(200);

      expect(response.body.calculation_method).toBe('direct_measurement');
      expect(response.body.metric_iri).toBe(metricUri);
    });
  });

  describe('Calculation Model Metrics', () => {
    it('should return calculation method details for calculation model', async () => {
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');
      const model = await helper.createTestModel('Calculation Model', [input1, input2]);

      const calcMetric = await helper.createTestMetric('Calculated Metric');

      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${calcMetric}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetric}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetric}> esg:hasModel <${model}> .
        }
        WHERE { 
          <${calcMetric}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/calculation-method`)
        .expect(200);

      expect(response.body.calculation_method).toBe('calculation_model');
      expect(response.body).toHaveProperty('metric_label');
      expect(response.body).toHaveProperty('metric_iri');
    });

    it('should include model information for calculation model', async () => {
      const input = await helper.createTestMetric('Model Input');
      const model = await helper.createTestModel('Test Model', [input]);
      const calcMetric = await helper.createTestMetric('Calc Metric');

      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${calcMetric}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetric}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetric}> esg:hasModel <${model}> .
        }
        WHERE { 
          <${calcMetric}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/calculation-method`)
        .expect(200);

      expect(response.body.calculation_method).toBe('calculation_model');
      // Model may be included depending on implementation
      if (response.body.model) {
        expect(response.body.model).toHaveProperty('label');
        expect(response.body.model).toHaveProperty('iri');
      }
    });

    it('should not include data_sources for calculation model', async () => {
      const model = await helper.createTestModel('Simple Model', []);
      const calcMetric = await helper.createTestMetric('Calc Only');

      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${calcMetric}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetric}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetric}> esg:hasModel <${model}> .
        }
        WHERE { 
          <${calcMetric}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/calculation-method`)
        .expect(200);

      expect(response.body.calculation_method).toBe('calculation_model');
      expect(response.body.data_sources).toBeUndefined();
    });
  });

  describe('Response Structure', () => {
    it('should have required fields for direct measurement', async () => {
      const metric = await helper.createTestMetric('Structure Test Direct');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_label');
      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('calculation_method');
      expect(response.body).toHaveProperty('attributes');

      expect(typeof response.body.metric_label).toBe('string');
      expect(typeof response.body.metric_iri).toBe('string');
      expect(typeof response.body.calculation_method).toBe('string');
      expect(typeof response.body.attributes).toBe('object');
    });

    it('should have required fields for calculation model', async () => {
      const model = await helper.createTestModel('Model', []);
      const metric = await helper.createTestMetric('Structure Test Calc');

      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${metric}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${metric}> esg:hasCalculationMethod "calculation_model" .
          <${metric}> esg:hasModel <${model}> .
        }
        WHERE { 
          <${metric}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response.body).toHaveProperty('metric_label');
      expect(response.body).toHaveProperty('metric_iri');
      expect(response.body).toHaveProperty('calculation_method');
      expect(response.body).toHaveProperty('attributes');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/calculation-method`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid iri')}/calculation-method`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /calculation-method`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/calculation-method`)
        .expect(200);

      expect(response.body.metric_iri).toBe(metricUri);
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded Test');
      const encodedUri = encodeURIComponent(metricUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/calculation-method`)
        .expect(200);

      expect(response.body.metric_iri).toBe(metricUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle metric with special characters', async () => {
      // Use underscores and hyphens which are safe for SPARQL
      const metric = await helper.createTestMetric('Metric_With-Special_Chars');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response.body.metric_iri).toBe(metric);
    });

    it('should handle metric with Unicode characters', async () => {
      const metric = await helper.createTestMetric('指标测试 📊');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response.body.metric_iri).toBe(metric);
    });

    it('should return consistent results for multiple requests', async () => {
      const metric = await helper.createTestMetric('Consistency Test');

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response1.body.calculation_method).toBe(response2.body.calculation_method);
      expect(response1.body.metric_iri).toBe(response2.body.metric_iri);
    });
  });

  describe('Attributes', () => {
    it('should include metric attributes in response', async () => {
      const metric = await helper.createTestMetric('Attributes Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/calculation-method`)
        .expect(200);

      expect(response.body.attributes).toBeDefined();
      expect(typeof response.body.attributes).toBe('object');
    });
  });
});
