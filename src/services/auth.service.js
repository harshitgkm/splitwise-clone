const { User } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { redisClient } = require('../config/redis.js');
const { generateOtp, verifyOtp, saveOtp } = require('../helpers/otp.helper.js');
const { sendOtpEmail } = require('../helpers/mail.helper');
require('dotenv').config();

const generateToken = email => {
  console.log('JWT Secret:', process.env.JWT_SECRET);
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '20h' });
};

const registerUser = async (username, email) => {
  const user = new User({ username, email });
  await user.save();
  return 'User registered successfully';
};

const checkExistingUser = async email => {
  const user = await User.findOne({ where: { email } });

  return user ? true : false;
};

const requestOtpService = async email => {
  const otp = generateOtp();
  console.log(otp);
  console.log(`email in requestOtpService: ${email}`);
  await sendOtpEmail(email, otp);
  await saveOtp(email, otp);
};

const validateOtp = async (email, otp) => {
  return verifyOtp(email, otp);
};

const logoutUser = async token => {
  const decoded = jwt.decode(token);
  if (!decoded) {
    throw new Error('Failed to decode token');
  }

  const expTime = decoded.exp - Math.floor(Date.now() / 1000);
  console.log('Token expiration time in seconds:', expTime);

  if (expTime <= 0) {
    throw new Error('Token is already expired');
  }

  await redisClient.set(token, 'blacklisted', { EX: expTime });

  return {
    success: true,
    message: 'Token blacklisted successfully, You are now logged out',
  };
};

module.exports = {
  generateToken,
  registerUser,
  requestOtpService,
  validateOtp,
  checkExistingUser,
  logoutUser,
};
