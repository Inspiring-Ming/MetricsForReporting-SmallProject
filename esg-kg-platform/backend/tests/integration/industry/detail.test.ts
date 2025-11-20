import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/industries';

describe('Industry API - GET /api/kg/industries/:id (Detail)', () => {
  beforeEach(async () => {
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanIndustries();
  });

  describe('Normal Query', () => {
    it('should get industry detail by full URI', async () => {
      const uri = await helper.createTestIndustry('Test Industry', 'Test Description');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri', uri);
      expect(response.body.result).toHaveProperty('label', 'Test Industry');
      expect(response.body.result).toHaveProperty('description', 'Test Description');
    });

    it('should get industry detail by short ID', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('iri', uri);
      expect(response.body.result).toHaveProperty('label', 'Test Industry');
    });

    it('should get industry detail by namespace format', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const shortId = uri.split('#')[1];
      const namespaceId = `esg:${shortId}`;

      const response = await request(app)
        .get(`${baseUrl}/${namespaceId}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('label', 'Test Industry');
    });

    it('should return complete information structure', async () => {
      const uri = await helper.createTestIndustry('Complete Industry', 'Full description');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri');
      expect(response.body.result).toHaveProperty('label');
      expect(response.body.result).toHaveProperty('description');
    });
  });

  describe('ReportsUsing Associations', () => {
    it('should return empty reportsUsing when no frameworks associated', async () => {
      const uri = await helper.createTestIndustry('Industry Without Frameworks');

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.reportsUsing).toBeUndefined();
    });

    it('should return single associated framework', async () => {
      const framework = await helper.createTestFramework('Test Framework');
      const uri = await helper.createTestIndustry('Test Industry', 'Desc', [framework]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.reportsUsing).toHaveLength(1);
      expect(response.body.result.reportsUsing[0]).toHaveProperty('iri', framework);
      expect(response.body.result.reportsUsing[0]).toHaveProperty('label');
    });

    it('should return multiple associated frameworks', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const fw3 = await helper.createTestFramework('Framework 3');

      const uri = await helper.createTestIndustry('Test Industry', 'Desc', [fw1, fw2, fw3]);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(uri)}`)
        .expect(200);

      expect(response.body.result.reportsUsing).toHaveLength(3);
      const frameworkIris = response.body.result.reportsUsing.map((f: any) => f.iri);
      expect(frameworkIris).toContain(fw1);
      expect(frameworkIris).toContain(fw2);
      expect(frameworkIris).toContain(fw3);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when industry does not exist', async () => {
      const response = await request(app)
        .get(`${baseUrl}/nonexistent`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        message: expect.stringContaining('not found')
      });
    });

    it('should return 404 for non-existent full URI', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent('http://example.org/esg#nonexistent')}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty ID', async () => {
      // URL-encoded space will be trimmed by service validation
      // Service will throw ValidationError (400) for empty/whitespace-only IDs
      const response = await request(app)
        .get(`${baseUrl}/%20`) // URL-encoded space
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('URI Format Compatibility', () => {
    let testUri: string;

    beforeEach(async () => {
      testUri = await helper.createTestIndustry('URI Test Industry');
    });

    it('should accept http:// URI', async () => {
      await request(app)
        .get(`${baseUrl}/${encodeURIComponent(testUri)}`)
        .expect(200);
    });

    it('should accept namespace prefix format', async () => {
      const shortId = testUri.split('#')[1];
      await request(app)
        .get(`${baseUrl}/esg:${shortId}`)
        .expect(200);
    });

    it('should accept plain identifier', async () => {
      const shortId = testUri.split('#')[1];
      await request(app)
        .get(`${baseUrl}/${shortId}`)
        .expect(200);
    });
  });
});
