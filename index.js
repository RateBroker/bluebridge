'use strict';

const BlueBridge = require('./src/bluebridge');

module.exports = function (firebase) {
  return new BlueBridge(firebase);
};
