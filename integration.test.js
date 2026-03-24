const request = require('supertest');
const app = require('./index');

describe('Resilience Atlas API Tests', () => {
  describe('Authentication — Auth0 Universal Login', () => {

    test('GET /login redirects to Auth0 (no local login form)', async () => {
      const res = await request(app).get('/login');
      // Must be a redirect — no local login form should be rendered
      expect(res.status).toBe(302);
    });

    test('GET /register redirects to Auth0 (no local registration form)', async () => {
      const res = await request(app).get('/register');
      // Must be a redirect — no local registration form should be rendered
      expect(res.status).toBe(302);
    });

    test('POST /auth/signup returns 404 (local signup endpoint removed)', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(404);
    });

    test('POST /auth/login returns 404 (local login endpoint removed)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(404);
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
