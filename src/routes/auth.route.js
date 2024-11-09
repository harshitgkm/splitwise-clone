const express = require('express');
const router = express.Router();

const {
  register,
  requestOtp,
  verifyOtp,
  login,
} = require('../controllers/auth.controller.js');

const {
  validateRegister,
  validateLogin,
} = require('../validators/auth.validator');

router.post('/register', validateRegister, register);

router.post('/request-otp', requestOtp);

router.post('/verify-otp', verifyOtp);

router.post('/login', validateLogin, login);

module.exports = router;
