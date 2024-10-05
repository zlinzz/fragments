// src/routes/api/post.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

/**
 * Create a new fragment for the current user
 */
module.exports = async (req, res) => {
  logger.info('Received a POST request to /fragments');

  // Check if the data is parsed to buffer
  if (!Buffer.isBuffer(req.body)) {
    logger.error('Request body is not a valid buffer');
    return res.status(400).json(createErrorResponse(400, 'Invalid body content'));
  }

  const { type } = contentType.parse(req);
  if (!Fragment.isSupportedType(type)) {
    logger.error(`Unsupported Content-Type: ${type}`);
    return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
  }

  const hashedEmail = req.user;
  const fragmentParameter = {
    ownerId: hashedEmail,
    type: req.headers['content-type'],
  };
  // res.set('Content-Type', type);

  const fragment = new Fragment(fragmentParameter);
  try {
    // loggers are in Fragment class already
    await fragment.save();
    // await fragment.setData(Buffer.from(req.body));
    // req.body is verified as a buffer
    await fragment.setData(req.body);
  } catch (err) {
    logger.error({ message: err.message }, 'Error saving fragment during POST');
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
  const locationBase = process.env.API_URL || `http://${req.headers.host}/`;
  const location = `${locationBase}/v1/fragments/${fragment.id}`;
  res.set('Location', location);
  logger.debug({ location }, 'Location header set for the fragment');

  return res.status(201).json(
    createSuccessResponse({
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
      },
    })
  );
};
