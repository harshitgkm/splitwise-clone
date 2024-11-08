const { createClient } = require('redis');
const redisClient = createClient();

redisClient.on('error', err => {
  console.log('Error connecting redis client', err);
});

redisClient.connect();

module.exports = { redisClient };
