// tests/unit/app.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /non-existent-route', () => {
    // Make a request to an non-exist route
    test('should return 404 for non-existent route', async () => {
        const res = await request(app).get('/non-existent-route');
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: 'error',
            error: {
              message: 'not found',
              code: 404,
            }
        });
    });
  });