// src/routes/api/delete.js
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const { id } = req.params;

  try {
    await Fragment.delete(ownerId, id);
    logger.info({ ownerId, id }, 'Fragment deleted.');
    return res.status(200).json(createSuccessResponse());
  } catch (err) {
    // if Fragment.byID throw inside deleteFragment, return 404; Else 500
    if (err.message === 'Fragment by id not found') {
      logger.error({ ownerId, id }, 'Failed to delete fragment. Fragment not found.');
      return res.status(404).json(createErrorResponse(404, err.message));
    }
    logger.error({ err: err.message }, 'Failed to delete fragment.');
    return res
      .status(500)
      .json(createErrorResponse(500, `Internal Server error occur while deleting the fragment`));
  }
};
