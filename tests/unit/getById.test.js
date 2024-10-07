// tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');

describe('GET /v1/fragments/:id', () => {
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

  test('should return 500 when an internal server error occurs', async () => {
    // Mock byId() throw an error when id not found
    jest.spyOn(Fragment, 'byId').mockRejectedValueOnce(new Error('Fragment by id not found'));

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

  test('should convert fragment data for valid extension', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragment.id}.txt`) // Only .txt is supported at this point
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.text).toBe('This is a fragment');
  });
});
