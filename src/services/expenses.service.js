const {
  Group,
  Expense,
  ExpenseSplit,
  Comment,
  User,
  Payment,
} = require('../models');

const { sendExpenseNotification } = require('../helpers/mail.helper.js');
const sequelize = require('../models').sequelize;

const createExpenseService = async (
  groupId,
  amount,
  description,
  splitType,
  users,
) => {
  const group = await Group.findByPk(groupId);
  if (!group) throw new Error('Group not found');

  if (amount <= 0) {
    throw new Error('Total expense amount must be greater than zero.');
  }

  const expense = await Expense.create({
    group_id: groupId,
    description: description || '',
    amount,
    split_type: splitType,
  });

  const groupUsers = await group.getUsers();

  let totalPaidByUsers = 0;
  switch (splitType) {
    case 'EQUALLY': {
      const share = amount / groupUsers.length;

      for (const user of groupUsers) {
        const isPayer = users.some(u => u.userId === user.id);

        const amountPaid = isPayer ? amount : 0;
        const amountOwed = isPayer ? share - amount : share;

        totalPaidByUsers += amountPaid;

        await ExpenseSplit.create({
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
      let totalPercentage = 0;

      for (const user of users) {
        totalPercentage += user.percentage;

        if (user.percentage < 0) {
          throw new Error('Percentage cannot be negative.');
        }
      }

      if (totalPercentage !== 100) {
        throw new Error('The total percentage must equal 100%.');
      }

      for (const user of users) {
        const { userId, percentage } = user;

        const amountPaid = (percentage / 100) * amount;
        totalPaidByUsers += amountPaid;

        const amountOwed = amount - amountPaid;

        await ExpenseSplit.create({
          expense_id: expense.id,
          user_id: userId,
          amount_paid: amountPaid,
          amount_owed: amountOwed,
          split_ratio: percentage / 100,
        });
      }
      break;
    }

    case 'SHARES': {
      const totalShares = users.reduce((acc, user) => acc + user.shares, 0);

      if (totalShares <= 0) {
        throw new Error('Total shares must be greater than zero.');
      }

      for (const user of users) {
        const { userId, shares } = user;

        const amountPaid = (shares / totalShares) * amount;
        totalPaidByUsers += amountPaid;

        const amountOwed = amount - amountPaid;

        await ExpenseSplit.create({
          expense_id: expense.id,
          user_id: userId,
          amount_paid: amountPaid,
          amount_owed: amountOwed,
          split_ratio: shares / totalShares,
        });
      }
      break;
    }

    case 'UNEQUAL': {
      let totalPaid = 0;

      for (const user of users) {
        const { amountPaid } = user;

        if (amountPaid < 0) {
          throw new Error('Amount paid cannot be negative.');
        }

        totalPaid += amountPaid;
      }

      if (totalPaid != amount) {
        throw new Error(
          `The total amount paid by users (${totalPaid}) is not equal to the total expense amount (${amount}).`,
        );
      }

      for (const user of users) {
        const { userId, amountPaid } = user;

        totalPaidByUsers += amountPaid;

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
      break;
    }

    default:
      throw new Error('Invalid split type');
  }

  if (totalPaidByUsers > amount) {
    throw new Error(
      `The total amount paid by users (${totalPaidByUsers}) cannot exceed the total expense amount (${amount}).`,
    );
  }

  const emailAddresses = groupUsers.map(user => user.email);
  await sendExpenseNotification(emailAddresses, expense, description, amount);

  return expense;
};

const getAllExpensesService = async (groupId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const totalExpensesCount = await Expense.count({
    where: { group_id: groupId },
  });

  const expenses = await Expense.findAll({
    where: { group_id: groupId },
    limit: limit,
    offset: offset,
  });

  const totalPages = Math.ceil(totalExpensesCount / limit);

  return {
    expenses,
    pagination: {
      total: totalExpensesCount,
      page,
      limit,
      totalPages,
    },
  };
};

const getExpenseDetailsService = async expenseId => {
  const expense = await Expense.findOne({
    where: { id: expenseId },
    include: [
      {
        model: ExpenseSplit,
        as: 'expenseSplits',
        attributes: ['user_id', 'amount_paid', 'amount_owed', 'split_ratio'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username'],
          },
        ],
      },
    ],
  });

  if (!expense) throw new Error('Expense not found');

  const expenseSplits = expense.expenseSplits.map(split => ({
    user_id: split.user_id,
    amount_paid: split.amount_paid,
    amount_owed: split.amount_owed,
    split_ratio: split.split_ratio,
    username: split.user.username,
  }));

  const payers = [];
  const oweDetails = [];

  const totalPaid = expenseSplits.reduce(
    (sum, split) => sum + parseFloat(split.amount_paid),
    0,
  );

  //calculate who owes whom based on the amount paid and the total amount
  expenseSplits.forEach(split => {
    const share = totalPaid / expenseSplits.length;
    if (parseFloat(split.amount_paid) > share) {
      payers.push({
        user_id: split.user_id,
        amount_paid: split.amount_paid,
        username: split.username,
        split_ratio: split.split_ratio,
      });
    }

    // check if user owes anyone (those who paid more than their share)
    if (parseFloat(split.amount_owed) > 0) {
      //find out who owes to whom (overpaid users, i.e., payers)
      payers.forEach(payer => {
        if (payer.username !== split.username) {
          const amountOwed = share - parseFloat(split.amount_paid);
          if (amountOwed > 0) {
            oweDetails.push({
              payer: split.username, // who paid less
              oweTo: payer.username, // who paid more
              amount: amountOwed.toFixed(2),
            });
          }
        }
      });
    }
  });

  return {
    ...expense.toJSON(),
    expenseSplits,
    oweDetails,
  };
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

const settleUpService = async (payerId, payeeId, amount, expenseId, userId) => {
  if (payerId !== userId) {
    throw new Error('The amount to settle must match the amount owed.');
  }

  const t = await sequelize.transaction();

  try {
    const payerExpense = await ExpenseSplit.findOne({
      where: { user_id: payerId, expense_id: expenseId },
      transaction: t,
    });

    const payeeExpense = await ExpenseSplit.findOne({
      where: { user_id: payeeId, expense_id: expenseId },
      transaction: t,
    });

    if (!payerExpense || !payeeExpense) {
      throw new Error('User balances not found for settlement.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount specified.');
    }

    if (parseFloat(payerExpense.amount_owed) !== parsedAmount) {
      throw new Error('The amount to settle must match the amount owed.');
    }

    let newPayerBalance = parseFloat(payerExpense.amount_owed) - parsedAmount;
    let newPayeeBalance = parseFloat(payeeExpense.amount_owed) + parsedAmount;

    await ExpenseSplit.update(
      { amount_owed: newPayerBalance },
      { where: { user_id: payerId, expense_id: expenseId }, transaction: t },
    );

    await ExpenseSplit.update(
      { amount_owed: newPayeeBalance },
      { where: { user_id: payeeId, expense_id: expenseId }, transaction: t },
    );

    const payment = await Payment.create(
      {
        payer_id: payerId,
        payee_id: payeeId,
        amount: parsedAmount,
        status: 'Completed',
        expense_id: expenseId,
      },
      { transaction: t },
    );

    await t.commit();

    return {
      payerId,
      payeeId,
      payment,
    };
  } catch (error) {
    await t.rollback();
    throw new Error('Transaction failed: ' + error.message);
  }
};

const createCommentService = async ({ expenseId, userId, comment }) => {
  const newComment = await Comment.create({
    expense_id: expenseId,
    user_id: userId,
    comment,
  });

  const user = await User.findByPk(userId, {
    attributes: ['username', 'profile_picture_url'],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: newComment.id,
    expenseId: newComment.expense_id,
    userId: newComment.user_id,
    comment: newComment.comment,
    createdAt: newComment.created_at,
    updatedAt: newComment.updated_at,
    user: {
      username: user.username,
      profilePicture: user.profile_picture_url,
    },
  };
};

const getCommentsService = async expenseId => {
  return await Comment.findAll({
    where: { expense_id: expenseId },
    include: [
      {
        model: User,
        attributes: ['username', 'profile_picture_url'],
      },
    ],
    order: [['created_at', 'ASC']],
  });
};

const updateCommentService = async (commentId, newCommentText) => {
  const comment = await Comment.findByPk(commentId, {
    include: [
      {
        model: User,
        attributes: ['username', 'profile_picture_url'],
      },
    ],
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  comment.comment = newCommentText;
  await comment.save();

  return {
    id: comment.id,
    expenseId: comment.expense_id,
    userId: comment.user_id,
    comment: comment.comment,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    user: {
      username: comment.User.username,
      profilePicture: comment.User.profile_picture_url,
    },
  };
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
