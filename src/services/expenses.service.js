const {
  Group,
  Expense,
  ExpenseSplit,
  Comment,
  User,
  Payment,
} = require('../models');

const { sendExpenseNotification } = require('../helpers/mail.helper.js');

const createExpenseService = async (
  groupId,
  amount,
  description,
  splitType,
  users,
) => {
  const group = await Group.findByPk(groupId);
  if (!group) throw new Error('Group not found');

  const expense = await Expense.create({
    group_id: groupId,
    description: description || '',
    amount,
    split_type: splitType,
  });

  // let totalAmountPaid = 0;

  const groupUsers = await group.getUsers();

  switch (splitType) {
    case 'EQUALLY':
      {
        const share = amount / groupUsers.length;

        for (const user of groupUsers) {
          const isPayer = users.some(u => u.userId === user.id);

          const amountPaid = isPayer ? amount : 0;
          const amountOwed = isPayer ? share - amount : share;

          await ExpenseSplit.create({
            expense_id: expense.id,
            user_id: user.id,
            amount_paid: amountPaid,
            amount_owed: amountOwed,
            split_ratio: share,
          });
        }
      }
      break;

    case 'PERCENTAGE':
      {
        let totalPaidAmount = 0;
        const totalExpense = amount;

        for (const user of users) {
          totalPaidAmount += (user.percentage / 100) * totalExpense;
        }

        const splitRatio = totalPaidAmount / users.length;

        for (const user of users) {
          const { userId, percentage } = user;

          if (percentage < 0) {
            throw new Error('Percentage cannot be negative.');
          }

          const amountPaid = (percentage / 100) * totalExpense;

          const amountOwed = splitRatio - amountPaid;

          await ExpenseSplit.create({
            expense_id: expense.id,
            user_id: userId,
            amount_paid: amountPaid,
            amount_owed: amountOwed,
            split_ratio: splitRatio,
          });
        }

        if (Math.abs(totalPaidAmount - totalExpense) > 0.01) {
          throw new Error(
            'The total paid amount must match the total expense.',
          );
        }
      }
      break;

    case 'SHARES':
      {
        const totalShares = users.reduce((acc, user) => acc + user.shares, 0);

        const splitRatio = amount / users.length;

        for (const user of users) {
          const { userId, shares } = user;

          const amountPaid = (shares / totalShares) * amount;

          const amountOwed = splitRatio - amountPaid;

          await ExpenseSplit.create({
            expense_id: expense.id,
            user_id: userId,
            amount_paid: amountPaid,
            amount_owed: amountOwed,
            split_ratio: splitRatio,
          });
        }
      }
      break;

    case 'UNEQUAL':
      {
        let totalPaid = 0;

        users.forEach(user => {
          totalPaid += user.amount_paid;
        });
        if (totalPaid !== amount) {
          throw new Error(
            'The total amount paid must equal the total expense amount.',
          );
        }

        for (const user of users) {
          const { userId, amountPaid } = user;

          if (amountPaid < 0) {
            throw new Error('Amount paid cannot be negative.');
          }

          const splitRatio = amount / users.length;
          const amountOwed = splitRatio - amountPaid;

          await ExpenseSplit.create({
            expense_id: expense.id,
            user_id: userId,
            amount_paid: amountPaid,
            amount_owed: amountOwed,
            split_ratio: splitRatio,
          });
        }
      }
      break;

    default:
      throw new Error('Invalid split type');
  }

  const emailAddresses = groupUsers.map(user => user.email);
  await sendExpenseNotification(emailAddresses, expense, description, amount);

  return expense;
};

const getAllExpensesService = async (groupId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const expenses = await Expense.findAll({
    where: { group_id: groupId },
    limit: limit,
    offset: offset,
  });
  return expenses;
};

const getExpenseDetailsService = async expenseId => {
  const expense = await Expense.findOne({
    where: { id: expenseId },
  });
  if (!expense) throw new Error('Expense not found');
  return expense;
};

