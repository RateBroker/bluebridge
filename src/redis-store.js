'use strict';

const expressSession  = require('express-session');
const redis           = require('redis');
const RedisStore      = require('connect-redis')(expressSession);

const redisClient = redis.createClient(6379, 'localhost');
const redisStore  = new RedisStore({
  client: redisClient,
});

module.exports = redisStore;
