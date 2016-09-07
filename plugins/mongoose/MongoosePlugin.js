'use strict';

const mongoose            = require('mongoose');
const MongooseCollection  = require('./MongooseCollection');
const Plugin              = require('../../Plugin');

class MongoosePlugin extends Plugin {

  constructor () {
    super();

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
   * loadModels - Takes an object map of Mongoose Models and loads them into bluebridge as collections
   *
   * @param  {type} models description
   * @return {type}        description
   */
  loadModels (models) {
    for (let modelName in models) {
      this.loadModel(modelName, models[modelName]);
    }
  }

  loadModel (modelName, Model) {
    // First create a MongooseCollection from the Model
    let collection = new MongooseCollection(modelName, Model);
    // Then add it to the plugin
    this.addCollection(collection);
  }
}

let mongoosePlugin = new MongoosePlugin();
module.exports = mongoosePlugin;
