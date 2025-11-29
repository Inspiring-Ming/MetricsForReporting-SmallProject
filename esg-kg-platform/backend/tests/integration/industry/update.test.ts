import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/industries';

describe('Industry API - PATCH /api/kg/industries/:id (Update)', () => {
  beforeEach(async () => {
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanIndustries();
  });

  describe('Single Field Update', () => {
    it('should update label only', async () => {
      const iri = await helper.createTestIndustry('Original Name', 'Original Description');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('label', 'Updated Name');
      expect(response.body).toHaveProperty('updated_at');

      // Verify description unchanged
      const detail = await helper.getIndustryDetail(iri);
      expect(detail.label).toBe('Updated Name');
      expect(detail.description).toBe('Original Description');
    });

    it('should update description only', async () => {
      const iri = await helper.createTestIndustry('Industry Name', 'Original Description');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'Updated Description' })
        .expect(200);

      expect(response.body.description).toBe('Updated Description');

      // Verify label unchanged
      const detail = await helper.getIndustryDetail(iri);
      expect(detail.label).toBe('Industry Name');
      expect(detail.description).toBe('Updated Description');
    });

    it('should update reportsUsing only', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const iri = await helper.createTestIndustry('Test Industry', 'Desc', [fw1]);
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ reportsUsing: [fw2] })
        .expect(200);

      // Verify frameworks updated
      const detail = await helper.getIndustryDetail(iri);
      expect(detail.frameworks).toHaveLength(1);
      expect(detail.frameworks[0]).toBe(fw2);
    });
  });

  describe('Multiple Fields Update', () => {
    it('should update label and description together', async () => {
      const iri = await helper.createTestIndustry('Old Name', 'Old Description');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          description: 'New Description'
        })
        .expect(200);

      expect(response.body.label).toBe('New Name');
      expect(response.body.description).toBe('New Description');
    });

    it('should update all fields at once', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const iri = await helper.createTestIndustry('Old Name', 'Old Desc', [fw1]);
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          description: 'New Description',
          reportsUsing: [fw2]
        })
        .expect(200);

      const detail = await helper.getIndustryDetail(iri);
      expect(detail.label).toBe('New Name');
      expect(detail.description).toBe('New Description');
      expect(detail.frameworks).toContain(fw2);
      expect(detail.frameworks).not.toContain(fw1);
    });
  });

  describe('Field Deletion', () => {
    it('should delete description by setting to empty string', async () => {
      const iri = await helper.createTestIndustry('Test Industry', 'Original Description');
      const shortId = iri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: '' })
        .expect(200);

      const detail = await helper.getIndustryDetail(iri);
      expect(detail.description).toBeUndefined();
    });

    it('should remove all frameworks by setting to empty array', async () => {
      const fw = await helper.createTestFramework('Test Framework');
      const iri = await helper.createTestIndustry('Test Industry', 'Desc', [fw]);
      const shortId = iri.split('#')[1];

      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ reportsUsing: [] })
        .expect(200);

      const detail = await helper.getIndustryDetail(iri);
      expect(detail.frameworks).toHaveLength(0);
    });
  });

  describe('Data Validation', () => {
    it('should reject empty request body', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        message: expect.stringContaining('At least one field')
      });
    });

    it('should reject empty label', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject label exceeding maximum length', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'A'.repeat(201) })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject description exceeding maximum length', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'A'.repeat(1001) })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid framework URIs', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ reportsUsing: ['invalid-iri'] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Update Verification', () => {
    it('should verify update by querying after PATCH', async () => {
      const iri = await helper.createTestIndustry('Original Name');
      const shortId = iri.split('#')[1];

      // Update
      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Updated Name' })
        .expect(200);

      // Query to verify
      const response = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body.result.label).toBe('Updated Name');
    });

    it('should have updated_at timestamp after update', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: 'New Description' })
        .expect(200);

      expect(response.body).toHaveProperty('updated_at');
      expect(new Date(response.body.updated_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Error Cases', () => {
    it('should return 404 when updating non-existent industry', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/nonexistent`)
        .send({ label: 'New Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should ignore unknown fields in request', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({
          label: 'New Name',
          unknownField: 'should be ignored'
        })
        .expect(200);

      expect(response.body.label).toBe('New Name');
      expect(response.body).not.toHaveProperty('unknownField');
    });
  });

  describe('Special Characters in Updates', () => {
    it('should handle special characters in updated label', async () => {
      const iri = await helper.createTestIndustry('Original');
      const shortId = iri.split('#')[1];

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ label: 'Oil & Gas (Updated)' })
        .expect(200);

      expect(response.body.label).toBe('Oil & Gas (Updated)');
    });

    it('should handle multiline description in update', async () => {
      const iri = await helper.createTestIndustry('Test Industry');
      const shortId = iri.split('#')[1];

      const multiline = 'Line 1\nLine 2\nLine 3';

      const response = await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ description: multiline })
        .expect(200);

      expect(response.body.description).toBe(multiline);
    });
  });
});
