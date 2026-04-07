const request = require('supertest');
const app = require('./index');

describe('Resilience Atlas API Tests', () => {
  describe('Authentication — SPA-friendly redirects', () => {

    test('GET /login redirects to /results-history SPA route (no Auth0 authorize URL generated)', async () => {
      const res = await request(app).get('/login');
      // Must be a redirect into the SPA — no server-side Auth0 authorize URL
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/results-history');
    });

    test('GET /login with valid returnTo preserves the target path', async () => {
      const res = await request(app).get('/login?returnTo=/results');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/results');
    });

    test('GET /login with unsafe returnTo (protocol-relative) redirects to /results-history', async () => {
      const res = await request(app).get('/login?returnTo=//evil.com');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/results-history');
    });

    test('GET /register redirects to /results-history SPA route (no local registration form)', async () => {
      const res = await request(app).get('/register');
      // Must be a redirect into the SPA — no local registration form rendered
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/results-history');
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
