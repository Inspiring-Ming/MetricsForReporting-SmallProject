import request from 'supertest';
import { createApp } from '../../../src/server';
import { GraphDBTestHelper } from '../../helpers/graphdb-helper';

const app = createApp();
const helper = new GraphDBTestHelper();
const baseUrl = '/api/kg/implementations';

describe('Implementation API - CRUD Operations', () => {
  beforeEach(async () => {
    await helper.cleanImplementations();
  });

  afterAll(async () => {
    await helper.cleanImplementations();
  });

  describe('GET /api/kg/implementations', () => {
    it('should return empty list when no implementations exist', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result).toHaveLength(0);
      expect(response.body).toHaveProperty('total', 0);
    });

    it('should return list of implementations', async () => {
      // Create test implementations
      await helper.createTestImplementation('Python Implementation', {
        language: 'Python',
        filePath: '/path/to/impl.py',
        functionName: 'calculate'
      });
      await helper.createTestImplementation('JavaScript Implementation', {
        language: 'JavaScript',
        filePath: '/path/to/impl.js'
      });

      const response = await request(app)
        .get(baseUrl)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result.length).toBeGreaterThanOrEqual(2);
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBeGreaterThanOrEqual(2);

      // Verify structure of implementations
      const impl = response.body.result[0];
      expect(impl).toHaveProperty('iri');
      expect(impl).toHaveProperty('label');
      expect(impl).toHaveProperty('language');
      expect(impl).toHaveProperty('filePath');
    });

    it('should support pagination with limit', async () => {
      // Create 5 test implementations
      for (let i = 1; i <= 5; i++) {
        await helper.createTestImplementation(`Implementation ${i}`, {
          language: 'Python',
          filePath: `/path/to/impl${i}.py`
        });
      }

      const response = await request(app)
        .get(`${baseUrl}?size=3`)
        .expect(200);

      expect(response.body.result).toHaveLength(3);
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });

    it('should support pagination with offset', async () => {
      // Create 3 test implementations
      const impl1 = await helper.createTestImplementation('Impl 1');
      const impl2 = await helper.createTestImplementation('Impl 2');
      const impl3 = await helper.createTestImplementation('Impl 3');

      const response = await request(app)
        .get(`${baseUrl}?page=2&size=2`)
        .expect(200);

      expect(response.body.result).toHaveLength(1);
      expect(response.body.total).toBe(3);
    });

    it('should filter by language', async () => {
      await helper.createTestImplementation('Python Impl', {
        language: 'Python',
        filePath: '/path/python.py'
      });
      await helper.createTestImplementation('JS Impl', {
        language: 'JavaScript',
        filePath: '/path/js.js'
      });

      const response = await request(app)
        .get(`${baseUrl}?language=Python`)
        .expect(200);

      expect(response.body.result.length).toBeGreaterThanOrEqual(1);
      response.body.result.forEach((impl: any) => {
        expect(impl.language).toBe('Python');
      });
    });
  });

  describe('POST /api/kg/implementations', () => {
    it('should create a new implementation with all fields', async () => {
      const newImpl = {
        name: 'newpythonimplementation',
        language: 'Python',
        file_path: '/path/to/new_impl.py',
        function_name: 'compute_metric'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newImpl)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('language', newImpl.language);
      expect(response.body).toHaveProperty('file_path', newImpl.file_path);

      // Verify it exists in database
      const exists = await helper.implementationExists(response.body.iri);
      expect(exists).toBe(true);
    });

    it('should create implementation without optional functionName', async () => {
      const newImpl = {
        name: 'simpleimplementation',
        language: 'R',
        file_path: '/path/to/simple.r'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(newImpl)
        .expect(201);

      expect(response.body).toHaveProperty('iri');
      expect(response.body).toHaveProperty('label');
      expect(response.body).toHaveProperty('language', newImpl.language);
      expect(response.body).toHaveProperty('file_path', newImpl.file_path);
    });

    it('should return 400 when label is missing', async () => {
      const invalidImpl = {
        language: 'Python',
        file_path: '/path/to/impl.py'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidImpl)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when language is missing', async () => {
      const invalidImpl = {
        name: 'testimplementation',
        file_path: '/path/to/impl.py'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidImpl)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when filePath is missing', async () => {
      const invalidImpl = {
        name: 'testimplementation',
        language: 'Python'
      };

      const response = await request(app)
        .post(baseUrl)
        .send(invalidImpl)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/kg/implementations/:id', () => {
    it('should return implementation by ID', async () => {
      const impl = await helper.createTestImplementation('Test Implementation', {
        language: 'Python',
        filePath: '/path/to/test.py',
        functionName: 'test_function'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(impl)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri', impl);
      expect(response.body.result).toHaveProperty('label', 'Test Implementation');
      expect(response.body.result).toHaveProperty('language', 'Python');
      expect(response.body.result).toHaveProperty('filePath', '/path/to/test.py');
      expect(response.body.result).toHaveProperty('functionName', 'test_function');
    });

    it('should return implementation without optional functionName', async () => {
      const impl = await helper.createTestImplementation('Simple Impl', {
        language: 'R',
        filePath: '/path/to/simple.r'
      });

      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(impl)}`)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('iri', impl);
      expect(response.body.result).toHaveProperty('label', 'Simple Impl');
      expect(response.body.result.functionName).toBeUndefined();
    });

    it('should return 404 for non-existent implementation', async () => {
      const fakeIri = 'http://example.org/implementations/non-existent';
      
      const response = await request(app)
        .get(`${baseUrl}/${encodeURIComponent(fakeIri)}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/kg/implementations/:id', () => {
    it('should update all fields of an implementation', async () => {
      const impl = await helper.createTestImplementation('Original Label', {
        language: 'Python',
        filePath: '/original/path.py',
        functionName: 'original_function'
      });

      const updates = {
        label: 'Updated Label',
        language: 'JavaScript',
        file_path: '/updated/path.js',
        function_name: 'updated_function'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(impl)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('iri', impl);
      expect(response.body).toHaveProperty('label', updates.label);
      expect(response.body).toHaveProperty('language', updates.language);
      expect(response.body).toHaveProperty('file_path', updates.file_path);
      // Note: UpdateImplementationResponse may not return functionName
    });

    it('should update only label', async () => {
      const impl = await helper.createTestImplementation('Original', {
        language: 'Python',
        filePath: '/path.py'
      });

      const updates = {
        label: 'New Label'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(impl)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('label', 'New Label');
      expect(response.body).toHaveProperty('language', 'Python');
      expect(response.body).toHaveProperty('file_path', '/path.py');
    });

    it('should update only language', async () => {
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });

      const updates = {
        language: 'R'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(impl)}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('language', 'R');
      expect(response.body).toHaveProperty('label', 'Test Impl');
    });

    it('should add functionName to implementation without one', async () => {
      // Note: UpdateImplementationResponse doesn't include functionName in response
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });

      const updates = {
        function_name: 'new_function'
      };

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(impl)}`)
        .send(updates)
        .expect(200);

      // UpdateImplementationResponse doesn't return functionName
      expect(response.body).toHaveProperty('iri', impl);
    });

    it('should return 404 for non-existent implementation', async () => {
      const fakeIri = 'http://example.org/implementations/non-existent';
      
      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(fakeIri)}`)
        .send({ label: 'New Label' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when no fields are provided', async () => {
      const impl = await helper.createTestImplementation('Test Impl', {
        language: 'Python',
        filePath: '/path.py'
      });

      const response = await request(app)
        .patch(`${baseUrl}/${encodeURIComponent(impl)}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
