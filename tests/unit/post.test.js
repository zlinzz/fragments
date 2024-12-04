// tests/unit/get.test.js
const request = require('supertest');
const app = require('../../src/app');
const hashEmail = require('../../src/hash');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Authenticated users can create a plain text fragment
  test('authenticated users can create a plain text fragment and response includes expected fragment properties', async () => {
    const data = 'This is a plain text fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send(data)
      .set('Content-Type', 'text/plain');

    // Check status code
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const fragment = res.body.fragment;
    const expectEmail = hashEmail('user1@email.com');
    // Check responses include all necessary properties
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type');
    expect(fragment).toHaveProperty('size');

    // Make sure the created and updated value is ISO string format
    expect(fragment.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(fragment.updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    // Check if the values match expectation
    expect(fragment.ownerId).toBe(expectEmail);
    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(data.length);
    expect(res.headers.location).toContain(`/v1/fragments/${fragment.id}`);
  });

  // Request with unsupported content type will be rejected with 415 status code
  test('unsupported Content-Type is rejected with 415 error', async () => {
    const xmlData = '<note><to>User</to><from>Admin</from><message>Hello</message></note>';

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send(xmlData)
      .set('Content-Type', 'application/xml');

    // Check status code and error message
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported Content-Type');
  });
});
