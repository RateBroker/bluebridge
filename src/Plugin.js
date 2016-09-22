'use strict';

/**
 * @abstract
 */
class Plugin {

  constructor (bluebridge) {
    this.bluebridge = bluebridge;

    this.bluebridge.registerPlugin(this);
  }

  _expose (collection) {
    if (typeof this.expose === 'function') {
      return this.expose();
    }
    return {};
  }

  _IOmiddleware (io) {
    if (typeof this.IOmiddleware === 'function') {
      return this.IOmiddleware(io);
    }
  }
}

module.exports = Plugin;
