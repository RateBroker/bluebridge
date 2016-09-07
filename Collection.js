'use strict';

const curry = require('lodash.curry');

const OVERRIDES = [
  'query',
  'liveQuery',
  'document',
  'saveDocument',
  'validateDocument',
];

const EXPOSED_PROPERTIES = [
  'name',
  'query',
  'document',
  'saveDocument',
  'validateDocument'
]

/**
 * @abstract
 */
class Collection {

  constructor (name) {
    this.name = name;
    this.checkAbstractOverrides();
  }

  checkAbstractOverrides () {
    this.enabledOverrides = [];
    this.disabledOverides = [];
    for (let override of OVERRIDES) {
      if (typeof this[override] !== "function") {
        console.warn(`${this.name} does not implement ${override}()`);
      } else {
        this.enabledOverrides.push(override);
      }
    }
  }

  expose () {
    let exp = {};
    exp[this.name] = {};

    for (let propertyName of EXPOSED_PROPERTIES) {
      let property = this[propertyName];
      let exposedProperty = null;

      // Monkey patch properties "this" socket into functions arguments
      if (typeof property === "function") {
        let self = this;
        let wrapSocket = function (...args) {
          let socket = this;
          args.unshift(socket);
          return property.apply(self, args);
        };
        exposedProperty = curry(wrapSocket, (property.length - 1));
      } else if (property) {
        exposedProperty = property;
      } else {
        exposedProperty = function () {
          return Promise.reject('Not implemented');
        };
      }

      exp[this.name][propertyName] = exposedProperty;
    }

    return exp;
  }
}

module.exports = Collection;
