'use strict';

const Plugin      = require('../../src/Plugin');

class FirebasePlugin extends Plugin {

  constructor (bluebridge, firebase) {
    super(bluebridge);

    this.firebase = firebase;
  }

  onConnection (socket) {
    socket.auth = null;
  }

  IOmiddleware (io) {
  }

  auth (socket, firebaseToken) {
    // Deauth if firebaseUser not set
    if (!firebaseToken) {
      socket.firebaseUser = null;
      return Promise.resolve('No firebaseToken provided, deauthed');
    }

    let auth = this.firebase.auth();

    //check the auth data sent by the client
    return auth.verifyIdToken(firebaseToken).then(firebaseUser => {
      // set firebaseUser on the socket
      socket.firebaseUser = firebaseUser;
      if (firebaseUser.uid) {
        socket.emit('auth');
      } else {
        socket.emit('deauth');
      }
      return Promise.resolve('Authenticated as ' + socket.firebaseUser.name);
    });
  }

  expose () {
    let self = this;
    return {
      auth: {
        firebase: function (firebaseToken) {
          return self.auth(this, firebaseToken);
        }
      }
    };
  }
}

module.exports = FirebasePlugin;
