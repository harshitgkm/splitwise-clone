const { createClient } = require('redis');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });

const redisClient = createClient({
  url: process.env.REDIS_URI,
});

redisClient.on('error', err => {
  console.log('Error connecting Redis client:', err);
});

redisClient.connect();

module.exports = { redisClient };
