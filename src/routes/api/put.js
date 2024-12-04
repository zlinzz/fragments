// src/routes/api/put.js

const { createErrorResponse, createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info('Received a PUT request to /fragments/:id');
  const ownerId = req.user;
  const { id } = req.params;
  const putType = req.headers['content-type'];

  try {
    // byId gets back plain json object
    // create a new fragment
    const fragment = new Fragment(await Fragment.byId(ownerId, id));

    // Type modification is not allowed
    const originalType = fragment.type;
    logger.info({ putType, originalType }, 'Checking types');
    if (putType !== originalType) {
      logger.error(
        { putType, originalType },
        "A fragment's type can not be changed after it is created"
      );
      throw new Error("A fragment's type can not be changed after it is created");
    }

    logger.info('Updating fragment data');
    await fragment.setData(req.body);

    logger.info('Sending success response');
    return res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
          formats: fragment.formats,
        },
      })
    );
  } catch (err) {
    if (err.message === 'Fragment by id not found')
      return res.status(404).json(createErrorResponse(404, err.message));
    else if (err.message === "A fragment's type can not be changed after it is created")
      return res.status(400).json(createErrorResponse(400, err.message));
    else {
      logger.error({ err: err.message }, 'Internal Server Error');
      return res
        .status(500)
        .json(createErrorResponse(500, `Internal Server Error: ${err.message}`));
    }
  }
};
