import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/implementations';

describe('Implementation API - DELETE /api/kg/implementations/:id', () => {
  beforeEach(async () => {
    await helper.cleanImplementations();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanImplementations();
    await helper.cleanModels();
  });

  it('should delete an implementation', async () => {
    const impl = await helper.createTestImplementation('Test Implementation', {
      language: 'Python',
      filePath: '/path/to/impl.py'
    });

    // Verify implementation exists
    const existsBefore = await helper.implementationExists(impl);
    expect(existsBefore).toBe(true);

    const response = await request(app)
      .delete(`${baseUrl}/${encodeURIComponent(impl)}`)
      .expect(200);

    expect(response.body).toHaveProperty('iri');
    expect(response.body).toHaveProperty('deleted', true);
    expect(response.body).toHaveProperty('deleted_at');
    expect(typeof response.body.deleted_at).toBe('string');

    // Verify implementation no longer exists
    const existsAfter = await helper.implementationExists(impl);
    expect(existsAfter).toBe(false);
  });

  it('should remove implementation from models when deleted with force', async () => {
    const impl = await helper.createTestImplementation('Test Implementation');
    const model = await helper.createTestModel('Test Model', []);
    
    // Add implementation to model
    await helper.linkImplementationToModel(model, impl);

    // Verify implementation is linked
    const linkedBefore = await helper.getModelImplementations(model);
    expect(linkedBefore).toContain(impl);

    // Delete implementation with force
    await request(app)
      .delete(`${baseUrl}/${encodeURIComponent(impl)}?force=true`)
      .expect(200);

    // Verify implementation is no longer linked to model
    const linkedAfter = await helper.getModelImplementations(model);
    expect(linkedAfter).not.toContain(impl);
  });

  it('should return 404 if implementation does not exist', async () => {
    await request(app)
      .delete(`${baseUrl}/nonexistent-implementation`)
      .expect(404);
  });

  it('should delete implementation with multiple model associations when force=true', async () => {
    const impl = await helper.createTestImplementation('Shared Implementation');
    const model1 = await helper.createTestModel('Model 1', []);
    const model2 = await helper.createTestModel('Model 2', []);
    
    // Add implementation to both models
    await helper.linkImplementationToModel(model1, impl);
    await helper.linkImplementationToModel(model2, impl);

    // Delete implementation with force
    await request(app)
      .delete(`${baseUrl}/${encodeURIComponent(impl)}?force=true`)
      .expect(200);

    // Verify implementation no longer exists
    const exists = await helper.implementationExists(impl);
    expect(exists).toBe(false);

    // Verify implementation is removed from both models
    const linked1 = await helper.getModelImplementations(model1);
    const linked2 = await helper.getModelImplementations(model2);
    expect(linked1).not.toContain(impl);
    expect(linked2).not.toContain(impl);
  });

  it('should fail to delete implementation with model associations without force flag', async () => {
    const impl = await helper.createTestImplementation('Test Implementation');
    const model = await helper.createTestModel('Test Model', []);
    
    // Add implementation to model
    await helper.linkImplementationToModel(model, impl);

    // Try to delete without force flag (should fail with conflict error)
    const response = await request(app)
      .delete(`${baseUrl}/${encodeURIComponent(impl)}`)
      .expect(409);

    expect(response.body).toHaveProperty('error');

    // Verify implementation still exists
    const exists = await helper.implementationExists(impl);
    expect(exists).toBe(true);
  });

  it('should have correct response structure', async () => {
    const impl = await helper.createTestImplementation('Test Implementation');

    const response = await request(app)
      .delete(`${baseUrl}/${encodeURIComponent(impl)}`)
      .expect(200);

    expect(response.body).toHaveProperty('iri');
    expect(response.body).toHaveProperty('deleted');
    expect(response.body).toHaveProperty('deleted_at');
    expect(typeof response.body.iri).toBe('string');
    expect(typeof response.body.deleted).toBe('boolean');
    expect(typeof response.body.deleted_at).toBe('string');
    
    // Verify it's a valid ISO timestamp
    expect(new Date(response.body.deleted_at).toISOString()).toBe(response.body.deleted_at);
  });
});
