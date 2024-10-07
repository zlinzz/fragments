// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // Retrieved Fragment array should match expect result
  test('Retrieved fragments array includes expected ids', async () => {
    // Create test fragments and save in database
    const hashedOwnerId = hashEmail('user1@email.com');
    const fragment1 = new Fragment({
      ownerId: hashedOwnerId,
      type: 'text/plain',
    });
    const fragment2 = new Fragment({
      ownerId: hashedOwnerId,
      type: 'text/plain',
    });
    await fragment1.save();
    await fragment2.save();

    // Make a get request to get back a list of id of the current user
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);

    // Expected idList:
    const idList = await Fragment.byUser(hashedOwnerId);
    // Check if the response contains the created/expected ids
    idList.forEach((id) => {
      expect(res.body.fragments).toContain(id);
    });
  });
});

// Mock byUser throw an error when send a request to Get /fragments route and check the output
test('returns 500 when an error occurs', async () => {
  // Mock byUser() throw an error
  const mockByUser = jest
    .spyOn(Fragment, 'byUser')
    .mockRejectedValue(new Error('Error retrieving fragments for user'));

  const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
  expect(res.statusCode).toBe(500);
  expect(res.body).toEqual({
    status: 'error',
    error: {
      code: 500,
      message: 'Unable to retrieve fragments',
    },
  });

  // Restore the original method
  mockByUser.mockRestore();
});
