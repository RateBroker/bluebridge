'use strict';

const RPC = require('socket.io-rpc');
const express = require('express');
const http = require('http');

const PORT = parseInt(process.env.BLUEBRIDGE_PORT, 10);
if (!PORT) {
  throw new Error('process.env.BLUEBRIDGE_PORT not set');
}

class BlueBridge {

  constructor (firebase) {
    this.firebase = firebase;
    this.plugins  = [];
    this.sockets  = [];

    this.app    = express();
    this.server = http.createServer(this.app);
    this.rpc    = new RPC(this.server, {
      serveClient: false,
      path: '/socket.io'
    });
    this.io = this.rpc.io;

    this.io.use(this.handshake.bind(this));
  }

  registerPlugin (plugin) {
    this.plugins.push(plugin);
  }

  exposePlugins () {
    this.plugins.forEach(plugin => {
      this.expose(plugin.expose());
    });
  }

  /**
   * expose - Exposes an object tree to the RPC server
   *
   * @param  {Object} tree The object tree to expose
   */
  expose (tree) {
    this.rpc.expose(tree);
  }

  handshake (socket, next) {
    var handshakeData = socket.request;

    console.log(handshakeData);

    // if (!valid) {
    //   next(new Error('not authorized'));
    // } else {
      next();
    // }
  }

  /**
   * listen - Registers BlueBridge events with the RPC server and begins listening
   *
   * @param  {Function} callback on listening callback function
   */
  listen (callback) {
    this.io.on('connection', this.onConnect.bind(this));

    this.exposePlugins();

    this.server.listen(PORT, callback);
  }

  destroy (callback) {
    for (let socket of this.sockets) {
      socket.disconnect();
    }
    callback();
  }

  /**
   * addSocket - Adds a socket to BlueBridges' local array
   *
   * @param  {Socket} socket The socket to add
   */
  addSocket (socket) {
    if (this.sockets.indexOf(socket) !== -1) {
      console.warn('attempted to add a socket twice!');
      return;
    }
    this.sockets.push(socket);
  }

  /**
   * removeSocket - Removes a socket form BlueBridges' local array
   *
   * @param  {Socket} socket The socket to remove
   */
  removeSocket (socket) {
    let index = this.sockets.indexOf(socket);
    if (index === -1) {
      console.warn('attempted to remove a socket that BlueBridge doesn\'t have reference to');
      return;
    }
    this.sockets.splice(index, 1);
  }

  /**
   * onConnect - BlueBridges' onConnect handler
   *
   * @param  {Socket} socket The socket that connected
   */
  onConnect (socket) {
    console.log('Socket Connected');
    this.addSocket(socket);

    this.initSocket(socket);

    socket.once('disconnect', () => {
      console.log('Socket Disconnected');
      this.onDisconnect(socket);
    });
  }

  /**
   *
   *
   * @param {Socket} socket The socket to initialize
   */
  initSocket (socket) {

  }

  /**
   * onDisconnect - BlueBridges' onDisconnect handler
   *
   * @param  {Socket} socket The socket the disconnected
   */
  onDisconnect (socket) {
    this.removeSocket(socket);
  }
}

module.exports = BlueBridge;
