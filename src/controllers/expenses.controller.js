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

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

const createExpense = async (req, res) => {
  const { groupId } = req.query;
  const { amount, description, splitType, users } = req.body;
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
    const expenses = await getAllExpensesService(req.query.groupId);
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
    const expenseData = req.body;

    if (req.url) {
      console.log(req.url);

      const image = await uploadFileToS3(req.url);
      console.log(image);
      expenseData.expense_image_url = image;
    }

    const updatedExpense = await updateExpenseService(
      req.params.expenseId,
      expenseData,
    );
    res.status(200).json(updatedExpense);
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
