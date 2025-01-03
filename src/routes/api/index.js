// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));

// Define the new route for getting a fragment by ID: GET /v1/fragments/:id
router.get('/fragments/:id', require('./getById'));

// Define the route for getting a fragment's metadata by ID: GET /v1/fragments/:id/info
router.get('/fragments/:id/info', require('./getIdInfo'));

// Define the POST route, which will be: POST /v1/fragments
// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
// You can use Buffer.isBuffer(req.body) to test if it was parsed by the raw body parser.
router.post('/fragments', rawBody(), require('./post'));

// Define the put route, which will be PUT /v1/fragments:id
// Data must be a buffer
// User can update the fragment's data but not type
router.put('/fragments/:id', rawBody(), require('./put'));

// Define the DELETE route, which will be: DELETE /v1/fragments:id
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
