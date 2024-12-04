// tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');

describe('GET /v1/fragments/:id', () => {
  let ownerId, fragment, fragment2, fragmentData, fragmentData2, type, type2;

  // Write Fragment and Fragment data into the database before each test
  // So we can use them as test Fragments
  beforeEach(async () => {
    ownerId = hashEmail('user1@email.com');
    fragmentData = Buffer.from('This is a fragment');
    type = 'text/plain';

    fragmentData2 = Buffer.from('## Markdown fragment');
    type2 = 'text/markdown';

    // Create and save a fragment with data in the database
    fragment = new Fragment({
      ownerId: ownerId,
      type: type,
    });
    await fragment.save();
    await fragment.setData(fragmentData);

    fragment2 = new Fragment({
      ownerId: ownerId,
      type: type2,
    });
    await fragment2.save();
    await fragment2.setData(fragmentData2);
  });

  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get(`/v1/fragments/${fragment.id}`).expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('should return 404 when fragment id is not found', async () => {
    // Mock byId() throw an error when id not found
    jest.spyOn(Fragment, 'byId').mockRejectedValueOnce(new Error('Fragment by id not found'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: 'Fragment by id not found',
      },
    });

    // Restore the original method
    Fragment.byId.mockRestore();
  });

  test('should return 500 when an internal server error occurs', async () => {
    // Mock byId() throw an error due to internal server problem
    jest.spyOn(Fragment, 'byId').mockRejectedValueOnce(new Error('Internal server error'));

    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal Server Error',
      },
    });

    // Restore the original method
    Fragment.byId.mockRestore();
  });

  test('should return 415 for unsupported type conversion', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.html`) // Invalid conversion to unsupported type
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 415,
        message: 'A text/plain type fragment cannot be returned as a html',
      },
    });
  });

  test('should return fragment data when no extension is provided', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.text).toBe('This is a fragment');
  });

  test('should convert txt to txt', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.txt`) // convert txt to txt
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toBe('This is a fragment');
  });

  test('should convert md to html', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment2.id}.html`) // convert md to html
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<h2>Markdown fragment</h2>'); // A newline maybe added when converted
  });
});