const updateExpenseService = async ({
  expenseId,
  description,
  amount,
  split_type,
  users,
}) => {
  const expense = await Expense.findByPk(expenseId);
  if (!expense) throw new Error('Expense not found');

  if (description) expense.description = description;
  if (amount) expense.amount = parseFloat(amount);
  if (split_type) expense.split_type = split_type;

  // save the updated expense
  await expense.save();

  // delete old splits
  await ExpenseSplit.destroy({ where: { expense_id: expense.id } });

  const group = await Group.findByPk(expense.group_id);
  if (!group) throw new Error('Group not found');
  const groupUsers = await group.getUsers();

  const splits = [];

  switch (split_type) {
    case 'EQUALLY': {
      const share = amount / groupUsers.length;

      for (const user of groupUsers) {
        const isPayer = users.some(u => u.userId === user.id);

        const amountPaid = isPayer ? amount : 0;
        const amountOwed = isPayer ? share - amount : share;

        splits.push({
          expense_id: expense.id,
          user_id: user.id,
          amount_paid: amountPaid,
          amount_owed: amountOwed,
          split_ratio: share,
        });
      }
      break;
    }

    case 'PERCENTAGE': {
      let totalPaidAmount = 0;

      users.forEach(user => {
        totalPaidAmount += (user.percentage / 100) * amount;
      });

      const splitRatio = totalPaidAmount / users.length;

      users.forEach(user => {
        if (user.percentage < 0 || user.percentage > 100) {
          throw new Error('Percentage must be between 0 and 100.');
        }

        const amountPaid = (user.percentage / 100) * amount;
        const amountOwed = splitRatio - amountPaid;

        splits.push({
          expense_id: expense.id,
          user_id: user.userId,
          amount_paid: amountPaid,
          amount_owed: amountOwed,
          split_ratio: splitRatio,
        });
      });

      if (Math.abs(totalPaidAmount - amount) > 0.01) {
        throw new Error(
          'The total percentage paid must match the total expense.',
        );
      }
      break;
    }

    case 'SHARES': {
      const totalShares = users.reduce((sum, user) => sum + user.shares, 0);
      if (totalShares <= 0)
        throw new Error('Total shares must be greater than zero.');

      users.forEach(user => {
        const amountPaid = (user.shares / totalShares) * amount;

        splits.push({
          expense_id: expense.id,
          user_id: user.userId,
          amount_paid: amountPaid,
          amount_owed: 0,
          split_ratio: user.shares,
        });
      });
      break;
    }

    case 'UNEQUAL': {
      let totalPaid = 0;

      users.forEach(user => {
        totalPaid += user.amountPaid;
      });

      if (Math.abs(totalPaid - amount) > 0.01) {
        throw new Error(
          'The total amount paid must match the total expense amount.',
        );
      }

      users.forEach(user => {
        const splitRatio = amount / users.length;
        const amountOwed = splitRatio - user.amountPaid;

        splits.push({
          expense_id: expense.id,
          user_id: user.userId,
          amount_paid: user.amountPaid,
          amount_owed: amountOwed,
          split_ratio: splitRatio,
        });
      });
      break;
    }

    default:
      throw new Error('Invalid split type');
  }

  // insert the new splits
  await ExpenseSplit.bulkCreate(splits);

  return expense;
};

const deleteExpenseService = async expenseId => {
  const expense = await Expense.findOne({
    where: { id: expenseId },
  });
  if (!expense) throw new Error('Expense not found');
  await expense.destroy();
};

const settleUpService = async (
  payerId,
  payeeId,
  amount,
  expenseId,
  groupId,
) => {
  const payerExpense = await ExpenseSplit.findOne({
    where: { user_id: payerId, expense_id: expenseId },
  });

  console.log(payerExpense);

  const payeeExpense = await ExpenseSplit.findOne({
    where: { user_id: payeeId, expense_id: expenseId },
  });

  if (!payerExpense || !payeeExpense) {
    throw new Error('User balances not found for settlement.');
  }

  let newPayerBalance = parseFloat(payerExpense.amount_owed) - amount;
  let newPayeeBalance =
    (parseFloat(payeeExpense.amount_owed) || 0) + parseFloat(amount);

  await ExpenseSplit.update(
    { amount_owed: newPayerBalance },
    { where: { user_id: payerId }, expense_id: expenseId },
  );

  await ExpenseSplit.update(
    { amount_owed: newPayeeBalance },
    { where: { user_id: payeeId }, expense_id: expenseId },
  );

  console.log('group id in console: ', groupId);

  const payment = await Payment.create({
    payer_id: payerId,
    payee_id: payeeId,
    amount,
    group_id: groupId,
    status: 'Completed',
  });

  return {
    payerId,
    payeeId,
    newPayerBalance,
    payment,
  };
};

const createCommentService = async ({ expenseId, userId, comment }) => {
  return await Comment.create({
    expense_id: expenseId,
    user_id: userId,
    comment,
  });
};

const getCommentsService = async expenseId => {
  return await Comment.findAll({
    where: { expense_id: expenseId },
    include: [{ model: User, attributes: ['username', 'profile_picture_url'] }],
    order: [['created_at', 'ASC']],
  });
};

const updateCommentService = async (commentId, newCommentText) => {
  const comment = await Comment.findByPk(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  comment.comment = newCommentText;
  await comment.save();
  return comment;
};

const deleteCommentService = async commentId => {
  const comment = await Comment.findByPk(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  await comment.destroy();
};

module.exports = {
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
};
