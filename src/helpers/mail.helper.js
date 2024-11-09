const sendMail = require('../utils/mail.util.js');

const sendOtpEmail = async (email, otp) => {
  console.log(`email in mail helper: ${email}`);
  const subject = 'Your OTP Code';
  const text = `Your OTP code is ${otp}`;
  return sendMail(email, subject, text);
};

module.exports = sendOtpEmail;
