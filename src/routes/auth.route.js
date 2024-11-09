const express = require('express');
const router = express.Router();

const {
  register,
  requestOtp,
  verifyOtp,
} = require('../controllers/auth.controller.js');

router.post('/register', register);

router.post('/request-otp', requestOtp);

router.post('/verify-otp', verifyOtp);

module.exports = router;
