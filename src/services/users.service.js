const {
  User,
  Expense,
  ExpenseSplit,
  FriendList,
  Payment,
} = require('../models');
require('dotenv').config();
const Op = require('sequelize');
const { Sequelize } = require('sequelize');

const getUserById = async userId => {
  console.log('Fetching user by ID');
  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
};

const updateUser = async (userId, updatedData) => {
  console.log('updated-user-data', updatedData);
  await User.update(updatedData, {
    where: { id: userId },
  });

  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
};

const calculateOutstandingBalance = async userId => {
  const expenseSplits = await ExpenseSplit.findAll({
    where: { user_id: userId },
  });

  const outstandingBalance = expenseSplits.reduce(
    (acc, split) => acc + (split.amount_owed - split.amount_paid),
    0,
  );
  return outstandingBalance;
};

const addFriendService = async (friend_one, friend_two) => {
  console.log('friend_one:', friend_one);
  console.log('friend_two:', friend_two);

  const newFriendship = await FriendList.create({ friend_one, friend_two });
  return newFriendship;
};

const getFriends = async userId => {
  console.log('User id => ', typeof userId);
  let friend = await FriendList.findAll({
    where: Op.or(
      Op.literal(`"friend_one" = CAST('${userId}' AS UUID)`),
      Op.literal(`"friend_two" = CAST('${userId}' AS UUID)`),
    ),
    include: [
      {
        model: User,
        as: 'friend_one_details',
      },
      {
        model: User,
        as: 'friend_two_details',
      },
    ],
  });
  return friend;
};

const getAllPaymentsService = async userId => {
  console.log(userId);
  const payments = await Payment.findAll({
    where: Op.or(
      Op.literal(`"payer_id" = CAST('${userId}' AS UUID)`),
      Op.literal(`"payee_id" = CAST('${userId}' AS UUID)`),
    ),
    order: [['created_at', 'DESC']],
  });

  return payments;
};

const generateExpenseReportService = async userId => {
  try {
    const totalExpenses = await Expense.findAll({
      where: { payer_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalExpenses'],
      ],
      raw: true,
    });

    const totalPayments = await Payment.findAll({
      where: { payer_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalPayments'],
      ],
      raw: true,
    });

    const balance =
      (totalExpenses[0].totalExpenses || 0) -
      (totalPayments[0].totalPayments || 0);

    return {
      totalExpenses: totalExpenses[0].totalExpenses || 0,
      totalPayments: totalPayments[0].totalPayments || 0,
      balance,
    };
  } catch (error) {
    console.log(error);
    throw new Error('Failed to generate report data');
  }
};

module.exports = {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
  getAllPaymentsService,
  generateExpenseReportService,
};
