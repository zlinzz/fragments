// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const validTypes = [
  `text/plain`,
  /*
   Currently, only text/plain is supported. Others will be added later.

  `text/markdown`,
  `text/html`,
  `application/json`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
  */
];  

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
      logger.error({ ownerId }, 'Fragment creation failed: ownerId is required');
      throw new Error("ownerId is required");
    }
    if(!type) {
      logger.error({ ownerId, type }, 'Fragment creation failed: type is required');
      throw new Error("type is required");
    }
    if(!Fragment.isSupportedType(type))
    {
      logger.error({ ownerId, type }, `Fragment creation failed: Unsupported content type: ${type}`);
      throw new Error("type is not supported");
    }
    if(typeof (size) !== "number" || size < 0) {
      logger.error({ ownerId, size }, 'Fragment creation failed: size must be a non-negative number');
      throw new Error("Invalid size value: size must be a non-negative number");
    }
    
    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
    logger.info({ id: this.id, ownerId: this.ownerId }, 'Fragment created');
    logger.debug({ fragment: this }, 'Newly created fragment metadata');
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    try{
      const fragments = await listFragments(ownerId, expand);
      logger.debug({ fragments }, 'Retrieved fragments byUser()');
      return fragments;
    } catch (err){
      logger.error({ ownerId, err }, 'Error retrieving fragments for user');
      throw err;
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    try {
      const fragment = await readFragment(ownerId, id);
      if (!fragment) {
        logger.error({ownerId, id}, 'Fragment by id not found');
        throw new Error("Fragment by id not found");
      }
      logger.debug({ fragment: fragment }, 'Retrieved fragment byId()');
      return fragment;
    } catch(err) {
      logger.error({ ownerId, id, err }, 'Error retrieving fragment by id');
      throw err;
    }  
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try{
      // Make sure id exist before delete
      await this.byId(ownerId, id); 
      const result = await deleteFragment(ownerId, id);
      logger.info({ownerId, id, result}, 'Fragment deleted');
      return Promise.resolve();
    } catch (err) {
      logger.error({ ownerId, id, err }, 'Error deleting fragment');
      throw err;
    }
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  async save() {
    try {
      await writeFragment(this);
      this.updated = new Date().toISOString();
      logger.info({ ownerId: this.ownerId, id: this.id }, 'Fragment metadata saved');
      logger.debug({ fragment: this }, 'Fragment metadata details');
      return Promise.resolve();
    } catch (err) {
      logger.error({ ownerId: this.ownerId, id: this.id, err }, 'Error saving fragment metadata');
      throw err;
    }
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    try {
      const data = await readFragmentData(this.ownerId, this.id);
      logger.debug({ fragment: data }, 'Retrieved fragment data');
      return data;
    } catch (err) {
      logger.error({ ownerId: this.ownerId, id: this.id, err }, 'Error retrieving fragment data');
      throw err;
    }
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data))
    {
      logger.error({ ownerId: this.ownerId, id: this.id }, 'Invalid data type: data must be a Buffer');
      throw new Error('Invalid data type: data must be a Buffer');
    }
    try {
      await writeFragmentData(this.ownerId, this.id, data);
      this.size = data.length;
      this.updated = new Date().toISOString();
      logger.info({ ownerId: this.ownerId, id: this.id }, 'Fragment data saved');
      logger.debug({ fragment: this }, 'Fragment data details saved');
      return Promise.resolve();
    } catch (err) {
      logger.error({ ownerId: this.ownerId, id: this.id, err }, 'Error saving fragment data')
      throw err;
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    return validTypes;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    return validTypes.includes(type);
  }
}

module.exports.Fragment = Fragment;