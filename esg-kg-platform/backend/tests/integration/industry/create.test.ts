import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/industries';

describe('Industry API - POST /api/kg/industries (Create)', () => {
  beforeEach(async () => {
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanIndustries();
  });

  describe('Normal Creation', () => {
    it('should create industry with minimal fields (label only)', async () => {
      const newIndustry = {
        label: 'Test Industry'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newIndustry)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label', newIndustry.label);
      expect(response.body).toHaveProperty('created_at');

      // Verify in database
      const exists = await helper.industryExists(response.body.iri);
      expect(exists).toBe(true);
    });

    it('should create industry with all fields', async () => {
      const framework1 = await helper.createTestFramework('Test Framework 1');
      const framework2 = await helper.createTestFramework('Test Framework 2');

      const newIndustry = {
        label: 'Complete Industry',
        description: 'Full description here',
        reportsUsing: [framework1, framework2]
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newIndustry)
        .expect(201);

      expect(response.body.label).toBe(newIndustry.label);
      expect(response.body.description).toBe(newIndustry.description);

      // Verify in database
      const detail = await helper.getIndustryDetail(response.body.iri);
      expect(detail.label).toBe(newIndustry.label);
      expect(detail.description).toBe(newIndustry.description);
      expect(detail.frameworks).toHaveLength(2);
    });

    it('should return correct response structure', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'New Industry' })
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('created_at');
      expect(typeof response.body.iri).toBe('string');
      expect(typeof response.body.label).toBe('string');
      expect(typeof response.body.created_at).toBe('string');
    });
  });

  describe('Field Validation', () => {
    it('should reject request without label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ description: 'Only description' })
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

    it('should reject label exceeding maximum length (200 chars)', async () => {
      const longLabel = 'A'.repeat(201);

      const response = await request(app)
        .post(baseUrl)
        .send({ label: longLabel })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject description exceeding maximum length (1000 chars)', async () => {
      const longDescription = 'A'.repeat(1001);

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          description: longDescription
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept description at maximum length (1000 chars)', async () => {
      const maxDescription = 'A'.repeat(1000);

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          description: maxDescription
        })
        .expect(201);

      expect(response.body.description).toBe(maxDescription);
    });
  });

  describe('Special Characters', () => {
    it('should handle label with ampersand', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Oil & Gas' })
        .expect(201);

      expect(response.body.label).toBe('Oil & Gas');
    });

    it('should handle label with parentheses', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Energy (Renewable)' })
        .expect(201);

      expect(response.body.label).toBe('Energy (Renewable)');
    });

    it('should handle label with special characters', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: 'Tech & Innovation - 2024' })
        .expect(201);

      expect(response.body.label).toBe('Tech & Innovation - 2024');
    });

    it('should handle Chinese characters in label', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({ label: '商业银行' })
        .expect(201);

      expect(response.body.label).toBe('商业银行');
    });

    it('should handle multiline description', async () => {
      const multilineDesc = 'Line 1\nLine 2\nLine 3';

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          description: multilineDesc
        })
        .expect(201);

      expect(response.body.description).toBe(multilineDesc);
    });

    it('should handle description with quotes', async () => {
      const descWithQuotes = 'This is a "quoted" description';

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          description: descWithQuotes
        })
        .expect(201);

      expect(response.body.description).toBe(descWithQuotes);
    });
  });

  describe('Uniqueness', () => {
    it('should reject duplicate label', async () => {
      const industry = { label: 'Duplicate Industry' };

      // First creation should succeed
      await request(app)
        .post(baseUrl)
        .send(industry)
        .expect(201);

      // Second creation should fail
      const response = await request(app)
        .post(baseUrl)
        .send(industry)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        message: expect.stringContaining('already exists')
      });
    });

    it('should allow different labels', async () => {
      await request(app)
        .post(baseUrl)
        .send({ label: 'Industry One' })
        .expect(201);

      await request(app)
        .post(baseUrl)
        .send({ label: 'Industry Two' })
        .expect(201);

      const count = await helper.getIndustryCount();
      expect(count).toBe(2);
    });
  });

  describe('ReportsUsing Field', () => {
    it('should accept empty reportsUsing array', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          reportsUsing: []
        })
        .expect(201);

      expect(response.body.label).toBe('Test Industry');
    });

    it('should accept single framework URI', async () => {
      const framework = await helper.createTestFramework('Test Framework');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          reportsUsing: [framework]
        })
        .expect(201);

      const detail = await helper.getIndustryDetail(response.body.iri);
      expect(detail.frameworks).toHaveLength(1);
      expect(detail.frameworks[0]).toBe(framework);
    });

    it('should accept multiple framework URIs', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const fw3 = await helper.createTestFramework('Framework 3');

      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          reportsUsing: [fw1, fw2, fw3]
        })
        .expect(201);

      const detail = await helper.getIndustryDetail(response.body.iri);
      expect(detail.frameworks).toHaveLength(3);
    });

    it('should reject invalid URI format', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          reportsUsing: ['not-a-valid-iri']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept framework URIs even if they do not exist (no FK constraint)', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send({
          label: 'Test Industry',
          reportsUsing: ['http://example.org/esg#NonExistentFramework']
        })
        .expect(201);

      expect(response.body.label).toBe('Test Industry');
    });
  });
});
