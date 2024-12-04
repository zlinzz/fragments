// tests/unit/getIdInfo.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');

describe('GET /v1/fragments/:id/info', () => {
  let ownerId, fragment, fragmentData, type;

  // Write Fragment and Fragment data into the database before each test
  // So we can use them as test Fragments
  beforeEach(async () => {
    ownerId = hashEmail('user1@email.com');
    fragmentData = Buffer.from('This is a fragment');
    type = 'text/plain';

    // Create and save a fragment with data in the database
    fragment = new Fragment({
      ownerId: ownerId,
      type: type,
    });
    await fragment.save();
    await fragment.setData(fragmentData);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get(`/v1/fragments/${fragment.id}/info`).expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('should return fragment metadata when id exist', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toEqual(fragment); // Use .toEqual for object comparisons
  });

  test('should return 404 when id is not found', async () => {
    const fakeId = '1234';
    const res = await request(app)
      .get(`/v1/fragments/${fakeId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment by id not found');
  });

  test('should return 500 when internal server error happen', async () => {
    jest.spyOn(Fragment, 'byId').mockRejectedValueOnce(new Error('Internal server error'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal Server Error');
  });
});
