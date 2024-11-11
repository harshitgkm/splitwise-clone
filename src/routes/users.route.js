const express = require('express');

const {
  getUserProfile,
  updateUserProfile,
} = require('../controllers/users.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.get('/me', verifyToken, getUserProfile);

router.put('/me', verifyToken, updateUserProfile);

module.exports = router;
