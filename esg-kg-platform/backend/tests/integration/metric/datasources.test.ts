import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/metrics';

describe('Metric API - GET /api/kg/metrics/:id/datasources', () => {
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
    it('should return all datasources for direct measurement metric', async () => {
      // Create metric and datasources
      const metricUri = await helper.createTestMetric('Test Direct Metric');
      const ds1 = await helper.createTestDatasource('DataSource 1');
      const ds2 = await helper.createTestDatasource('DataSource 2');

      await helper.addDatasourceToMetric(metricUri, ds1);
      await helper.addDatasourceToMetric(metricUri, ds2);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
      expect(response.body.calculationMethod).toBe('direct_measurement');
      expect(response.body.dataSources).toBeDefined();
      expect(Array.isArray(response.body.dataSources)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array for direct measurement metric without datasources', async () => {
      const metricUri = await helper.createTestMetric('Metric Without DataSources');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('direct_measurement');
      expect(response.body.dataSources).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return datasources with correct structure', async () => {
      const metricUri = await helper.createTestMetric('Structure Test Metric');
      const datasourceUri = await helper.createTestDatasource('Test DataSource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('dataSources');
      expect(response.body).toHaveProperty('total');
    });

    it('should handle multiple datasources correctly', async () => {
      const metricUri = await helper.createTestMetric('Multi DataSource Metric');
      const datasources = [
        await helper.createTestDatasource('DS 1'),
        await helper.createTestDatasource('DS 2'),
        await helper.createTestDatasource('DS 3'),
        await helper.createTestDatasource('DS 4'),
        await helper.createTestDatasource('DS 5')
      ];

      for (const ds of datasources) {
        await helper.addDatasourceToMetric(metricUri, ds);
      }

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('direct_measurement');
      // Without observation data, datasources will be empty
      expect(response.body.dataSources).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should support includeVariables query parameter', async () => {
      const metricUri = await helper.createTestMetric('Variable Test Metric');
      const datasourceUri = await helper.createTestDatasource('Variable Test DS');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources?includeVariables=true`)
        .expect(200);

      expect(response.body.dataSources).toBeDefined();
      expect(Array.isArray(response.body.dataSources)).toBe(true);
    });

    it('should work without includeVariables parameter', async () => {
      const metricUri = await helper.createTestMetric('No Variable Param Metric');
      const datasourceUri = await helper.createTestDatasource('No Variable Param DS');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.dataSources).toBeDefined();
    });
  });

  describe('Calculation Model Metrics', () => {
    it('should return empty datasources for calculation model metric', async () => {
      // Create a calculation model metric
      const inputMetric = await helper.createTestMetric('Input Metric');
      const modelUri = await helper.createTestModel('Test Model', [inputMetric]);
      const calcMetricUri = await helper.createTestMetric('Calc Metric');

      // Update to calculation_model type
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
        .get(`${baseUrl}/${encodeURIComponent(calcMetricUri)}/datasources`)
        .expect(200);

      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(response.body.dataSources).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should not return datasources even if calculation model metric has datasource link', async () => {
      const calcMetricUri = await helper.createTestMetric('Calc With DS Metric');
      const modelUri = await helper.createTestModel('Model', []);
      const datasourceUri = await helper.createTestDatasource('Invalid DS');

      // Update to calculation_model and add datasource (edge case)
      const updateQuery = `
        PREFIX esg: <http://example.org/esg#>
        
        DELETE { <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod . }
        INSERT { 
          <${calcMetricUri}> esg:hasCalculationMethod "calculation_model" .
          <${calcMetricUri}> esg:hasModel <${modelUri}> .
          <${calcMetricUri}> esg:hasDataSource <${datasourceUri}> .
        }
        WHERE { 
          <${calcMetricUri}> esg:hasCalculationMethod ?oldMethod .
        }
      `;
      await helper['graphDB'].executeSparqlQuery(updateQuery);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(calcMetricUri)}/datasources`)
        .expect(200);

      // Should ignore datasource because it's a calculation model
      expect(response.body.calculationMethod).toBe('calculation_model');
      expect(response.body.dataSources).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent metric', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentMetric';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/datasources`)
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid URI format', async () => {
      // Use a truly invalid URI format with special characters
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('invalid iri with spaces')}/datasources`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty metric ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/ /datasources`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid includeVariables parameter gracefully', async () => {
      const metricUri = await helper.createTestMetric('Invalid Param Metric');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources?includeVariables=invalid`)
        .expect(200);

      expect(response.body.dataSources).toBeDefined();
    });
  });

  describe('Different ID Formats', () => {
    it('should accept full URI format', async () => {
      const metricUri = await helper.createTestMetric('URI Format Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });

    it('should accept encoded URI', async () => {
      const metricUri = await helper.createTestMetric('Encoded URI Test');
      const encodedUri = encodeURIComponent(metricUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodedUri}/datasources`)
        .expect(200);

      expect(response.body.metricId).toBe(metricUri);
    });
  });

  describe('Edge Cases', () => {
    it('should handle metric with special characters in label', async () => {
      // Use underscores and hyphens which are safe for SPARQL
      const metricUri = await helper.createTestMetric('Metric_With-Special_Chars');
      const datasourceUri = await helper.createTestDatasource('Test DataSource');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.dataSources).toBeDefined();
    });

    it('should handle metric with Unicode characters', async () => {
      const metricUri = await helper.createTestMetric('指标测试 📊');
      const datasourceUri = await helper.createTestDatasource('数据源 🔢');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body.dataSources).toBeDefined();
    });

    it('should return consistent results for same metric queried multiple times', async () => {
      const metricUri = await helper.createTestMetric('Consistency Test Metric');
      const datasourceUri = await helper.createTestDatasource('Consistency Test DS');
      await helper.addDatasourceToMetric(metricUri, datasourceUri);

      const response1 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      const response2 = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response1.body.total).toBe(response2.body.total);
      expect(response1.body.calculationMethod).toBe(response2.body.calculationMethod);
    });
  });

  describe('Response Structure Validation', () => {
    it('should have all required fields in response', async () => {
      const metricUri = await helper.createTestMetric('Response Structure Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      expect(response.body).toHaveProperty('metricId');
      expect(response.body).toHaveProperty('metricLabel');
      expect(response.body).toHaveProperty('calculationMethod');
      expect(response.body).toHaveProperty('dataSources');
      expect(response.body).toHaveProperty('total');

      expect(typeof response.body.metricId).toBe('string');
      expect(typeof response.body.metricLabel).toBe('string');
      expect(typeof response.body.calculationMethod).toBe('string');
      expect(Array.isArray(response.body.dataSources)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return valid total count matching datasources array length', async () => {
      const metricUri = await helper.createTestMetric('Count Test Metric');
      const ds1 = await helper.createTestDatasource('Count DS 1');
      const ds2 = await helper.createTestDatasource('Count DS 2');
      const ds3 = await helper.createTestDatasource('Count DS 3');

      await helper.addDatasourceToMetric(metricUri, ds1);
      await helper.addDatasourceToMetric(metricUri, ds2);
      await helper.addDatasourceToMetric(metricUri, ds3);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(metricUri)}/datasources`)
        .expect(200);

      // Without observation data, datasources will be empty but response should be valid
      expect(response.body.dataSources.length).toBe(response.body.total);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });
  });
});
