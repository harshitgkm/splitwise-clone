const { User } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { generateOtp, verifyOtp, saveOtp } = require('../helpers/otp.helper.js');
const sendOtpEmail = require('../helpers/mail.helper');
require('dotenv').config();

const generateToken = email => {
  console.log('JWT Secret:', process.env.JWT_SECRET);
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

module.exports = {
  generateToken,
  registerUser,
  requestOtpService,
  validateOtp,
  checkExistingUser,
};
