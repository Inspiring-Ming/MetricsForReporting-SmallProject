import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('Dataset Variable API - DELETE /api/kg/dataset-variables/:id (Delete)', () => {
  beforeEach(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
    await helper.cleanMetrics();
  });

  afterAll(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
    await helper.cleanMetrics();
  });

  describe('Normal Deletion', () => {
    it('should delete dataset variable by full URI', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('iri', iri);
      expect(response.body).toHaveProperty('deleted', true);
      expect(response.body).toHaveProperty('deleted_at');

      // Verify deletion in database
      const exists = await helper.datasetVariableExists(iri);
      expect(exists).toBe(false);
    });

    it('should delete dataset variable by short ID', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify deletion
      const exists = await helper.datasetVariableExists(iri);
      expect(exists).toBe(false);
    });

    it('should delete dataset variable by namespace format', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const shortId = iri.split('#')[1];
      const namespaceId = `esg:${shortId}`;

      const response = await request(app)
        .delete(`${baseUrl}/${namespaceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });

    it('should delete dataset variable with all properties', async () => {
      const source = await helper.createTestDatasource('Test Source');
      const iri = await helper.createTestDatasetVariable('Complete Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 95,
        isUnitCompatible: 'Yes',
        sources: [source]
      });

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify deletion
      const exists = await helper.datasetVariableExists(iri);
      expect(exists).toBe(false);
    });

    it('should return correct response structure', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('deleted');
      expect(response.body).toHaveProperty('deleted_at');
      expect(typeof response.body.iri).toBe('string');
      expect(typeof response.body.deleted).toBe('boolean');
      expect(typeof response.body.deleted_at).toBe('string');
    });
  });

  describe('Dependency Checking', () => {
    it('should prevent deletion when variable is used by a metric (without force)', async () => {
      const variable = await helper.createTestDatasetVariable('Used Variable');
      const metric = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
      // Link metric to variable using obtainedFrom relationship
      await helper.linkMetricToVariable(metric, variable);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variable)}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('it is being used by one or more metrics');
      expect(response.body.error.message).toContain('force=true');

      // Verify variable still exists
      const exists = await helper.datasetVariableExists(variable);
      expect(exists).toBe(true);
    });

    it('should delete variable with force=true even when used by metrics', async () => {
      const variable = await helper.createTestDatasetVariable('Used Variable');
      const metric = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
      // Link metric to variable using obtainedFrom relationship
      await helper.linkMetricToVariable(metric, variable);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variable)}?force=true`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify deletion
      const exists = await helper.datasetVariableExists(variable);
      expect(exists).toBe(false);
    });

    it('should delete variable without dependencies (no force needed)', async () => {
      const variable = await helper.createTestDatasetVariable('Unused Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variable)}`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent dataset variable', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/NonExistentVariable`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent full URI', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentVar';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for empty ID', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/ `)
        .expect(404); // Express returns 404 for whitespace-only paths
    });

    it('should handle double deletion gracefully', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      // First deletion
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      // Second deletion
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response Validation', () => {
    it('should return valid ISO 8601 timestamp', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      const deletedAt = new Date(response.body.deleted_at);
      expect(deletedAt).toBeInstanceOf(Date);
      expect(deletedAt.getTime()).not.toBeNaN();
    });

    it('should return recent timestamp', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const beforeDelete = Date.now();

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      const afterDelete = Date.now();
      const deletedAt = new Date(response.body.deleted_at).getTime();

      expect(deletedAt).toBeGreaterThanOrEqual(beforeDelete - 5000);
      expect(deletedAt).toBeLessThanOrEqual(afterDelete + 5000);
    });

    it('should always return deleted: true on successful deletion', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
    });
  });

  describe('Force Parameter', () => {
    it('should accept force=true query parameter', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}?force=true`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });

    it('should accept force=false query parameter', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}?force=false`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });

    it('should default to force=false when not specified', async () => {
      const variable = await helper.createTestDatasetVariable('Used Variable');
      const metric = await helper.createTestMetric('Test Metric', {
        calculationMethod: 'direct_measurement'
      });
      // Link metric to variable using obtainedFrom relationship
      await helper.linkMetricToVariable(metric, variable);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variable)}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid force parameter gracefully', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      // Invalid boolean value should be treated as false
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}?force=invalid`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);
    });
  });

  describe('Data Sources Cleanup', () => {
    it('should remove associations to data sources', async () => {
      const source = await helper.createTestDatasource('Test Source');
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        sources: [source]
      });

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      // Verify variable is deleted
      const exists = await helper.datasetVariableExists(iri);
      expect(exists).toBe(false);

      // Data source should still exist (only association is removed)
      const sourceQuery = `
        PREFIX esg: <http://example.org/esg#>
        ASK { <${source}> a esg:DataSource . }
      `;
      const sourceResult = await helper.executeSparql(sourceQuery);
      expect(sourceResult.boolean).toBe(true);
    });

    it('should remove multiple source associations', async () => {
      const source1 = await helper.createTestDatasource('Source 1');
      const source2 = await helper.createTestDatasource('Source 2');
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        sources: [source1, source2]
      });

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(iri)}`)
        .expect(200);

      // Verify variable is deleted
      const exists = await helper.datasetVariableExists(iri);
      expect(exists).toBe(false);
    });
  });

  describe('Cascade Deletion with force=true', () => {
    it('should remove variable even when multiple metrics depend on it', async () => {
      const variable = await helper.createTestDatasetVariable('Shared Variable');
      const metric1 = await helper.createTestMetric('Metric 1', {
        calculationMethod: 'direct_measurement'
      });
      const metric2 = await helper.createTestMetric('Metric 2', {
        calculationMethod: 'direct_measurement'
      });
      // Link both metrics to the same variable
      await helper.linkMetricToVariable(metric1, variable);
      await helper.linkMetricToVariable(metric2, variable);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variable)}?force=true`)
        .expect(200);

      expect(response.body).toHaveProperty('deleted', true);

      // Verify variable is deleted
      const exists = await helper.datasetVariableExists(variable);
      expect(exists).toBe(false);

      // Metrics should still exist (only reference is removed)
      const metric1Exists = await helper.metricExists(metric1);
      const metric2Exists = await helper.metricExists(metric2);
      expect(metric1Exists).toBe(true);
      expect(metric2Exists).toBe(true);
    });
  });
});
