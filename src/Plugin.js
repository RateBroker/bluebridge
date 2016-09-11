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
}

module.exports = Plugin;
