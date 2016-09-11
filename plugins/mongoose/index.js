'use strict';

const MongoosePlugin = require('./MongoosePlugin');

module.exports = function (bluebridge) {
  return new MongoosePlugin(bluebridge);
};
