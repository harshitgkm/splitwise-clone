const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense,
  settleUpExpense,
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

module.exports = router;
