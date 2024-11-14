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

const createExpense = async (req, res) => {
  console.log('dfdf');
  const { groupId, amount, description, splitType, users } = req.body;
  const payerId = req.user.id;

  console.log(groupId, amount, description, splitType);

  try {
    const expense = await createExpenseService(
      groupId,
      payerId,
      amount,
      description,
      splitType,
      users,
    );
    res.status(201).json(expense);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const expenses = await getAllExpensesService(req.body.groupId);
    res.status(200).json(expenses);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const getExpenseDetails = async (req, res) => {
  try {
    const expense = await getExpenseDetailsService(
      req.body.groupId,
      req.params.expenseId,
    );
    res.status(200).json(expense);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  const { groupId } = req.body;
  try {
    const updatedExpense = await updateExpenseService(
      groupId,
      req.params.expenseId,
      req.body,
    );
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await deleteExpenseService(req.body.groupId, req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
};

const settleUpExpense = async (req, res) => {
  const { payerId, payeeId, amount } = req.body;
  const expenseId = req.params;

  try {
    const result = await settleUpService(payerId, payeeId, amount, expenseId);
    res.status(200).json({
      message: 'Settle up successful',
      data: result,
    });
  } catch (error) {
    res.json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const newComment = await createCommentService({
      expenseId,
      userId,
      comment,
    });

    res.status(201).json({ data: newComment });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const getCommentsByExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const comments = await getCommentsService(expenseId);

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    const updatedComment = await updateCommentService(commentId, comment);

    res.status(200).json({ success: true, data: updatedComment });
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
