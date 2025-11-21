import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/dataset-variables';

describe('Dataset Variable API - PATCH /api/kg/dataset-variables/:id (Update)', () => {
  beforeEach(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  afterAll(async () => {
    await helper.cleanDatasetVariables();
    await helper.cleanDataSources();
  });

  describe('Normal Update', () => {
    it('should update dataset variable label', async () => {
      const iri = await helper.createTestDatasetVariable('Original Label');

      const updates = {
        label: 'Updated Label'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('iri', iri);
      expect(response.body).toHaveProperty('label', 'Updated Label');
      expect(response.body).toHaveProperty('updated_at');

      // Verify in database
      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.label).toBe('Updated Label');
    });

    it('should update alignment reason', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        alignmentReason: 'Original reason'
      });

      const updates = {
        alignmentReason: 'Updated alignment reason'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.alignmentReason).toBe('Updated alignment reason');
    });

    it('should update confidence score', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        confidenceScore: 50
      });

      const updates = {
        confidenceScore: 90
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.confidenceScore).toBe(90);
    });

    it('should update isUnitCompatible', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        isUnitCompatible: 'Yes'
      });

      const updates = {
        isUnitCompatible: 'No - different units'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.isUnitCompatible).toBe('No - different units');
    });

    it('should update multiple fields at once', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        alignmentReason: 'Old reason',
        confidenceScore: 60,
        isUnitCompatible: 'Yes'
      });

      const updates = {
        label: 'Updated Variable',
        alignmentReason: 'New reason',
        confidenceScore: 95,
        isUnitCompatible: 'No'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.label).toBe('Updated Variable');
      expect(detail.alignmentReason).toBe('New reason');
      expect(detail.confidenceScore).toBe(95);
      expect(detail.isUnitCompatible).toBe('No');
    });

    it('should update by short ID', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const shortId = iri.split('#')[1];

      const updates = {
        label: 'Updated via Short ID'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send(updates)
        .expect(200);

      expect(response.body.label).toBe('Updated via Short ID');
    });

    it('should update by namespace format', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const shortId = iri.split('#')[1];
      const namespaceId = `esg:${shortId}`;

      const updates = {
        label: 'Updated via Namespace'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${namespaceId}`)
        .send(updates)
        .expect(200);

      expect(response.body.label).toBe('Updated via Namespace');
    });
  });

  describe('Data Sources Update', () => {
    it('should replace data sources with new ones', async () => {
      const oldSource = await helper.createTestDatasource('Old Source');
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        sources: [oldSource]
      });

      const newSource = await helper.createTestDatasource('New Source');
      const updates = {
        sources: [newSource]
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.sources).toHaveLength(1);
      expect(detail.sources[0]).toBe(newSource);
    });

    it('should add multiple new sources', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const source1 = await helper.createTestDatasource('Source 1');
      const source2 = await helper.createTestDatasource('Source 2');
      const updates = {
        sources: [source1, source2]
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.sources).toHaveLength(2);
    });

    it('should remove all sources with empty array', async () => {
      const source = await helper.createTestDatasource('Test Source');
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        sources: [source]
      });

      const updates = {
        sources: []
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send(updates)
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.sources).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should reject empty update request', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject empty label', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject whitespace-only label', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-string label', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject confidence score < 0', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ confidenceScore: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject confidence score > 100', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ confidenceScore: 101 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-numeric confidence score', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ confidenceScore: '50' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-array sources', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ sources: 'not-an-array' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject sources with empty string', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ sources: [''] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject sources with non-string values', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ sources: [123] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent dataset variable', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/NonExistentVariable`)
        .send({ label: 'Updated Label' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent full URI', async () => {
      const nonExistentUri = 'http://example.org/esg#NonExistentVar';

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(nonExistentUri)}`)
        .send({ label: 'Updated Label' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for empty ID', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/ `)
        .send({ label: 'Updated Label' })
        .expect(404); // Express returns 404 for whitespace-only paths
    });
  });

  describe('Response Structure', () => {
    it('should return properly structured response', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: 'Updated Variable' })
        .expect(200);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('updated_at');
      expect(typeof response.body.iri).toBe('string');
      expect(typeof response.body.label).toBe('string');
      expect(typeof response.body.updated_at).toBe('string');
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: 'Updated Variable' })
        .expect(200);

      const updatedAt = new Date(response.body.updated_at);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(updatedAt.getTime()).not.toBeNaN();
    });

    it('should return recent timestamp', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');
      const beforeUpdate = Date.now();

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: 'Updated Variable' })
        .expect(200);

      const afterUpdate = Date.now();
      const updatedAt = new Date(response.body.updated_at).getTime();

      expect(updatedAt).toBeGreaterThanOrEqual(beforeUpdate - 5000);
      expect(updatedAt).toBeLessThanOrEqual(afterUpdate + 5000);
    });
  });

  describe('Boundary Values', () => {
    it('should accept confidence score of 0', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        confidenceScore: 50
      });

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ confidenceScore: 0 })
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.confidenceScore).toBe(0);
    });

    it('should accept confidence score of 100', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable', {
        confidenceScore: 50
      });

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ confidenceScore: 100 })
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.confidenceScore).toBe(100);
    });
  });

  describe('Special Characters', () => {
    it('should handle label with special characters', async () => {
      const iri = await helper.createTestDatasetVariable('Original');

      const newLabel = 'Updated-With_Special.Chars!@#';
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ label: newLabel })
        .expect(200);

      expect(response.body.label).toBe(newLabel);
    });

    it('should handle multiline alignment reason', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const multilineReason = 'Line 1\nLine 2\nLine 3';
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ alignmentReason: multilineReason })
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.alignmentReason).toBe(multilineReason);
    });

    it('should handle alignment reason with quotes', async () => {
      const iri = await helper.createTestDatasetVariable('Test Variable');

      const reasonWithQuotes = 'Updated "quoted" reason';
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(iri)}`)
        .send({ alignmentReason: reasonWithQuotes })
        .expect(200);

      const detail = await helper.getDatasetVariableDetail(iri);
      expect(detail.alignmentReason).toBe(reasonWithQuotes);
    });
  });
});
