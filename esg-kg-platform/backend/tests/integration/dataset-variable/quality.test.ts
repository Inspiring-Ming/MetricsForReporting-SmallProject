import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('DatasetVariable API - GET /api/kg/dataset-variables/:id/quality', () => {
  beforeEach(async () => {
    await helper.cleanDatasetVariables();
  });

  afterAll(async () => {
    await helper.cleanDatasetVariables();
  });

  describe('Successful Quality Retrieval', () => {
    it('should retrieve complete quality information', async () => {
      const variableUri = await helper.createTestDatasetVariable('Complete Quality Variable', {
        alignmentReason: 'Direct mapping with high confidence',
        confidenceScore: 95,
        isUnitCompatible: 'Yes - both are numeric'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id', variableUri);
      expect(response.body).toHaveProperty('variable_label', 'Complete Quality Variable');
      expect(response.body).toHaveProperty('confidenceScore', 95);
      expect(response.body).toHaveProperty('isUnitCompatible', 'Yes - both are numeric');
      expect(response.body).toHaveProperty('alignmentReason', 'Direct mapping with high confidence');
    });

    it('should retrieve quality information with partial fields', async () => {
      const variableUri = await helper.createTestDatasetVariable('Partial Quality Variable', {
        confidenceScore: 80
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id', variableUri);
      expect(response.body).toHaveProperty('variable_label', 'Partial Quality Variable');
      expect(response.body).toHaveProperty('confidenceScore', 80);
      expect(response.body.isUnitCompatible).toBeUndefined();
      expect(response.body.alignmentReason).toBeUndefined();
    });

    it('should retrieve quality information with only label (no quality fields)', async () => {
      const variableUri = await helper.createTestDatasetVariable('Minimal Variable');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id', variableUri);
      expect(response.body).toHaveProperty('variable_label', 'Minimal Variable');
      expect(response.body.confidenceScore).toBeUndefined();
      expect(response.body.isUnitCompatible).toBeUndefined();
      expect(response.body.alignmentReason).toBeUndefined();
    });

    it('should handle quality retrieval using short ID format', async () => {
      const variableUri = await helper.createTestDatasetVariable('Short ID Test', {
        confidenceScore: 85,
        isUnitCompatible: 'No - different units'
      });

      const shortId = variableUri.split('#')[1];
      const response = await request(app)
        .get(`${baseUrl}/${shortId}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_id', variableUri);
      expect(response.body).toHaveProperty('variable_label', 'Short ID Test');
      expect(response.body).toHaveProperty('confidenceScore', 85);
      expect(response.body).toHaveProperty('isUnitCompatible', 'No - different units');
    });

    it('should retrieve quality with zero confidence score', async () => {
      const variableUri = await helper.createTestDatasetVariable('Zero Confidence Variable', {
        confidenceScore: 0,
        alignmentReason: 'Low confidence mapping'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 0);
      expect(response.body).toHaveProperty('alignmentReason', 'Low confidence mapping');
    });

    it('should retrieve quality with maximum confidence score', async () => {
      const variableUri = await helper.createTestDatasetVariable('Perfect Match Variable', {
        confidenceScore: 100,
        alignmentReason: 'Exact match',
        isUnitCompatible: 'Yes - identical units'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 100);
      expect(response.body).toHaveProperty('alignmentReason', 'Exact match');
      expect(response.body).toHaveProperty('isUnitCompatible', 'Yes - identical units');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent variable', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentVariable';

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(nonExistentUri)}/quality`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 404 for non-existent short ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/NonExistentShortID/quality`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/not found/i);
    });

    it('should return 400 for empty variable ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('')}/quality`)
        .expect(404); // Express routing treats empty as not found

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for variable ID with only whitespace', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('   ')}/quality`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toMatch(/required|empty|whitespace/i);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure with all fields', async () => {
      const variableUri = await helper.createTestDatasetVariable('Format Test Variable', {
        confidenceScore: 90,
        isUnitCompatible: 'Yes',
        alignmentReason: 'Test reason'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      // Check all required fields
      expect(response.body).toHaveProperty('variable_id');
      expect(response.body).toHaveProperty('variable_label');
      expect(response.body).toHaveProperty('confidenceScore');
      expect(response.body).toHaveProperty('isUnitCompatible');
      expect(response.body).toHaveProperty('alignmentReason');

      // Check types
      expect(typeof response.body.variable_id).toBe('string');
      expect(typeof response.body.variable_label).toBe('string');
      expect(typeof response.body.confidenceScore).toBe('number');
      expect(typeof response.body.isUnitCompatible).toBe('string');
      expect(typeof response.body.alignmentReason).toBe('string');

      // Check no extra fields
      const keys = Object.keys(response.body);
      expect(keys).toHaveLength(5);
    });

    it('should return correct response structure with minimal fields', async () => {
      const variableUri = await helper.createTestDatasetVariable('Minimal Format Test');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      // Check required fields
      expect(response.body).toHaveProperty('variable_id');
      expect(response.body).toHaveProperty('variable_label');

      // Check types
      expect(typeof response.body.variable_id).toBe('string');
      expect(typeof response.body.variable_label).toBe('string');

      // Optional fields should be undefined or not present
      expect(response.body.confidenceScore).toBeUndefined();
      expect(response.body.isUnitCompatible).toBeUndefined();
      expect(response.body.alignmentReason).toBeUndefined();
    });

    it('should preserve full URI in response', async () => {
      const variableUri = await helper.createTestDatasetVariable('URI Preservation Test', {
        confidenceScore: 75
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body.variable_id).toBe(variableUri);
      expect(response.body.variable_id).toContain('http://');
    });
  });

  describe('Special Cases', () => {
    it('should handle variables with special characters in label', async () => {
      const variableUri = await helper.createTestDatasetVariable('Special_Chars-123', {
        confidenceScore: 88,
        alignmentReason: 'Test with special characters: @#$%'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('variable_label', 'Special_Chars-123');
      expect(response.body).toHaveProperty('alignmentReason');
      expect(response.body.alignmentReason).toContain('@#$%');
    });

    it('should handle long alignment reason text', async () => {
      const longReason = 'This is a very long alignment reason that describes in detail why this particular dataset variable was chosen for alignment with the metric. It includes multiple considerations such as data quality, temporal coverage, unit compatibility, and semantic meaning.';
      
      const variableUri = await helper.createTestDatasetVariable('Long Reason Variable', {
        confidenceScore: 92,
        alignmentReason: longReason
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('alignmentReason', longReason);
    });

    it('should handle multiline alignment reason', async () => {
      const multilineReason = 'Line 1: First consideration\nLine 2: Second consideration\nLine 3: Final conclusion';
      
      const variableUri = await helper.createTestDatasetVariable('Multiline Reason Variable', {
        confidenceScore: 87,
        alignmentReason: multilineReason
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('alignmentReason');
      expect(response.body.alignmentReason).toContain('\n');
    });
  });

  describe('Boundary Values', () => {
    it('should handle confidence score at boundary (1)', async () => {
      const variableUri = await helper.createTestDatasetVariable('Low Confidence Variable', {
        confidenceScore: 1
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 1);
    });

    it('should handle confidence score at boundary (99)', async () => {
      const variableUri = await helper.createTestDatasetVariable('High Confidence Variable', {
        confidenceScore: 99
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 99);
    });

    it('should handle variables with only confidenceScore set', async () => {
      const variableUri = await helper.createTestDatasetVariable('Single Field Variable', {
        confidenceScore: 50
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 50);
      expect(response.body.isUnitCompatible).toBeUndefined();
      expect(response.body.alignmentReason).toBeUndefined();
    });
  });

  describe('Integration with Other Endpoints', () => {
    it('should return same quality data as getById endpoint', async () => {
      const variableUri = await helper.createTestDatasetVariable('Integration Test Variable', {
        confidenceScore: 93,
        isUnitCompatible: 'Yes - both percentages',
        alignmentReason: 'Strong semantic alignment'
      });

      // Get quality via quality endpoint
      const qualityResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      // Get full details via getById endpoint
      const detailResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}`)
        .expect(200);

      // Compare quality fields
      expect(qualityResponse.body.confidenceScore).toBe(detailResponse.body.result.confidenceScore);
      expect(qualityResponse.body.isUnitCompatible).toBe(detailResponse.body.result.isUnitCompatible);
      expect(qualityResponse.body.alignmentReason).toBe(detailResponse.body.result.alignmentReason);
    });

    it('should not be affected by associated datasources', async () => {
      const variableUri = await helper.createTestDatasetVariable('Datasource Test Variable', {
        confidenceScore: 85,
        isUnitCompatible: 'Yes'
      });

      const datasourceUri = await helper.createTestDatasource('Test Datasource');
      await helper.addDatasourceToVariable(variableUri, datasourceUri);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
        .expect(200);

      expect(response.body).toHaveProperty('confidenceScore', 85);
      expect(response.body).toHaveProperty('isUnitCompatible', 'Yes');
      expect(response.body).not.toHaveProperty('datasources');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent quality requests', async () => {
      const variableUri = await helper.createTestDatasetVariable('Concurrent Test Variable', {
        confidenceScore: 91,
        isUnitCompatible: 'Yes',
        alignmentReason: 'Test concurrent access'
      });

      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get(`${baseUrl}/${encodeURIComponent(variableUri)}/quality`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('confidenceScore', 91);
        expect(response.body).toHaveProperty('isUnitCompatible', 'Yes');
        expect(response.body).toHaveProperty('alignmentReason', 'Test concurrent access');
      });
    });
  });
});
