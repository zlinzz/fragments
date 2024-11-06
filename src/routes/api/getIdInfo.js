// // src/routes/api/getIdInfo.js

const { createErrorResponse, createSuccessResponse } = require('./../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    // Get the fragment by id
    const fragment = await Fragment.byId(ownerId, id);
    // return the fragment's metadata
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    if (err.message === 'Fragment by id not found') {
      return res.status(404).json(createErrorResponse(404, err.message));
    }
    logger.error('Error fetching fragment', { message: err.message });
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
