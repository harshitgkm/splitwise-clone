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

const {
  verifyToken,
  checkUserInGroup,
} = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, checkUserInGroup, createExpense);

router.get('/', verifyToken, checkUserInGroup, getAllExpenses);

router.get('/:expenseId', verifyToken, checkUserInGroup, getExpenseDetails);

router.put('/:expenseId', verifyToken, checkUserInGroup, updateExpense);

router.delete('/:expenseId', verifyToken, checkUserInGroup, deleteExpense);

router.post('/:expenseId/settle-up', verifyToken, settleUpExpense);

router.post('/:expenseId/comments', verifyToken, createComment);

router.get('/:expenseId/comments', verifyToken, getCommentsByExpense);

router.put('/:expenseId/comments/:commentId', verifyToken, updateComment);

router.delete('/:expenseId/comments/:commentId', verifyToken, deleteComment);

module.exports = router;
