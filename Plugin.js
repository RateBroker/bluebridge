'use strict';

const bluebridge = require('./BlueBridge');

/**
 * @abstract
 */
class Plugin {

  constructor () {
    this.collections = [];
  }

  addCollection (collection) {
    bluebridge.expose(collection.expose());
    // TODO: Check whether collection already exists
    this.collections.push(collection);
  }
}

module.exports = Plugin;
