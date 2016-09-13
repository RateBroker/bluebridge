'use strict';

const FirebasePlugin = require('./FirebasePlugin');

module.exports = function (bluebridge, firebase) {
  return new FirebasePlugin(bluebridge, firebase);
};
