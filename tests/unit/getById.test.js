// tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hashEmail = require('../../src/hash');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

describe('GET /v1/fragments/:id', () => {
  describe('Authentication tests', () => {
    let ownerId, fragment, fragmentData, type;
    // Write Fragment and Fragment data into the database before each test
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
    test('unauthenticated requests are denied', () =>
      request(app).get(`/v1/fragments/${fragment.id}`).expect(401));

    // If the wrong username/password pair are used (no such user), it should be forbidden
    test('incorrect credentials are denied', () =>
      request(app)
        .get(`/v1/fragments/${fragment.id}`)
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));
  });

  describe('Error case tests', () => {
    let ownerId, fragment, fragmentData, type;
    // Write Fragment and Fragment data into the database before each test
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
  });

  describe('Successful responses and conversion', () => {
    test('should return fragment data when no extension is provided', async () => {
      let ownerId, fragment, fragmentData, type;
      ownerId = hashEmail('user1@email.com');
      fragmentData = Buffer.from('This is a fragment');
      type = 'text/plain';

      fragment = new Fragment({
        ownerId: ownerId,
        type: type,
      });
      await fragment.save();
      await fragment.setData(fragmentData);

      const res = await request(app)
        .get(`/v1/fragments/${fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain');
      expect(res.text).toBe('This is a fragment');
    });

    // tests with extensions
    describe('Should convert txt to supported type', () => {
      test('should convert txt to txt', async () => {
        let ownerId, fragment, fragmentData, type;
        ownerId = hashEmail('user1@email.com');
        fragmentData = Buffer.from('This is a fragment');
        type = 'text/plain';

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);

        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toBe('This is a fragment');
      });
    });

    describe('Should convert md to supported types', () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        fragmentData = Buffer.from('## Markdown fragment');
        type = 'text/markdown';

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test('should convert md to md', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/markdown');
        expect(res.text).toEqual('## Markdown fragment');
      });

      test('should convert md to html', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
        // A newline maybe added when converted so use toContain
        expect(res.text).toContain('<h2>Markdown fragment</h2>');
      });

      test('should convert md to html', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toEqual('MARKDOWN FRAGMENT');
      });
    });

    describe('Should convert html to supported types', () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        fragmentData = Buffer.from('<h2>Markdown fragment</h2>');
        type = 'text/html';

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test('should convert html to html', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
        expect(res.text).toEqual('<h2>Markdown fragment</h2>');
      });

      test('should convert html to txt', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toEqual('MARKDOWN FRAGMENT');
      });
    });

    describe('Should convert csv to supported types', () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        type = 'text/csv';

        // Read the CSV file content
        const csvPath = path.join(__dirname, '../testFile/csvtest.csv');
        fragmentData = fs.readFileSync(csvPath);

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test('should csv html to csv', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        expect(res.text).toEqual(fragmentData.toString());
      });

      test('should convert csv to txt', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toEqual(fragmentData.toString());
      });

      test('should convert csv to json', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/json');

        const jsonContent = [
          { Number: '1', Footnote: 'This is footnote one' },
          { Number: '2', Footnote: 'This is footnote two' },
        ];
        expect(res.body).toEqual(jsonContent);
      });
    });

    describe('Should convert JSON to supported types', () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        type = 'application/json';

        // Read the JSON file content
        const jsonPath = path.join(__dirname, '../testFile/jsontest.json');
        fragmentData = fs.readFileSync(jsonPath);

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test('should convert JSON to JSON', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/json');
        expect(res.body).toEqual(JSON.parse(fragmentData.toString()));
      });

      test('should convert JSON to YAML', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/yaml');
        expect(res.text).toContain('title: Hello World');
      });

      test('should convert JSON to YML', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.yml`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/yaml');
        expect(res.text).toContain('title: Hello World');
      });

      test('should convert JSON to txt', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toEqual(fragmentData.toString());
      });
    });

    describe('Should convert YAML to supported types', () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        type = 'application/yaml';

        // Read the YAML file content
        const yamlPath = path.join(__dirname, '../testFile/ymltest.yml');
        fragmentData = fs.readFileSync(yamlPath);

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test('should convert YAML to YAML', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/yaml');
        expect(res.text).toEqual(fragmentData.toString());
      });

      test('should convert YAML to txt', async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toEqual(fragmentData.toString());
      });
    });

    // Image conversion (from jpeg to other types only)
    describe(`Should jpeg image to supported types`, () => {
      let ownerId, fragment, fragmentData, type;
      beforeEach(async () => {
        ownerId = hashEmail('user1@email.com');
        type = 'image/jpeg';

        // Load the image
        const imagePath = path.join(__dirname, `../testFile/seneca.jpg`);
        fragmentData = fs.readFileSync(imagePath);

        fragment = new Fragment({
          ownerId: ownerId,
          type: type,
        });
        await fragment.save();
        await fragment.setData(fragmentData);
      });

      test(`should convert jpeg to png`, async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.png`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('image/png');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Ensure the format matches the target
        const metadata = await sharp(res.body).metadata();
        expect(metadata.format).toBe('png');
      });

      test(`should convert jpeg to jpeg`, async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.jpg`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('image/jpeg');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Ensure the format matches the target
        const metadata = await sharp(res.body).metadata();
        expect(metadata.format).toBe('jpeg');
      });

      test(`should convert jpeg to webp`, async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.webp`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('image/webp');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Ensure the format matches the target
        const metadata = await sharp(res.body).metadata();
        expect(metadata.format).toBe('webp');
      });

      test(`should convert jpeg to gif`, async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.gif`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('image/gif');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Ensure the format matches the target
        const metadata = await sharp(res.body).metadata();
        expect(metadata.format).toBe('gif');
      });

      test(`should convert jpeg to avif`, async () => {
        const res = await request(app)
          .get(`/v1/fragments/${fragment.id}.avif`)
          .auth('user1@email.com', 'password1');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('image/avif');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Ensure the format matches the target
        const metadata = await sharp(res.body).metadata();
        // Accept either avif or heif
        expect(['avif', 'heif']).toContain(metadata.format);
      });
    });
  });
});
