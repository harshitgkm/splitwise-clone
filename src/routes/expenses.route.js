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

router.post('/', verifyToken, checkUserInGroup, createExpense);

router.get('/', verifyToken, checkUserInGroup, getAllExpenses);

router.get('/:expenseId', verifyToken, getExpenseDetails);

router.put('/:expenseId', verifyToken, updateExpense);

router.delete('/:expenseId', verifyToken, deleteExpense);

router.post('/:expenseId/settle-up', verifyToken, settleUpExpense);

router.post('/:expenseId/comments', verifyToken, createComment);

router.get('/:expenseId/comments', verifyToken, getCommentsByExpense);

router.put('/:expenseId/comments/:commentId', verifyToken, updateComment);

router.delete('/:expenseId/comments/:commentId', verifyToken, deleteComment);

module.exports = router;
