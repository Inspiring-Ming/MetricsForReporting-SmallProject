import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - DELETE /api/kg/dataset-variables/:id/datasources/:dsId (Remove Datasource)', () => {
  let variableUri: string;

  beforeEach(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  describe('Successful Deletions', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 90
      });
    });

    it('should remove datasource from dataset variable', async () => {
      const datasourceUri = await helper.createTestDatasource('Test Datasource');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const datasourceId = encodeURIComponent(datasourceUri);
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${datasourceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri', variableUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
      expect(response.body).toHaveProperty('removed_at');
      expect(response.body.removed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verify the association was removed
      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).not.toContain(datasourceUri);
    });

    it('should remove datasource using short ID format', async () => {
      const datasourceUri = await helper.createTestDatasource('Short ID Test');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const shortDatasourceId = datasourceUri.split('#')[1];
      const shortVariableId = variableUri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortVariableId}/datasources/${shortDatasourceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri');
      expect(response.body).toHaveProperty('datasource_iri');
      expect(response.body).toHaveProperty('removed_at');
    });

    it('should handle removing one datasource while others remain', async () => {
      const datasource1 = await helper.createTestDatasource('Datasource 1');
      const datasource2 = await helper.createTestDatasource('Datasource 2');
      const datasource3 = await helper.createTestDatasource('Datasource 3');

      await helper.addDatasourceToVariable(variableUri, datasource1);
      await helper.addDatasourceToVariable(variableUri, datasource2);
      await helper.addDatasourceToVariable(variableUri, datasource3);

      // Remove datasource2
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasource2)}`)
        .expect(200);

      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).toContain(datasource1);
      expect(datasources).not.toContain(datasource2);
      expect(datasources).toContain(datasource3);
      expect(datasources).toHaveLength(2);
    });

    it('should successfully remove last datasource from variable', async () => {
      const datasourceUri = await helper.createTestDatasource('Only Datasource');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).toHaveLength(0);
    });

    it('should handle mixed ID formats (short variable ID, full datasource URI)', async () => {
      const datasourceUri = await helper.createTestDatasource('Mixed Format Test');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const shortVariableId = variableUri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortVariableId}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).not.toContain(datasourceUri);
    });
  });

  describe('Idempotency', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 90
      });
    });

    it('should return 200 even when datasource is not associated with variable (idempotent)', async () => {
      const datasourceUri = await helper.createTestDatasource('Unassociated Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri', variableUri);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
      expect(response.body).toHaveProperty('removed_at');
    });

    it('should return 200 for non-existent datasource (idempotent)', async () => {
      const nonExistentDatasource = 'http://example.org/esg#NonExistentDatasource';

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(nonExistentDatasource)}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri', variableUri);
      expect(response.body).toHaveProperty('datasource_iri', nonExistentDatasource);
    });

    it('should allow repeated deletion of same association', async () => {
      const datasourceUri = await helper.createTestDatasource('Repeat Delete Test');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      // First deletion
      const response1 = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response1.body).toHaveProperty('variable_iri', variableUri);
      expect(response1.body).toHaveProperty('datasource_iri', datasourceUri);

      // Second deletion (should still succeed)
      const response2 = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response2.body).toHaveProperty('variable_iri', variableUri);
      expect(response2.body).toHaveProperty('datasource_iri', datasourceUri);

      // Verify it's still not associated
      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).not.toContain(datasourceUri);
    });
  });

  describe('Validation Errors', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 90
      });
    });

    it('should return 400 for invalid datasource URI format', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent('invalid iri format')}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should return 400 for invalid variable URI format', async () => {
      const datasourceUri = await helper.createTestDatasource('Valid Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent('invalid variable iri')}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/invalid.*iri/i);
    });

    it('should return 404 for empty datasource ID', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent('')}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for datasource ID with only whitespace', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent('   ')}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Cases', () => {
    it('should return 200 for non-existent variable (idempotent)', async () => {
      const nonExistentVariable = 'http://example.org/esg#NonExistentVariable';
      const datasourceUri = await helper.createTestDatasource('Valid Datasource');

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(nonExistentVariable)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri', nonExistentVariable);
      expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
    });

    it('should handle special characters in IDs correctly', async () => {
      const datasourceUri = await helper.createTestDatasource('Special_Chars-123');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const shortDatasourceId = datasourceUri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${shortDatasourceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_iri');
      expect(response.body).toHaveProperty('datasource_iri');
    });
  });

  describe('Response Format', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Response Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 85
      });
    });

    it('should return correct response structure', async () => {
      const datasourceUri = await helper.createTestDatasource('Format Test Datasource');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      // Check all required fields
      expect(response.body).toHaveProperty('variable_iri');
      expect(response.body).toHaveProperty('datasource_iri');
      expect(response.body).toHaveProperty('removed_at');

      // Check types
      expect(typeof response.body.variable_iri).toBe('string');
      expect(typeof response.body.datasource_iri).toBe('string');
      expect(typeof response.body.removed_at).toBe('string');

      // Check timestamp format (ISO 8601)
      expect(response.body.removed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Check no extra fields
      const keys = Object.keys(response.body);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('variable_iri');
      expect(keys).toContain('datasource_iri');
      expect(keys).toContain('removed_at');
    });

    it('should preserve full URIs in response', async () => {
      const datasourceUri = await helper.createTestDatasource('URI Preservation Test');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const response = await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
        .expect(200);

      expect(response.body.variable_iri).toBe(variableUri);
      expect(response.body.datasource_iri).toBe(datasourceUri);
      expect(response.body.variable_iri).toContain('http://');
      expect(response.body.datasource_iri).toContain('http://');
    });
  });

  describe('Integration with GET endpoint', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Integration Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 95
      });
    });

    it('should reflect deletion in GET datasources response', async () => {
      const datasource1 = await helper.createTestDatasource('Integration Datasource 1');
      const datasource2 = await helper.createTestDatasource('Integration Datasource 2');

      await helper.addDatasourceToVariable(variableUri, datasource1);
      await helper.addDatasourceToVariable(variableUri, datasource2);

      // Verify both datasources exist
      const beforeResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources`)
        .expect(200);

      expect(beforeResponse.body.total).toBe(2);
      expect(beforeResponse.body.datasources).toHaveLength(2);

      // Remove one datasource
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasource1)}`)
        .expect(200);

      // Verify only one datasource remains
      const afterResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources`)
        .expect(200);

      expect(afterResponse.body.total).toBe(1);
      expect(afterResponse.body.datasources).toHaveLength(1);
      expect(afterResponse.body.datasources[0].iri).toBe(datasource2);
    });

    it('should show empty datasources array after removing all', async () => {
      const datasource1 = await helper.createTestDatasource('Remove All Test 1');
      const datasource2 = await helper.createTestDatasource('Remove All Test 2');

      await helper.addDatasourceToVariable(variableUri, datasource1);
      await helper.addDatasourceToVariable(variableUri, datasource2);

      // Remove both datasources
      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasource1)}`)
        .expect(200);

      await request(app)
        .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasource2)}`)
        .expect(200);

      // Verify no datasources remain
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources`)
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.datasources).toHaveLength(0);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      variableUri = await helper.createTestDatasetVariable('Concurrent Test Variable', {
        alignmentReason: 'Test alignment',
        confidenceScore: 88
      });
    });

    it('should handle concurrent deletions of same association gracefully', async () => {
      const datasourceUri = await helper.createTestDatasource('Concurrent Delete Test');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      // Send multiple concurrent deletion requests
      const deletePromises = Array(5).fill(null).map(() =>
        request(app)
          .delete(`${baseUrl}/${encodeURIComponent(variableUri)}/datasources/${encodeURIComponent(datasourceUri)}`)
      );

      const responses = await Promise.all(deletePromises);

      // All should succeed (idempotent)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('variable_iri', variableUri);
        expect(response.body).toHaveProperty('datasource_iri', datasourceUri);
      });

      // Verify association is removed
      const datasources = await helper.getVariableDatasources(variableUri);
      expect(datasources).not.toContain(datasourceUri);
    });
  });
});
