const { Group, Expense, ExpenseSplit } = require('../models');

const createExpenseService = async (
  groupId,
  payerId,
  amount,
  description,
  splitType,
  users,
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

  // Create entries in the ExpenseSplit table based on the split type
  let totalAmountPaid = 0; // To ensure that the total amount paid matches the expense amount

  if (splitType === 'EQUALLY') {
    // Split equally among all group members
    const groupUsers = await group.getUsers(); // Fetch all users in the group
    const share = amount / groupUsers.length;

    for (const user of groupUsers) {
      totalAmountPaid += user.id === payerId ? amount : 0;

      await ExpenseSplit.create({
        expense_id: expense.id,
        user_id: user.id,
        amount_paid: user.id === payerId ? amount : 0, // Only the payer pays the full amount
        split_ratio: share,
        amount_owed: user.id === payerId ? 0 : share, // Others owe their share
      });
    }
  } else if (splitType === 'UNEQUAL') {
    // Unequal split: user needs to specify how much each one pays
    for (const user of users) {
      const { userId, amountPaid, amountOwed } = user;
      totalAmountPaid += amountPaid;

      // Create ExpenseSplit for each user with their specified amount paid and owed
      await ExpenseSplit.create({
        expense_id: expense.id,
        user_id: userId,
        amount_paid: amountPaid,
        split_ratio: amountOwed,
        amount_owed: amountOwed,
      });
    }
  } else if (splitType === 'PERCENTAGE') {
    // Percentage-based split: Each user pays a certain percentage of the total amount
    for (const user of users) {
      const { userId, percentage } = user;
      const amountPaid = (percentage / 100) * amount;
      const amountOwed = amount - amountPaid; // The rest is owed

      totalAmountPaid += amountPaid;

      await ExpenseSplit.create({
        expense_id: expense.id,
        user_id: userId,
        amount_paid: amountPaid,
        split_ratio: (percentage / 100) * 100, // 100% split for each user
        amount_owed: amountOwed,
      });
    }
  } else if (splitType === 'SHARES') {
    // Shares-based split: Users specify how many shares they should pay
    const totalShares = users.reduce((acc, user) => acc + user.shares, 0);
    const shareValue = amount / totalShares;

    for (const user of users) {
      const { userId, shares } = user;
      const amountPaid = shareValue * shares;
      const amountOwed = amount - amountPaid;

      totalAmountPaid += amountPaid;

      await ExpenseSplit.create({
        expense_id: expense.id,
        user_id: userId,
        amount_paid: amountPaid,
        split_ratio: shareValue * shares,
        amount_owed: amountOwed,
      });
    }
  }

  // Validate if total amount paid matches the actual expense amount
  if (totalAmountPaid !== amount) {
    throw new Error('The total amount paid does not match the expense amount.');
  }

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

const updateExpenseService = async (groupId, expenseId, data) => {
  const expense = await Expense.findOne({
    where: { group_id: groupId, id: expenseId },
  });
  if (!expense) throw new Error('Expense not found');

  expense.description = data.description || expense.description;
  expense.amount = data.amount || expense.amount;
  expense.expense_image_url =
    data.expense_image_url || expense.expense_image_url;
  await expense.save();

  return expense;
};

const deleteExpenseService = async (groupId, expenseId) => {
  const expense = await Expense.findOne({
    where: { group_id: groupId, id: expenseId },
  });
  if (!expense) throw new Error('Expense not found');
  await expense.destroy();
};

module.exports = {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
  updateExpenseService,
  deleteExpenseService,
};
