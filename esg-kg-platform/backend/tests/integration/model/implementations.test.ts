import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/models';

describe('Model API - Implementations Endpoints', () => {
  beforeEach(async () => {
    await helper.cleanImplementations();
    await helper.cleanModels();
  });

  afterAll(async () => {
    await helper.cleanImplementations();
    await helper.cleanModels();
  });

  describe('GET /api/kg/models/:id/implementations', () => {
    it('should return implementations for a model', async () => {
      const impl1 = await helper.createTestImplementation('Python Implementation', {
        language: 'Python',
        filePath: '/path/to/impl.py',
        functionName: 'calculate'
      });
      const impl2 = await helper.createTestImplementation('JavaScript Implementation', {
        language: 'JavaScript',
        filePath: '/path/to/impl.js',
        functionName: 'compute'
      });
      
      const model = await helper.createTestModel('Test Model', []);
      await helper.linkImplementationToModel(model, impl1);
      await helper.linkImplementationToModel(model, impl2);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId', model);
      expect(response.body).toHaveProperty('modelLabel', 'Test Model');
      expect(response.body).toHaveProperty('implementations');
      expect(response.body).toHaveProperty('total', 2);
      expect(Array.isArray(response.body.implementations)).toBe(true);
      expect(response.body.implementations).toHaveLength(2);

      // Check implementation structure
      response.body.implementations.forEach((impl: any) => {
        expect(impl).toHaveProperty('iri');
        expect(impl).toHaveProperty('label');
        expect(impl).toHaveProperty('language');
        expect(impl).toHaveProperty('filePath');
        // functionName is optional
      });

      // Verify specific implementations
      const labels = response.body.implementations.map((i: any) => i.label);
      expect(labels).toContain('Python Implementation');
      expect(labels).toContain('JavaScript Implementation');
    });

    it('should return empty implementations array for model with no implementations', async () => {
      const model = await helper.createTestModel('Empty Model', []);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(response.body.modelId).toBe(model);
      expect(response.body.implementations).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should sort implementations by label alphabetically', async () => {
      const implZ = await helper.createTestImplementation('Z Implementation');
      const implA = await helper.createTestImplementation('A Implementation');
      const implM = await helper.createTestImplementation('M Implementation');
      
      const model = await helper.createTestModel('Test Model', []);
      await helper.linkImplementationToModel(model, implZ);
      await helper.linkImplementationToModel(model, implA);
      await helper.linkImplementationToModel(model, implM);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      const labels = response.body.implementations.map((i: any) => i.label);
      expect(labels).toEqual(['A Implementation', 'M Implementation', 'Z Implementation']);
    });

    it('should return 404 if model does not exist', async () => {
      await request(app)
        .get(`${baseUrl}/nonexistent-model/implementations`)
        .expect(404);
    });

    it('should handle implementations with optional fields', async () => {
      const impl = await helper.createTestImplementation('Minimal Implementation');
      const model = await helper.createTestModel('Test Model', []);
      await helper.linkImplementationToModel(model, impl);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(response.body.implementations).toHaveLength(1);
      expect(response.body.implementations[0].label).toBe('Minimal Implementation');
    });

    it('should have correct response structure', async () => {
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(response.body).toHaveProperty('modelId');
      expect(response.body).toHaveProperty('modelLabel');
      expect(response.body).toHaveProperty('implementations');
      expect(response.body).toHaveProperty('total');
      expect(typeof response.body.modelId).toBe('string');
      expect(typeof response.body.modelLabel).toBe('string');
      expect(Array.isArray(response.body.implementations)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });
  });

  describe('POST /api/kg/models/:id/implementations', () => {
    it('should add an implementation to a model', async () => {
      const impl = await helper.createTestImplementation('Test Implementation', {
        language: 'Python',
        filePath: '/path/to/impl.py'
      });
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl })
        .expect(201);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('implementation_iri', impl);
      expect(response.body).toHaveProperty('added_at');
      expect(typeof response.body.added_at).toBe('string');

      // Verify the implementation was actually added
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(verifyResponse.body.implementations).toHaveLength(1);
      expect(verifyResponse.body.implementations[0].iri).toBe(impl);
    });

    it('should add multiple implementations to a model', async () => {
      const impl1 = await helper.createTestImplementation('Implementation 1');
      const impl2 = await helper.createTestImplementation('Implementation 2');
      const model = await helper.createTestModel('Test Model', []);

      // Add first implementation
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl1 })
        .expect(201);

      // Add second implementation
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl2 })
        .expect(201);

      // Verify both implementations were added
      const verifyResponse = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .expect(200);

      expect(verifyResponse.body.implementations).toHaveLength(2);
      const iris = verifyResponse.body.implementations.map((i: any) => i.iri);
      expect(iris).toContain(impl1);
      expect(iris).toContain(impl2);
    });

    it('should return 404 if model does not exist', async () => {
      const impl = await helper.createTestImplementation('Test Implementation');

      await request(app)
        .post(`${baseUrl}/nonexistent-model/implementations`)
        .send({ implementationId: impl })
        .expect(404);
    });

    it('should return 400 if implementationId is missing', async () => {
      const model = await helper.createTestModel('Test Model', []);

      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({})
        .expect(400);
    });

    it('should handle adding the same implementation multiple times gracefully', async () => {
      const impl = await helper.createTestImplementation('Test Implementation');
      const model = await helper.createTestModel('Test Model', []);

      // Add implementation first time
      await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl })
        .expect(201);

      // Add same implementation second time (should succeed or handle gracefully)
      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl })
        .expect(201);

      expect(response.body).toHaveProperty('model_iri', model);
      expect(response.body).toHaveProperty('implementation_iri', impl);
    });

    it('should have correct response structure', async () => {
      const impl = await helper.createTestImplementation('Test Implementation');
      const model = await helper.createTestModel('Test Model', []);

      const response = await request(app)
        .post(`${baseUrl}/${encodeURIComponent(model)}/implementations`)
        .send({ implementationId: impl })
        .expect(201);

      expect(response.body).toHaveProperty('model_iri');
      expect(response.body).toHaveProperty('implementation_iri');
      expect(response.body).toHaveProperty('added_at');
      expect(typeof response.body.model_iri).toBe('string');
      expect(typeof response.body.implementation_iri).toBe('string');
      expect(typeof response.body.added_at).toBe('string');
      
      // Verify it's a valid ISO timestamp
      expect(new Date(response.body.added_at).toISOString()).toBe(response.body.added_at);
    });
  });
});
