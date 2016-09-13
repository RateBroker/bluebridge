'use strict';

const cookieParser    = require('cookie-parser')
const expressSession  = require('express-session');
const passport        = require('passport');
const redisStore      = require('../redis-store');

module.exports = function (app) {

  app.use(cookieParser());
  app.use(expressSession({
    cookie: { httpOnly: false },
    store: redisStore,
    secret: 'we<3RateBroker',
    resave: true,
    saveUninitialized: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

};
