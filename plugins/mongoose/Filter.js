'use strict';

class Filter {

  constructor (rules) {
    this.rules          = rules;
    this.flattenedRules = this.flattenObject(rules);
  }

  /**
   * mask - Masked an object given a rule to mask against
   *
   * @param  {Socket} socket The request socket
   * @param  {Object} dataIn The data to mask
   * @param  {String} rule   The rule to check
   * @return {Promise}       Promise resolving to masked data
   */
  mask (socket, dataIn, rule) {
    let rules   = this.getRulesOfType(rule);
    // Create a copy of dataOut, which we are going to strip data from as rules fail
    let dataOut = Object.assign({}, dataIn);

    let maskPromises = [];

    for (let path in rules) {
      //
      let rule    = rules[path];
      let obj     = this.deepValue(dataIn, path);
      let currentScope = {
        socket: socket,
        firebaseUser: socket.firebaseUser || {},
        data: dataIn,
        value: obj
      };
      // Test the rule, strip data if false
      let p = this.testRule(rule, currentScope)
        .then(val => {
          if (val) { return; }

          if (path === '$') {
            dataOut = null;
          } else {
            this.removePath(dataOut, path);
          }
        });

      maskPromises.push(p);
    }

    return Promise.all(maskPromises).then(() => {
      return Promise.resolve(dataOut);
    });
  }

  testRule (rule, scope = {}) {
    if (!rule) { return Promise.resolve(true); }

    return (function (scope) {

      let test;
      if (typeof rule === 'function') {
        try {
          test = rule();
          if (typeof test === 'Promise') {
            return test;
          }
        } catch (e) {
          test = false;
        }
      }
      else if (typeof rule === 'string') {
        try {
          test = eval(rule);
        } catch (e) {
          test = false;
        }
      }
      else {
        test = rule;
      }

      return Promise.resolve(test);
    })(scope);

  }

  deepValue (obj, path) {
    if (path === '$') {
      return obj;
    } else {
      path = path.replace('$.', '');
    }

    path  = path.split('.');
    let len   = path.length;

    for (let i = 0; i < len ; i++) {
      if (!obj) {
        return null;
      }
      obj = obj[path[i]];
    };
    return obj;
  }

  setDeepValue (obj, path, val) {
    if (path === '$') {
      throw new Error('Cannot set root value');
    } else {
      path = path.replace('$.', '');
    }

    path    = path.split('.');
    let len = path.length;
    let i;

    for (i = 0; i < (len - 1); i++) {
      obj = obj[path[i]];
    };

    obj[path[i]] = val;
  }


  /**
   * removePath - Traverses an Object tree and removes the node at the end of a path
   *  Does not work with '$'(root) nodes
   *
   * @param  {String} obj  The Object to traverse
   * @param  {String} path The path
   */
  removePath (obj, path) {
    if (!obj) {
      return;
    }
    if (path === '$') {
      throw new Error('cannot handle $ as a path');
    }

    let paths = path.replace('$.', '').split('.');
    let len   = paths.length;

    for (let i = 0; i < (len - 1); i++) {
      obj = obj[paths[i]];
    };

    delete obj[paths[len - 1]];
  }

  /**
   * flattenObject - Helper function to flattem object into dot-string array
   *  Sourced form https://gist.github.com/penguinboy/762197
   *
   * @param  {Object} ob The object to flatten
   * @return {Object}    halp
   */
  flattenObject (ob) {
  	var toReturn = {};

  	for (var i in ob) {
  		if (!ob.hasOwnProperty(i)) continue;

  		if ((typeof ob[i]) == 'object') {
  			var flatObject = this.flattenObject(ob[i]);
  			for (var x in flatObject) {
  				if (!flatObject.hasOwnProperty(x)) continue;

  				toReturn[i + '.' + x] = flatObject[x];
  			}
  		} else {
  			toReturn[i] = ob[i];
  		}
  	}
  	return toReturn;
  }


  /**
   *
   * @param  {type} ruleType     '@read', '@write', '@methods', '@statics'
   * @return {Array}              Array of
   */
  getRulesOfType (ruleType) {
    let paths = {};
    for (let path in this.flattenedRules) {
      let rule = this.flattenedRules[path];
      if (path.endsWith(ruleType)) {
        let pathNoRule = path.replace(new RegExp('.' + ruleType + '$'), '');
        paths[pathNoRule] = rule;
      }
    }
    return paths;
  }

  getRule (fullPath) {
    return this.flattenedRules[fullPath] || null;
  }
}

module.exports = Filter;
