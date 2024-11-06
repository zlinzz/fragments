// src/routes/api/getById.js

const { createErrorResponse } = require('./../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// Check if the contentType allows the conversion between the extension type
function isValidConversion(contentType, extension) {
  const validConversions = {
    'text/plain': ['txt'],
    // more conversions later
  };
  return validConversions[contentType]?.includes(extension);
}

// Convert the fragment data to the extension type
function convertFragmentData(data, extension) {
  if (extension === 'txt') {
    return data;
  }
  return null;
}

// Get the content type of the extension
function getContentType(extension) {
  const contentTypes = {
    txt: 'text/plain',
    // more later
  };
  return contentTypes[extension] || 'application/octet-stream';
}

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;
    const parts = id.split('.'); // Divide the id param into 2 piece by the delimiter .
    const cleanId = parts[0]; // Extract id without extension (the first part of the division)
    const extension = parts.length > 1 ? parts.pop() : null; // Extract the optional extension from Id

    // Get the fragment by id
    const fragment = await Fragment.byId(ownerId, cleanId);

    // Get the actual data of the fragment
    const fragmentData = await fragment.getData();
    const contentType = fragment.type;

    if (extension != null) {
      // Check if the extension used represents an unknown/unsupported type
      if (!isValidConversion(contentType, extension)) {
        logger.error(
          { contentType, extension },
          'Conversion is not supported due to the unsupported/unknown extension type'
        );
        return res
          .status(415)
          .json(
            createErrorResponse(
              415,
              `A ${contentType} type fragment cannot be returned as a ${extension}`
            )
          );
      }

      // If it is a valid conversion, convert fragment data to the extension type
      const convertedData = await convertFragmentData(fragmentData, extension);
      logger.info(
        { id, contentType, extension },
        'Successfully convert fragment data to the extension type'
      );
      res.setHeader('Content-Type', getContentType(extension));
      return res.status(200).send(convertedData);
    }

    // If no extension provided, set the content type to fragment data's type
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    logger.info({ id }, 'No extension provided,  returning fragment data');
    return res.status(200).send(fragmentData);
  } catch (err) {
    if (err.message === 'Fragment by id not found') {
      return res.status(404).json(createErrorResponse(404, err.message));
    }
    logger.error('Error fetching fragment', { message: err.message });
    res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
