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

router.get('/:id', verifyToken, getExpenseDetails, expenseDetailsSerializer);

router.put(
  '/:id',
  updateExpenseValidator,
  verifyToken,
  upload.single('expense_image_url'),
  updateExpense,
  updateExpenseSerializer,
);

router.delete('/:id', verifyToken, deleteExpense);

router.post(
  '/:id/settle-up',
  settleUpValidator,
  verifyToken,
  settleUpExpense,
  settleUpSerializer,
);

router.post(
  '/:id/comments',
  verifyToken,
  createComment,
  createCommentSerializer,
);

router.get(
  '/:id/comments',
  verifyToken,
  getCommentsByExpense,
  getCommentsSerializer,
);

router.put(
  '/:id/comments/:commentId',
  verifyToken,
  updateComment,
  updateCommentSerializer,
);

router.delete('/:id/comments/:commentId', verifyToken, deleteComment);

module.exports = router;
