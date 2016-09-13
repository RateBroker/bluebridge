'use strict';

const Plugin      = require('../../src/Plugin');

class FirebasePlugin extends Plugin {

  constructor (bluebridge, firebase) {
    super(bluebridge);

    this.firebase = firebase;
  }

  onIOMiddleware () {

  }

  onConnection (socket) {
    socket.auth = null;
  }

  auth (socket, firebaseToken) {
    // Deauth if firebaseUser not set
    if (!firebaseToken) {
      socket.firebaseUser = null;

      return Promise.reject();
    }

    //check the auth data sent by the client
    return this.firebase
      .auth()
      .verifyIdToken(firebaseToken)
      .then(firebaseUser => {
        // set firebaseUser on the socket
        socket.firebaseUser = firebaseUser;
            // fetch the bluebridge user with firebaseUser's unique id
            // return this.bluebridge.user(firebaseUser.uid);
          // })
          // .then(user => {
          //   socket.user = user;
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
