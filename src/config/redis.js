const { createClient } = require('redis');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});

redisClient.on('error', err => {
  console.log('Error connecting Redis client:', err);
});

redisClient.connect();

module.exports = { redisClient };
