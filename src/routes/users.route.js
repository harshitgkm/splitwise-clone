const express = require('express');

const {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
  getFriendsList,
  getAllPaymentsForUser,
} = require('../controllers/users.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const upload = require('../middlewares/multer.middleware.js');

const {
  updateUserValidator,
  addFriendValidator,
} = require('../validators/users.validator');

const router = express.Router();

router.get('/me', verifyToken, getUserProfile);

router.put(
  '/me',
  updateUserValidator,
  verifyToken,
  upload.single('profile_image'),
  updateUserProfile,
);

router.get('/outstanding-balance', verifyToken, getOutstandingBalance);

router.post('/friends', addFriendValidator, verifyToken, addFriend);

router.get('/friends', verifyToken, getFriendsList);

router.get('/:userId/payments', verifyToken, getAllPaymentsForUser);

module.exports = router;
