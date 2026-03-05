const request = require('supertest');
const app = require('./index');

describe('Resilience Atlas API Tests', () => {
  describe('Authentication Endpoints', () => {
    
    test('POST /auth/signup - Create new user', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    test('POST /auth/signup - Duplicate email returns 409', async () => {
      await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send({
          username: 'testuser1',
          email: 'duplicate@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send({
          username: 'testuser2',
          email: 'duplicate@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
    });

    test('POST /auth/login - Valid credentials', async () => {
      await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('POST /auth/login - Invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Health Check', () => {
    test('GET /health - Returns 200', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
    });
  });
});
