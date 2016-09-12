'use strict';

const Document   = require('./Document');
const curry = require('lodash.curry');

class Collection {

  constructor (collectionName, collection) {
    this.collectionName = collectionName;

    this.model = collection.model;
    this.rules = collection.rules     || {};
    this.methods = collection.methods || {};
    this.statics = collection.statics || {};
  }

  /**
   * query - Queries mongo, returns an Array of masked Models
   *
   * @param  {Socket} socket The client socket
   * @param  {Object} qry    The query object
   * @return {Promise}       Promise resolves to an Array of Objects
   */
  query (socket, qry) {
    return this.model
      .find(qry)
      .exec()
      .then(documents => {
        return Promise.all(documents.map(doc => {
          let model = new Document(doc.toObject());
          return model.read(socket, this.rules);
        }));
      });
  }

  /**
   * create - Fetches a new, masked & unsaved Model
   *
   * @param  {Socket} socket The client socket
   * @return {Promise}       Promise resolves to masked Model
   */
  create (socket) {
    let Model = this.model;
    let doc = new Model({});

    return Promise.resolve(doc.toObject());
  }

  /**
   * document - Fetches a mongo document, returns a masked document
   *
   * @param  {Socket} socket          The client socket
   * @param  {ObjectId|String} id     The document id to fetch
   * @return {Promise}                Promise resolved to masked Object
   */
  document (socket, id) {
    if (!id) {
      return Promise.reject('Missing argument id');
    }

    return this.model
      .findById(id)
      .exec()
      .then(doc => {
        if (!doc) {
          return Promise.resolve(null);
        }
        let model = new Document(doc.toObject());
        return model.read(socket, this.rules);
      });
  }

  /**
   * save - Fetches a Document and sets new data
   *
   * @param  {Socket} socket        The client socket
   * @param  {ObjectId|String} id   The document id to fetch
   * @param  {type} data            The data to set
   * @return {Promise}              The saved masked document
   */
  save (socket, id, data = {}) {
    let Model = this.model;

    if (!id) {
      return Promise.reject('Missing argument id');
    }

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
      })
      .catch(errors => {
      });
  }

  validate (socket, id, data = {}) {
    let Model = this.model;

    if (!id) {
      return Promise.reject('Missing argument id');
    }

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
      .then(doc => doc.validate())
      .catch(errors => {
      });
  }

  expose () {
    let exposeObj = { };
    exposeObj[this.collectionName] = {
      'query':        this.curryFunction(this.query),
      'create':       this.curryFunction(this.create),
      'document':     this.curryFunction(this.document),
      'save':         this.curryFunction(this.save),
      'validate':     this.curryFunction(this.validate),
    };
    return exposeObj;
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
