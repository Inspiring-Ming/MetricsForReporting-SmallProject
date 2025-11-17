import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/industries';

describe('Industry API - DELETE /api/kg/industries/:id', () => {
  beforeEach(async () => {
    await helper.cleanIndustries();
  });

  afterAll(async () => {
    await helper.cleanIndustries();
  });

  describe('Normal Deletion', () => {
    it('should delete an industry without frameworks', async () => {
      const uri = await helper.createTestIndustry('To Be Deleted', 'Description');
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        deleted: true,
        uri: expect.any(String),
        deleted_at: expect.any(String)
      });

      // Verify deletion
      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });

    it('should return 404 when deleting non-existent industry', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/nonexistent`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle deletion by full URI format', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const encodedUri = encodeURIComponent(uri);

      await request(app)
        .delete(`${baseUrl}/${encodedUri}`)
        .expect(200);

      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('should return 409 when deleting industry with frameworks (without force)', async () => {
      const fw = await helper.createTestFramework('Test Framework');
      const uri = await helper.createTestIndustry('Protected Industry', 'Desc', [fw]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'DELETE_CONFLICT',
        message: expect.stringContaining('associated reporting frameworks')
      });

      // Verify not deleted
      const exists = await helper.industryExists(uri);
      expect(exists).toBe(true);
    });

    it('should list associated frameworks in conflict error', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const uri = await helper.createTestIndustry('Protected Industry', 'Desc', [fw1, fw2]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(409);

      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('associatedFrameworks');
      expect(response.body.error.details.associatedFrameworks).toHaveLength(2);
    });
  });

  describe('Force Delete', () => {
    it('should delete industry with frameworks when force=true', async () => {
      const fw = await helper.createTestFramework('Test Framework');
      const uri = await helper.createTestIndustry('Force Delete Industry', 'Desc', [fw]);
      const shortId = uri.split('#')[1];

      const response = await request(app)
        .delete(`${baseUrl}/${shortId}?force=true`)
        .expect(200);

      expect(response.body.deleted).toBe(true);

      // Verify deletion
      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });

    it('should cascade delete all triples when force=true', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const uri = await helper.createTestIndustry('Cascade Delete', 'Description', [fw1, fw2]);
      const shortId = uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}?force=true`)
        .expect(200);

      // Verify no triples remain
      const detail = await helper.getIndustryDetail(uri);
      expect(detail).toBeNull();
    });

    it('should accept force=false and still check conflicts', async () => {
      const fw = await helper.createTestFramework('Test Framework');
      const uri = await helper.createTestIndustry('Test Industry', 'Desc', [fw]);
      const shortId = uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}?force=false`)
        .expect(409);

      // Verify not deleted
      const exists = await helper.industryExists(uri);
      expect(exists).toBe(true);
    });
  });

  describe('Database Verification', () => {
    it('should verify triple count decreases after deletion', async () => {
      await helper.createTestIndustry('Industry 1');
      await helper.createTestIndustry('Industry 2');
      const uri3 = await helper.createTestIndustry('Industry 3');

      const countBefore = await helper.getIndustryCount();
      expect(countBefore).toBe(3);

      const shortId = uri3.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const countAfter = await helper.getIndustryCount();
      expect(countAfter).toBe(2);
    });

    it('should verify all triples removed after deletion', async () => {
      const uri = await helper.createTestIndustry('Test Industry', 'Test Description');
      const shortId = uri.split('#')[1];

      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      // Verify no traces in database
      const detail = await helper.getIndustryDetail(uri);
      expect(detail).toBeNull();
    });

    it('should not affect other industries when deleting one', async () => {
      const uri1 = await helper.createTestIndustry('Industry 1', 'Desc 1');
      const uri2 = await helper.createTestIndustry('Industry 2', 'Desc 2');

      const shortId1 = uri1.split('#')[1];
      await request(app)
        .delete(`${baseUrl}/${shortId1}`)
        .expect(200);

      // Verify second industry still exists
      const detail2 = await helper.getIndustryDetail(uri2);
      expect(detail2).not.toBeNull();
      expect(detail2.label).toBe('Industry 2');
    });
  });

  describe('Edge Cases', () => {
    it('should return 404 when deleting already deleted industry', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const shortId = uri.split('#')[1];

      // First deletion
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      // Second deletion attempt
      const response = await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle delete with invalid force parameter format', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const shortId = uri.split('#')[1];

      // Should treat invalid format as false
      await request(app)
        .delete(`${baseUrl}/${shortId}?force=invalid`)
        .expect(200);

      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });

    it('should handle concurrent delete attempts gracefully', async () => {
      const uri = await helper.createTestIndustry('Test Industry');
      const shortId = uri.split('#')[1];

      // Send two delete requests simultaneously
      const [response1, response2] = await Promise.all([
        request(app).delete(`${baseUrl}/${shortId}`),
        request(app).delete(`${baseUrl}/${shortId}`)
      ]);

      // At least one should succeed (200)
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toContain(200);
      // Both might succeed due to timing, or one might fail
      expect([200, 404]).toContain(statuses[0]);
      expect([200, 404]).toContain(statuses[1]);
    });
  });

  describe('Integration with Frameworks', () => {
    it('should allow deletion after removing all framework associations', async () => {
      const fw = await helper.createTestFramework('Test Framework');
      const uri = await helper.createTestIndustry('Test Industry', 'Desc', [fw]);
      const shortId = uri.split('#')[1];

      // Remove frameworks first
      await request(app)
        .patch(`${baseUrl}/${shortId}`)
        .send({ reportsUsing: [] })
        .expect(200);

      // Now deletion should succeed without force
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(200);

      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });

    it('should protect industry with multiple frameworks unless force=true', async () => {
      const fw1 = await helper.createTestFramework('Framework 1');
      const fw2 = await helper.createTestFramework('Framework 2');
      const fw3 = await helper.createTestFramework('Framework 3');
      const uri = await helper.createTestIndustry('Protected', 'Desc', [fw1, fw2, fw3]);
      const shortId = uri.split('#')[1];

      // Should fail without force
      await request(app)
        .delete(`${baseUrl}/${shortId}`)
        .expect(409);

      // Should succeed with force
      await request(app)
        .delete(`${baseUrl}/${shortId}?force=true`)
        .expect(200);

      const exists = await helper.industryExists(uri);
      expect(exists).toBe(false);
    });
  });
});
