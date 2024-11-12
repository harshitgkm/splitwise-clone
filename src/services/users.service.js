const { User, ExpenseSplit, FriendList } = require('../models');
require('dotenv').config();

const getUserById = async userId => {
  console.log('Fetching user by ID');
  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
};

const updateUser = async (userId, updatedData) => {
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

module.exports = {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
};
