const { Group, Expense } = require('../models');

const createExpenseService = async (
  groupId,
  payerId,
  amount,
  description,
  splitType,
) => {
  const group = await Group.findByPk(groupId);
  if (!group) throw new Error('Group not found');

  console.log(groupId, payerId, description, amount, splitType);

  const expense = await Expense.create({
    group_id: groupId,
    payer_id: payerId,
    description: description || '',
    amount: amount,
    split_type: splitType,
  });

  return expense;
};

const getAllExpensesService = async groupId => {
  const expenses = await Expense.findAll({ where: { group_id: groupId } });
  return expenses;
};

const getExpenseDetailsService = async (groupId, expenseId) => {
  const expense = await Expense.findOne({
    where: { group_id: groupId, id: expenseId },
  });
  if (!expense) throw new Error('Expense not found');
  return expense;
};

module.exports = {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
};
