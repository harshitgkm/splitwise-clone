const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense,
  settleUpExpense,
  createComment,
  getCommentsByExpense,
  updateComment,
  deleteComment,
} = require('../controllers/expenses.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const { checkUserInGroup } = require('../middlewares/expenses.middleware.js');
const upload = require('../middlewares/multer.middleware.js');

const {
  createExpenseValidator,
  updateExpenseValidator,
  settleUpValidator,
} = require('../validators/expenses.validator');

router.post(
  '/',
  createExpenseValidator,
  verifyToken,
  checkUserInGroup,
  createExpense,
);

router.get('/', verifyToken, checkUserInGroup, getAllExpenses);

router.get('/:expenseId', verifyToken, getExpenseDetails);

router.put(
  '/:expenseId',
  updateExpenseValidator,
  verifyToken,
  upload.single('expense_image_url'),
  updateExpense,
);

router.delete('/:expenseId', verifyToken, deleteExpense);

router.post(
  '/:expenseId/settle-up',
  settleUpValidator,
  verifyToken,
  settleUpExpense,
);

router.post('/:expenseId/comments', verifyToken, createComment);

router.get('/:expenseId/comments', verifyToken, getCommentsByExpense);

router.put('/:expenseId/comments/:commentId', verifyToken, updateComment);

router.delete('/:expenseId/comments/:commentId', verifyToken, deleteComment);

module.exports = router;
