const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
} = require('../controllers/expenses.controller.js');

const {
  verifyToken,
  checkUserInGroup,
} = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, checkUserInGroup, createExpense);

router.get('/', verifyToken, getAllExpenses);

module.exports = router;
