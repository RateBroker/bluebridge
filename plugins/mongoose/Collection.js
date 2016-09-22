'use strict';

const Filter    = require('./Filter');
const curry     = require('lodash.curry');
const winston   = require('winston');

class Collection {

  constructor (collectionName, collection) {
    this.collectionName = collectionName;

    this.model    = collection.model;
    this.rules    = collection.rules    || {};
    this.methods  = collection.methods  || {};
    this.statics  = collection.statics  || {};
    this.types    = collection.types    || {};
    this.defaults = collection.defaults || [];

    this.subCollections = [];
  }

  init () {
    this.filter = new Filter(this.rules);
    this.initDefaults();
  }

  initDefaults () {
    if (this.defaults.length === 0) {
      return;
    }

    return this.model.count({}).exec().then(count => {
      winston.info(`[${this.collectionName}]: ${count} records exist`);

      if (!count) {
        winston.info(`[${this.collectionName}]: Seeding database with defaults`);

        let defaultPromises = this.defaults.map(ob => {
          let doc = new this.model(ob);
          return doc.save().catch(err => winston.error(err));
        });

        return Promise.all(defaultPromises).then(saveResults => {
          winston.info(`[${this.collectionName}]: created ${save.results.length} defaults`);
        });
      } else {
        winston.info(`[${this.collectionName}]: Skipping default creation`);
      }
    })
    .catch(err => {
      throw new Error(err);
    });
  }

  /**
   * find - Queries mongo, returns an Array of masked Models
   *
   * @param  {Socket} socket The client socket
   * @param  {Object} query    The query object
   * @return {Promise}       Promise resolves to an Array of Objects
   */
  find (socket, query) {
    return this.model
      .find(query)
      .exec()
      .then(documents => {
        return Promise.all(documents.map(doc => {
          return this.filter.mask(socket, doc.toObject(), '@read')
        }))
        .then(docs =>  {
          // remove empty values
          return Promise.resolve(docs.filter(function (n) { return n; }));
        });
      }, winston.error);
  }

  /**
   * create - Fetches a new, masked & unsaved Model
   *
   * @param  {Socket} socket The client socket
   * @return {Promise}       Promise resolves to masked Model
   */
  create (socket, data = {}) {
    let Model = this.model;
    let doc = new Model(data);
    return this.filter.mask(socket, doc.toObject(), '@read');
  }

  /**
   * document - Fetches a mongo document, returns a masked document
   *
   * @param  {Socket} socket          The client socket
   * @param  {ObjectId|String} id     The document id to fetch
   * @return {Promise}                Promise resolved to masked Object
   */
  findById (socket, id) {
    if (!id) {
      return Promise.reject('Missing argument id');
    }

    return this.model.findById(id)
      .exec()
      .then(doc => {
        if (!doc) {
          return Promise.reject('Document not found');
        }
        return this.filter.mask(socket, doc.toObject(), '@read');
      }, winston.error);
  }

  /**
   * document - Fetches a mongo document, returns a masked document
   *
   * @param  {Socket} socket          The client socket
   * @param  {ObjectId|String} id     The document id to fetch
   * @return {Promise}                Promise resolved to masked Object
   */
  findOne (socket, query) {
    return this.model.findOne(query)
      .exec()
      .then(doc => {
        if (!doc) {
          return Promise.reject('Document not found');
        }
        return this.filter.mask(socket, doc.toObject(), '@read');
      }, winston.error);
  }

  /**
   * save - Fetches a Document and sets new data
   *
   * @param  {Socket} socket        The client socket
   * @param  {ObjectId|String} id   The document id to fetch
   * @param  {type} data            The data to set
   * @return {Promise}              The saved masked document
   */
  save (socket, id, dataIn = {}) {
    var _id = id || dataIn._id || null;

    if (!_id) {
      return Promise.reject('Missing argument id');
    }

    return this.filter.mask(socket, dataIn, '@write')
      .then(writeData =>  this.findIdSetDataAndSave(_id, writeData))
      .then(doc =>        this.filter.mask(socket, doc.toObject(), '@read'))
      .catch(errors =>    console.error('Save validation errors! ', errors));
  }

  findIdSetDataAndSave (id, data) {
    let Model = this.model;

    return Model.findById(id)
      .exec()
      .then(doc => {
        if (!doc) {
          doc = new Model(data);
        } else {
          doc.set(data);
        }
        return Promise.resolve(doc);
      })
      .then(doc => {
        return doc.save();
      });
  }

  validate (socket, id, data = {}) {
    let Model = this.model;

    if (!id) {
      return Promise.reject('Missing argument id');
    }

    return this.filter.mask(socket, data, '@write')
      .then(writeData => {
        // Find document and set filtered writeData
        return Model.findById(id)
          .exec()
          .then(doc => {
            if (!doc) {
              doc = new Model(writeData);
            } else {
              doc.set(writeData);
            }
            return Promise.resolve(doc);
          })
      })
      .then(doc => doc.validate())
      .catch(errors => { });
  }

  expose () {
    let exposeObj = { };
    exposeObj[this.collectionName] = {
      'create':       this.curryFunction(this.create),
      'find':         this.curryFunction(this.find),
      'findOne':      this.curryFunction(this.findOne),
      'findById':     this.curryFunction(this.findById),
      'save':         this.curryFunction(this.save),
      'validate':     this.curryFunction(this.validate),
      'statics':      this.exposeStatics(),
      'methods':      this.exposeMethods()
    };
    return exposeObj;
  }

  exposeStatics () {
    let self = this;
    let exposeStaticsObj = {};
    for (let methodName in this.statics) {
      let staticFn = this.statics[methodName];
      let rule = self.filter.getRule('$.@statics.' + methodName);

      exposeStaticsObj[methodName] = function (...args) {
        let socket = this;

        return self.filter
          .testRule(rule, {
            socket: socket,
            args: args
          })
          .then(pass => {
            if (!pass) {
              return Promise.reject('Rule check failed when calling static: ' + methodName);
            }
            args.unshift(socket);
            return staticFn.apply(self.model, args);
          });
      }
    }
    return exposeStaticsObj;
  }

  exposeMethods () {
    let self = this;
    let exposeMethodsObj = {};
    for (let methodName in this.methods) {
      let methodFn = this.methods[methodName];
      let rule = self.filter.getRule('$.@methods.' + methodName);

      exposeMethodsObj[methodName] = function (id, ...args) {
        let socket = this;

        return self.filter
          .testRule(rule, {
            socket: socket,
            args: args
          })
          .then(pass => {
            if (!pass) {
              return Promise.reject('Rule check failed when calling method: ' + methodName);
            }
            return self.model.findById(id).exec();
          })
          .then(doc => {
            if (!doc) {
              return Promise.reject('Document not found with id: ' + id);
            }
            args.unshift(socket);
            return methodFn.apply(doc, args);
          });
      };
    }
    return exposeMethodsObj;
  }

  curryFunction (fn) {
    let self = this;
    let wrapSocket = function (...args) {
      let socket = this;
      args.unshift(socket);
      return fn.apply(self, args);
    };
    return curry(wrapSocket, (fn.length - 1));
  }
}

module.exports = Collection;
