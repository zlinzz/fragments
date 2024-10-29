// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  const expand = req.query.expand === '1'; // Check if expand query parameter is present and equals '1'
  try {
    const fragments = await Fragment.byUser(req.user, expand);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err, ownerId: req.user }, 'Failed to get fragments');
    res.status(500).json(createErrorResponse(500, 'Unable to retrieve fragments'));
  }
};
