// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');

describe('PUT /v1/fragments/:id', () => {
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

  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', async () => {
    await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .send('This is updated data')
      .set('Content-Type', 'text/plain')
      .expect(401);
  });

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', async () =>
    await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('invalid@email.com', 'incorrect_password')
      .send('This is updated data')
      .set('Content-Type', 'text/plain')
      .expect(401));

  // Authorized user can update an exist fragment
  test('Authorized user can update an exist fragment', async () => {
    const res = await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .send('This is updated data')
      .set('Content-Type', 'text/plain')
      .expect(200);

    expect(res.body.status).toEqual('ok');
    expect(res.body.fragment.size).toBe(20);
    expect(res.body.fragment.created).not.toEqual(res.body.fragment.updated);
    expect(res.body.fragment.format).toEqual(fragment.format);
  });

  // Modification of type is not allowed
  test("Authorized user can not update fragment's type", async () => {
    const res = await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .send('<p>This is updated data<p>')
      .set('Content-Type', 'text/html');

    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 400,
        message: "A fragment's type can not be changed after it is created",
      },
    });
  });

  // Update a non-exist fragment should return 404
  test('Update a non-exist fragment should return 404', async () => {
    const res = await request(app)
      .put(`/v1/fragments/fakeid`)
      .auth('user1@email.com', 'password1')
      .send('This is updated data')
      .set('Content-Type', 'text/plain')
      .expect(404);

    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: 'Fragment by id not found',
      },
    });
  });

  // An internal server error should return 500
  test('Internal server errors should return 500', async () => {
    jest
      .spyOn(Fragment.prototype, 'setData')
      .mockRejectedValueOnce(new Error('fragment.setData is not a function'));

    const res = await request(app)
      .put(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1')
      .send('This is updated data')
      .set('Content-Type', 'text/plain')
      .expect(500);

    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal Server Error: fragment.setData is not a function',
      },
    });

    // Restore the original method
    Fragment.prototype.setData.mockRestore();
  });
});
