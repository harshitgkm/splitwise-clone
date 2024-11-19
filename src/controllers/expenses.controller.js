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
  const { groupId } = req.query;
  const { amount, description, splitType, users } = req.body;

  console.log(groupId, amount, description, splitType);

  try {
    const expense = await createExpenseService(
      groupId,
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
  const groupId = req.query.groupId;
  const { page = 1, limit = 10 } = req.query;
  try {
    const expenses = await getAllExpensesService(groupId, page, limit);
    res.status(200).json(expenses);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const getExpenseDetails = async (req, res) => {
  try {
    const expense = await getExpenseDetailsService(req.params.expenseId);
    res.status(200).json(expense);
  } catch (error) {
    res.json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;

    //parse the form-data and organize into an object
    const { description, amount, split_type } = req.body;

    // parse users from form-data
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

    res
      .status(200)
      .json({ message: 'Expense updated successfully', updatedExpense });
  } catch (error) {
    res.json({ message: error.message });
  }
};

module.exports = { updateExpense };

const deleteExpense = async (req, res) => {
  try {
    await deleteExpenseService(req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
};

const settleUpExpense = async (req, res) => {
  const { payerId, payeeId, amount, groupId } = req.body;
  console.log(payerId, payeeId, amount);
  const expenseId = req.params.expenseId;
  console.log(expenseId);

  try {
    const result = await settleUpService(
      payerId,
      payeeId,
      amount,
      expenseId,
      groupId,
    );
    res.status(200).json({
      message: 'Settle up successful',
      data: result,
    });
  } catch (error) {
    console.log(error);
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
