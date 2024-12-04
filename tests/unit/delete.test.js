// test/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('Delete /v1/fragments:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/fakeid').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/fakeid')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Authorized user can delete a fragment
  test('delete a exist fragment by id returns 200 status code', async () => {
    const data = 'This is a plain text fragment';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send(data)
      .set('Content-Type', 'text/plain');

    const fragment = postRes.body.fragment;

    const delRes = await request(app)
      .delete(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(delRes.status).toBe(200);
    expect(delRes.body.status).toBe('ok');
  });

  // Authorized user deletes a non-exist fragment lead to a 404 err
  test('delete a non-exist fragment by id returns a 404 err', async () => {
    const delRes = await request(app)
      .delete(`/v1/fragments/fakeid`)
      .auth('user1@email.com', 'password1');

    expect(delRes.status).toBe(404);
    expect(delRes.body.status).toBe('error');
    expect(delRes.body.error.code).toBe(404);
    expect(delRes.body.error.message).toEqual('Fragment by id not found');
  });
});
