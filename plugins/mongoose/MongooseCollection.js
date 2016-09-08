'use strict';

const Collection = require('../../Collection');

const ERROR = {
  COULD_NOT_FIND_DOCUMENT: `Could not find document`
}

class MongooseCollection extends Collection {

  constructor (collectionName, Model) {
    super(collectionName);

    this.Model = Model;
  }

  query (socket, qry) {
    let self = this.self;
    let Model = this.Model;

    return Model.find(qry).exec()
      .then(documents => {
        // let ids = [];
        // for (let document of documents) {
        //   ids.push(document._id);
        // }
        return Promise.resolve(documents);
      });
  }

  document (socket, id) {
    let Model = this.Model;

    if (!id) {
      let document = new Model({});
      return Promise.resolve(document);
    }

    return Model.findById(id)
      .then(document => {
        return Promise.resolve(document);
      });
  }

  saveDocument (socket, id, data) {
    let Model = this.Model;

    return this.document(socket, id)
      .then(document => {
        if (!document) {
          document = new Model(data);
        }
        document.set(data);
        return document.save();
      });
  }

  validateDocument (socket, id, data) {
    let Model = this.Model;

    return this.document(socket, id)
      .then(document => {
        if (!document) {
          document = new Model(data);
        }
        document.set(data);
        return document.validate();
      })
      .then(errors => {
        // TODO: Parse errors into nicely structured BlueBridge errors object?
        return Promise.resolve(errors);
      });
  }
}

module.exports = MongooseCollection;
