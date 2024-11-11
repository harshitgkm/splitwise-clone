const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
} = require('../controllers/expenses.controller.js');

const {
  verifyToken,
  checkUserInGroup,
} = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, checkUserInGroup, createExpense);

router.get('/', verifyToken, checkUserInGroup, getAllExpenses);

router.get('/:expenseId', verifyToken, checkUserInGroup, getExpenseDetails);

router.put('/:expenseId', verifyToken, checkUserInGroup, updateExpense);

module.exports = router;
