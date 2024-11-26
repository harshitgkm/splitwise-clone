const express = require('express');

const {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
  removeFriend,
  getFriendsList,
  getAllPaymentsForUser,
  generateExpenseReport,
  exportReportToPDF,
  getAllReports,
} = require('../controllers/users.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const upload = require('../middlewares/multer.middleware.js');

const {
  userSerializer,
  outstandingBalanceSerializer,
  addFriendSerializer,
  getFriendsListSerializer,
  getAllPaymentsSerializer,
  generateExpenseReportSerializer,
  exportReportToPDFSerializer,
  getAllReportsSerializer,
} = require('../serializers/users.serializer.js');

const {
  updateUserValidator,
  addFriendValidator,
} = require('../validators/users.validator');

const router = express.Router();

router.get('/me', verifyToken, getUserProfile, userSerializer);

router.put(
  '/me',
  updateUserValidator,
  verifyToken,
  upload.single('profile_image'),
  updateUserProfile,
  userSerializer,
);

router.get(
  '/outstanding-balance',
  verifyToken,
  getOutstandingBalance,
  outstandingBalanceSerializer,
);

router.post(
  '/friends',
  addFriendValidator,
  verifyToken,
  addFriend,
  addFriendSerializer,
);

router.get('/friends', verifyToken, getFriendsList, getFriendsListSerializer);

router.delete('/friends/:id', verifyToken, removeFriend);

router.get(
  '/payment-report',
  verifyToken,
  getAllPaymentsForUser,
  getAllPaymentsSerializer,
);

router.get(
  '/expense-report',
  verifyToken,
  generateExpenseReport,
  generateExpenseReportSerializer,
);

router.post(
  '/report-pdf',
  verifyToken,
  exportReportToPDF,
  exportReportToPDFSerializer,
);

router.get('/reports', verifyToken, getAllReports, getAllReportsSerializer);

module.exports = router;
