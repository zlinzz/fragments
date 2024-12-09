// src/routes/api/getById.js

const { createErrorResponse } = require('./../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const markdownit = require('markdown-it');
const md = markdownit();
const { htmlToText } = require('html-to-text');
const yaml = require('yaml');
const csvToJson = require('papaparse');
// const jsonToyaml = require('js-yaml');
const sharp = require('sharp');

function isValidConversion(fragment, extension) {
  const validConversions = fragment.formats;
  logger.info(
    { validConversions, extension: getContentType(extension) },
    'Checking conversion validation'
  );
  return validConversions?.includes(getContentType(extension));
}

// Convert the fragment data to the extension type
async function convertFragmentData(data, contentType, extension) {
  logger.info({ contentType, extension }, 'Converting fragment data');

  // Convert to txt
  if (extension === 'txt') {
    switch (contentType) {
      case 'text/plain':
        return data;
      case 'text/markdown': {
        const html = md.render(data.toString());
        return htmlToText(html, { wordwrap: 130 });
      }
      case 'text/html':
        return htmlToText(data.toString(), { wordwrap: 130 });
      case 'text/csv':
        return data;
      case 'application/json': {
        // choice 1: plain text
        return data.toString().replace(/'/g, '"');
        // choice 2: serialized JSON string
        // return JSON.stringify(data.toString().replace(/'/g, '"'));
      }
      case 'application/yaml':
        return data.toString();
    }
  }
  // Convert to md
  else if (extension === 'md') {
    switch (contentType) {
      case 'text/markdown':
        return data;
    }
  }
  // Convert to html
  else if (extension === 'html') {
    switch (contentType) {
      case 'text/markdown':
        return md.render(data.toString());
      case 'text/html':
        return data;
    }
  }
  // Convert to csv
  else if (extension === 'csv') {
    switch (contentType) {
      case 'text/csv':
        return data;
    }
  }
  // Convert to json
  else if (extension === 'json') {
    switch (contentType) {
      case 'text/csv': {
        // Removes trailing and leading whitespace
        return csvToJson.parse(data.toString().trim(), {
          header: true,
        }).data;
      }
      case 'application/json':
        return data;
    }
  }
  // Convert to yaml
  else if (extension === 'yaml' || extension === 'yml')
    switch (contentType) {
      case 'application/yaml':
        return data;
      case 'application/json': {
        // method 1
        let jsonString = data.toString();
        jsonString = jsonString.replace(/'/g, '"');
        const jsonObject = JSON.parse(jsonString);
        return yaml.stringify(jsonObject);
        // method 2
        // const jsonObject = JSON.parse(jsonString);
        // return jsonToyaml.dump(jsonObject, { noRefs: true, skipInvalid: true });
      }
    }
  // image conversion
  else if (extension === 'png') {
    switch (contentType) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return await sharp(data).png().toBuffer();
    }
  } else if (extension === 'jpg') {
    switch (contentType) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return await sharp(data).jpeg().toBuffer();
    }
  } else if (extension === 'webp') {
    switch (contentType) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return await sharp(data).webp().toBuffer();
    }
  } else if (extension === 'avif') {
    switch (contentType) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return await sharp(data).avif().toBuffer();
    }
  } else if (extension === 'gif') {
    switch (contentType) {
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
      case 'image/avif':
      case 'image/gif':
        return await sharp(data).gif().toBuffer();
    }
  }
  return null;
}

// Get the content type of the extension
function getContentType(extension) {
  const contentTypes = {
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    csv: 'text/csv',
    json: 'application/json',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
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
    // This will return plain JavaScript object not fragment object (retrieved from DynamoDb if used)
    const fragment = await Fragment.byId(ownerId, cleanId);
    // instantiate a new fragment object called fragment2
    const fragment2 = new Fragment(fragment);

    // Get the actual data of the fragment
    const fragmentData = await fragment2.getData();

    const contentType = fragment2.type;

    if (extension != null) {
      logger.info('GetbyId request with extension');

      // Check if the extension used represents an unknown/unsupported type
      if (!isValidConversion(fragment2, extension)) {
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
      const convertedData = await convertFragmentData(fragmentData, contentType, extension);
      logger.info(
        { id, contentType, extension },
        'Successfully convert fragment data to the extension type'
      );
      res.setHeader('Content-Type', getContentType(extension));
      return res.status(200).send(convertedData);
    }

    logger.info('GetbyID Request without extension');
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
    logger.error({ errMessage: err.message }, 'Internal Server Error (getById route request)');
    res.status(500).json(createErrorResponse(500, `Internal Server Error`));
  }
};
