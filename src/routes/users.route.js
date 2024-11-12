const express = require('express');

const {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
} = require('../controllers/users.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.get('/me', verifyToken, getUserProfile);

router.put('/me', verifyToken, updateUserProfile);

router.get('/outstanding-balance', verifyToken, getOutstandingBalance);

router.post('/friends', verifyToken, addFriend);

// router.get('/:userId/friends', verifyToken, getFriendsList);

module.exports = router;
