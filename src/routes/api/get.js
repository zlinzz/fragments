// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    const fragments = await Fragment.byUser(req.user);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err, ownerId: req.user }, 'Failed to get fragments');
    res.status(500).json(createErrorResponse(500, 'Unable to retrieve fragments'));
  }
};
