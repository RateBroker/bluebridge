'use strict';

const mongoose    = require('mongoose');
const Collection  = require('./Collection');
const Plugin      = require('../../src/Plugin');

class MongoosePlugin extends Plugin {

  constructor (bluebridge) {
    super(bluebridge);

    this.collections = [];

    // Apply our BlueBridge mongoose plugin to mongoose globally
    // mongoose.plugin(this.plugin.bind(this));
  }


  /**
   * plugin - A mongoose plugin, to hook mongoose events into BlueBridge
   *
   * @param  {type} schema  description
   * @param  {type} options description
   * @return {type}         description
   */
  // plugin (schema, options) {
  //   console.log(this.collections);
  //   console.log('Registering MongooseShema ');
  //   console.log(schema.paths);
  //   console.log(schema.statics);
  //   console.log(schema.methods);
  // }


  /**
   * loadCollections - Takes an object map of Mongoose Collections and loads them into bluebridge as collections
   *
   * @param  {type} collections description
   */
  loadCollections (collections) {
    let arr = []
    for (let collectionName in collections) {
      let c = this.loadCollection(collectionName, collections[collectionName]);
      arr.push(c);
    }
    return arr;
  }

  loadCollection (collectionName, collection) {
    // First create a Collection from the Collection
    collection = new Collection(collectionName, collection);
    // Then add it to the plugin
    this.collections.push(collection);

    let subCollections = this.loadCollections(collection.types);

    for (let subCollection of subCollections) {
      subCollection.rules   = Object.assign({}, collection.rules,   subCollection.rules);
      subCollection.methods = Object.assign({}, collection.methods, subCollection.methods);
      subCollection.statics = Object.assign({}, collection.statics, subCollection.statics);
      subCollection.init();
    }

    return collection;
  }

  expose () {
    let exposeObj = {};
    this.collections.forEach(collection => {
      Object.assign(exposeObj, collection.expose());
    });
    return exposeObj;
  }
}

module.exports = MongoosePlugin;
