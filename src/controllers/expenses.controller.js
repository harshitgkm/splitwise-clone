const {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
  updateExpenseService,
} = require('../services/expenses.service.js');

const createExpense = async (req, res) => {
  console.log('dfdf');
  const { groupId, amount, description, splitType } = req.body;
  const payerId = req.user.id;

  console.log(groupId, amount, description, splitType);

  try {
    const expense = await createExpenseService(
      groupId,
      payerId,
      amount,
      description,
      splitType,
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

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
};
