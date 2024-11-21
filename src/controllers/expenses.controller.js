const {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
  updateExpenseService,
  deleteExpenseService,
  settleUpService,
  createCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
} = require('../services/expenses.service.js');

const createExpense = async (req, res, next) => {
  const { groupId } = req.query;
  const { amount, description, splitType, users } = req.body;

  try {
    const expense = await createExpenseService(
      groupId,
      amount,
      description,
      splitType,
      users,
    );
    res.data = expense;
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
};

const getAllExpenses = async (req, res, next) => {
  const groupId = req.query.groupId;
  const { page = 1, limit = 10 } = req.query;
  try {
    const expenses = await getAllExpensesService(groupId, page, limit);
    res.data = expenses;
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
};

const getExpenseDetails = async (req, res, next) => {
  try {
    const expense = await getExpenseDetailsService(req.params.expenseId);
    res.data = expense;
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;

    const { description, amount, split_type } = req.body;

    const users = [];
    for (let i = 0; req.body[`users[${i}].userId`]; i++) {
      users.push({
        userId: req.body[`users[${i}].userId`],
        percentage: parseFloat(req.body[`users[${i}].percentage`] || 0),
        shares: parseFloat(req.body[`users[${i}].shares`] || 0),
        amountPaid: parseFloat(req.body[`users[${i}].amountPaid`] || 0),
      });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'No users data provided' });
    }

    const updatedExpense = await updateExpenseService({
      expenseId,
      description,
      amount,
      split_type,
      users,
    });

    res.data = updatedExpense;
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await deleteExpenseService(req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
};

const settleUpExpense = async (req, res, next) => {
  const { payerId, payeeId, amount } = req.body;
  console.log(payerId, payeeId, amount);
  const expenseId = req.params.expenseId;
  console.log(expenseId);

  try {
    const result = await settleUpService(payerId, payeeId, amount, expenseId);
    res.data = result;
    next();
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
};

const createComment = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const newComment = await createCommentService({
      expenseId,
      userId,
      comment,
    });

    res.data = newComment;
    next();
  } catch (error) {
    res.json({ error: error.message });
  }
};

const getCommentsByExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const comments = await getCommentsService(expenseId);

    res.data = comments;
    next();
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    const updatedComment = await updateCommentService(commentId, comment);

    res.data = updatedComment;
    next();
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    await deleteCommentService(commentId);

    res
      .status(200)
      .json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

module.exports = {
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
};
