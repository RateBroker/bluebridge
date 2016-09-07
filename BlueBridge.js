'use strict';

const RPC = require('socket.io-rpc');
const express = require('express');

class BlueBridge {

  constructor () {
    this.sockets        = [];
    this.models         = {};

    this.options = {
      // TODO: bluebridge-auth
      test: function (handshake, callback) {
        if (handshake.passw == '123') {
          callback(true);
        } else {
          callback(false);
        }
      }
    };

    let port = parseInt(process.env.BLUEBRIDGE_PORT, 10);
    this.rpc = new RPC(port);
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
    this.rpc.io.on('connection', this.onConnect.bind(this));
    this.rpc.io.on('disconnected', this.onDisconnect.bind(this));

    this.rpc.server.listen(callback);
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
    socket.on('disconnect', () => {
      console.log('Socket Disconnected');
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

let bluebridge = new BlueBridge();

module.exports = bluebridge;
