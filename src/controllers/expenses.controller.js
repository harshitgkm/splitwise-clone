const { createExpenseService } = require('../services/expenses.service.js');

const createExpense = async (req, res) => {
  console.log('dfdf');
  const { groupId, amount, description, splitType } = req.body;
  const payerId = req.user.id;
  // const data = req.body;

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

module.exports = { createExpense };
