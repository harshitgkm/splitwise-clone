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

const {
  expenseSerializer,
  getAllExpensesSerializer,
  expenseDetailsSerializer,
  updateExpenseSerializer,
  settleUpSerializer,
  createCommentSerializer,
  getCommentsSerializer,
  updateCommentSerializer,
} = require('../serializers/expenses.serializer');

router.post(
  '/',
  createExpenseValidator,
  verifyToken,
  checkUserInGroup,
  createExpense,
  expenseSerializer,
);

router.get(
  '/',
  verifyToken,
  checkUserInGroup,
  getAllExpenses,
  getAllExpensesSerializer,
);

router.get(
  '/:expenseId',
  verifyToken,
  getExpenseDetails,
  expenseDetailsSerializer,
);

router.put(
  '/:expenseId',
  updateExpenseValidator,
  verifyToken,
  upload.single('expense_image_url'),
  updateExpense,
  updateExpenseSerializer,
);

router.delete('/:expenseId', verifyToken, deleteExpense);

router.post(
  '/:expenseId/settle-up',
  settleUpValidator,
  verifyToken,
  settleUpExpense,
  settleUpSerializer,
);

router.post(
  '/:expenseId/comments',
  verifyToken,
  createComment,
  createCommentSerializer,
);

router.get(
  '/:expenseId/comments',
  verifyToken,
  getCommentsByExpense,
  getCommentsSerializer,
);

router.put(
  '/:expenseId/comments/:commentId',
  verifyToken,
  updateComment,
  updateCommentSerializer,
);

router.delete('/:expenseId/comments/:commentId', verifyToken, deleteComment);

module.exports = router;
