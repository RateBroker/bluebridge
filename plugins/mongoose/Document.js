'use strict';

  // '$': {
  //   '.read':  'this.hidden',
  //   '.write': 'this.locked',
  //   '.content': {
  //     '.read':  '!this.contentHidden',
  //     '.write': '!this.contentLocked',
  //   },
  // },

class Document {

  constructor (data) {
    this.data = data;
  }

  read (socket, rules) {
    return this.filterRoot(socket, rules)
      .then(data => {
        return this.filterPaths(socket, rules, data);
      });
  }

  filterRoot (socket, rules) {
    if (rules.$.read) {
      return this.canRead(socket, rules.$.read)
        .then(canReadRoot => {
          if (canReadRoot) {
            return Promise.resolve(this.data);
          } else {
            return Promise.resolve({});
          }
        });
    } else {
      return Promise.resolve(this.data);
    }
  }

  filterPaths (socket, rules, data) {
    let pathRules = Object.assign({}, rules);
    delete pathRules.$;

    return Promise.all(pathRules.map(rules, path => {
      if (rules.read) {
        return this.canRead(socket, path)
          .then(canRead => {
            if (!canRead) { delete data[path]; }
          });
      } else {
        return Promise.resolve();
      }
    }))
    .then(() => {
      return Promise.resolve(data);
    });
  }

  canRead (socket, readRule) {
    let canRead;
    if (typeof readRule === 'function') {
      canRead = readRule();
      if (typeof canRead === 'Promise') {
        return canRead;
      }
    }
    else if (typeof readRule === 'string') {
      canRead = eval(readRule);
    }
    else {
      canRead = readRule;
    }
    return Promise.resolve(canRead);
  }

  write (socket, rules, data) {

  }

  validate (socket, rules, data) {

  }
}

module.exports = Document;
