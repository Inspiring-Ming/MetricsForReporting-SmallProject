import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/inputs', () => {
  beforeEach(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanMetrics();
    await helper.cleanModels();
  });

  describe('Calculation Model Metrics', () => {
    it('should return input metrics for calculation model metric', async () => {
      const input1 = await helper.createTestMetric('Input 1');
      const input2 = await helper.createTestMetric('Input 2');
      const model = await helper.createTestModel('Test Model', [input1, input2]);

      const calcMetric = await helper.createTestMetric('Calculated Metric');

      // Update metric to calculation_model type and link to model
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
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('total');
      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(Array.isArray(response.body.inputs)).toBe(true);
    });

    it('should return empty inputs for calculation model without inputs', async () => {
      const model = await helper.createTestModel('Simple Model', []);
      const calcMetric = await helper.createTestMetric('Simple Calc');

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
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/inputs`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(response.body.inputs).toBeDefined();
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should include model information in response', async () => {
      const input = await helper.createTestMetric('Input Metric');
      const model = await helper.createTestModel('Model With Info', [input]);
      const calcMetric = await helper.createTestMetric('Calc With Model');

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
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('model');
      if (response.body.model) {
        expect(response.body.model).toHaveProperty('iri');
        expect(response.body.model).toHaveProperty('label');
      }
    });
  });

  describe('Direct Measurement Metrics', () => {
    it('should return empty inputs for direct measurement metric', async () => {
      const directMetric = await helper.createTestMetric('Direct Measurement');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(directMetric)}/inputs`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('direct_measurement');
      expect(response.body.inputs).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should not include model property for direct measurement', async () => {
      const directMetric = await helper.createTestMetric('Direct Only');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(directMetric)}/inputs`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('direct_measurement');
      expect(response.body.model).toBeUndefined();
    });
  });

  describe('Response Structure', () => {
    it('should have correct structure for calculation model', async () => {
      const input = await helper.createTestMetric('Input');
      const model = await helper.createTestModel('Model', [input]);
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
        .get(`${baseUrl}/${encodeURIComponent(calcMetric)}/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('total');

      expect(typeof response.body.metricId).toBe('string');
      expect(typeof response.body.calculationMethod).toBe('string');
      expect(Array.isArray(response.body.inputs)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should have correct structure for direct measurement', async () => {
      const directMetric = await helper.createTestMetric('Direct');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(directMetric)}/inputs`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('total');
      expect(response.body).not.toHaveProperty('model');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistent';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/inputs`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid iri')}/inputs`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /inputs`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/inputs`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded');
      const encodedUri = encodeURIComponent(metricUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/inputs`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle metric with special characters', async () => {
      const metric = await helper.createTestMetric('Metric & Special');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/inputs`)
        .expect(200);

      expect(response.body.metricId).toBe(metric);
    });

    it('should return consistent results for multiple requests', async () => {
      const metric = await helper.createTestMetric('Consistency');

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/inputs`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metric)}/inputs`)
        .expect(200);

      expect(response1.body.total).toBe(response2.body.total);
      expect(response1.body.calculationMethod).toBe(response2.body.calculationMethod);
    });
  });
});
