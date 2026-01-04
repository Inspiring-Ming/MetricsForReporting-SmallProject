import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('Dataset Variable API - POST /api/kg/dataset-variables (Create)', () => {
  beforeEach(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  describe('Normal Creation', () => {
    it('should create dataset variable with minimal fields (label only)', async () => {
      const newVariable = {
        label: 'Test Variable'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newVariable)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', newVariable.label);
      expect(response.body).toHaveProperty('created_at');

      // Verify in database
      const exists = await helper.datasetVariableExists(response.body.iri);
      expect(exists).toBe(true);
    });

    it('should create dataset variable with all fields', async () => {
      const source1 = await helper.createTestDatasource('Test Source 1');
      const source2 = await helper.createTestDatasource('Test Source 2');

      const newVariable = {
        label: 'Complete Variable',
        alignmentReason: 'Direct mapping for testing',
        confidenceScore: 95,
        isUnitCompatible: 'Yes - both numeric',
        sources: [source1, source2]
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newVariable)
        .expect(201);

      expect(response.body.label).toBe(newVariable.label);

      // Verify in database
      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.label).toBe(newVariable.label);
      expect(detail.alignmentReason).toBe(newVariable.alignmentReason);
      expect(detail.confidenceScore).toBe(newVariable.confidenceScore);
      expect(detail.isUnitCompatible).toBe(newVariable.isUnitCompatible);
      expect(detail.sources).toHaveLength(2);
    });

    it('should return correct response structure', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'New Variable' })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('created_at');
      expect(typeof response.body.iri).toBe('string');
      expect(typeof response.body.label).toBe('string');
      expect(typeof response.body.created_at).toBe('string');
    });

    it('should generate unique URI for each variable', async () => {
      const response1 = await request(app)
        .post(baseUrl)
        .send({ label: 'Variable 1' })
        .expect(201);

      const response2 = await request(app)
        .post(baseUrl)
        .send({ label: 'Variable 1' })
        .expect(201);

      expect(response1.body.iri).not.toBe(response2.body.iri);
    });
  });

  describe('Field Validation', () => {
    it('should reject request without label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ alignmentReason: 'Only alignment reason' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with empty label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with whitespace-only label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with non-string label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with null label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: null })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Confidence Score Validation', () => {
    it('should accept confidence score of 0', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Zero Score Variable',
          confidenceScore: 0
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should accept confidence score of 100', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Max Score Variable',
          confidenceScore: 100
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should accept valid confidence score in range', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Mid Score Variable',
          confidenceScore: 75
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should reject confidence score less than 0', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Negative Score Variable',
          confidenceScore: -1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject confidence score greater than 100', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Over Score Variable',
          confidenceScore: 101
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-numeric confidence score', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'String Score Variable',
          confidenceScore: '50'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Sources Validation', () => {
    it('should accept valid sources array', async () => {
      const source = await helper.createTestDatasource('Valid Source');

      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Source',
          sources: [source]
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should accept multiple sources', async () => {
      const source1 = await helper.createTestDatasource('Source 1');
      const source2 = await helper.createTestDatasource('Source 2');

      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Multiple Sources',
          sources: [source1, source2]
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should accept sources with short IDs', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Short ID Source',
          sources: ['TestSource']
        })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
    });

    it('should reject non-array sources', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Invalid Sources',
          sources: 'not-an-array'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject empty sources array', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Empty Sources',
          sources: []
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject sources with empty string', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Empty Source String',
          sources: ['']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject sources with non-string values', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Invalid Source',
          sources: [123]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Optional Fields', () => {
    it('should accept variable with only alignmentReason', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Alignment',
          alignmentReason: 'Test alignment reason'
        })
        .expect(201);

      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.alignmentReason).toBe('Test alignment reason');
    });

    it('should accept variable with only confidenceScore', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Score',
          confidenceScore: 80
        })
        .expect(201);

      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.confidenceScore).toBe(80);
    });

    it('should accept variable with only isUnitCompatible', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Variable with Unit Info',
          isUnitCompatible: 'Yes - compatible'
        })
        .expect(201);

      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.isUnitCompatible).toBe('Yes - compatible');
    });
  });

  describe('Special Characters and Formatting', () => {
    it('should handle label with spaces', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Variable With Spaces' })
        .expect(201);

      expect(response.body.label).toBe('Variable With Spaces');
    });

    it('should handle label with special characters', async () => {
      const label = 'Variable-With_Special.Chars!@#';
      const response = await request(app)
        .post(baseUrl)
        .send({ label })
        .expect(201);

      expect(response.body.label).toBe(label);
    });

    it('should handle multiline alignmentReason', async () => {
      const multilineReason = 'Line 1\nLine 2\nLine 3';
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Multiline Variable',
          alignmentReason: multilineReason
        })
        .expect(201);

      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.alignmentReason).toBe(multilineReason);
    });

    it('should handle alignmentReason with quotes', async () => {
      const reasonWithQuotes = 'Test "quoted" reason';
      const response = await request(app)
        .post(baseUrl)
        .send({ 
          label: 'Quoted Variable',
          alignmentReason: reasonWithQuotes
        })
        .expect(201);

      const detail = await helper.getDatasetVariableDetail(response.body.iri);
      expect(detail.alignmentReason).toBe(reasonWithQuotes);
    });
  });

  describe('Response Timestamp', () => {
    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Timestamp Variable' })
        .expect(201);

      const createdAt = new Date(response.body.created_at);
      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).not.toBeNaN();
    });

    it('should return recent timestamp', async () => {
      const beforeCreate = Date.now();
      
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Recent Variable' })
        .expect(201);

      const afterCreate = Date.now();
      const createdAt = new Date(response.body.created_at).getTime();

      expect(createdAt).toBeGreaterThanOrEqual(beforeCreate - 5000); // 5 second buffer
      expect(createdAt).toBeLessThanOrEqual(afterCreate + 5000);
    });
  });
});
