const { v4: uuidv4 } = require('uuid');
const { redisClient } = require('../config/redis.js');

const generateOtp = () => uuidv4().slice(0, 6);

const saveOtp = async (email, otp) => {
  await redisClient.set(email, otp, { EX: 300 });
  await redisClient.set(email, otp, { EX: 300, NX: true });
};

const verifyOtp = async (email, otp) => {
  const savedOtp = await redisClient.get(email);
  console.log(`"userOtp": ${otp}`);
  if (savedOtp === otp) {
    await redisClient.del(email);
    return true;
  }
  return false;
};

module.exports = { generateOtp, saveOtp, verifyOtp };
