'use strict';

const RPC       = require('socket.io-rpc');
const express   = require('express');
const http      = require('http');
const winston   = require('winston');

const PORT = parseInt(process.env.BLUEBRIDGE_PORT, 10);
if (!PORT) {
  throw new Error('process.env.BLUEBRIDGE_PORT not set');
}

class BlueBridge {

  constructor () {
    this.plugins  = [];
    this.sockets  = [];

    this.app    = express();
    require('./middleware/express')(this.app);

    this.server = http.createServer(this.app);

    this.rpc    = new RPC(this.server, {
      serveClient: false,
      path: '/socket.io'
    });
    this.io = this.rpc.io;
  }

  registerPlugin (plugin) {
    this.plugins.push(plugin);
  }

  exposePlugins () {
    this.plugins.forEach(plugin => {
      this.expose(plugin._expose());
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

  /**
   * listen - Registers BlueBridge events with the RPC server and begins listening
   *
   * @param  {Function} callback on listening callback function
   */
  listen (callback) {
    this.io.on('connection', this.onConnect.bind(this));

    this.IOmiddleware();
    this.exposePlugins();

    this.server.listen(PORT, callback);
  }

  IOmiddleware () {
    require('./middleware/io')(this.io);
    for (let plugin of this.plugins) {
      plugin._IOmiddleware(this.io);
    }
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
    // winston.info('Socket Connected');
    this.addSocket(socket);
    socket.once('disconnect', () => {
      // winston.info('Socket Disconnected');
      this.onDisconnect(socket);
    });
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
