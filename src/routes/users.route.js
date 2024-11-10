const express = require('express');

const {
  getUserProfile,
  updateUserProfile,
  logout,
} = require('../controllers/users.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.get('/me', verifyToken, getUserProfile);

router.put('/me', verifyToken, updateUserProfile);

router.post('/logout', verifyToken, logout);

module.exports = router;
