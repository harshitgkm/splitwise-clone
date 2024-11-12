const {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
} = require('../services/users.service');

const getUserProfile = async (req, res) => {
  try {
    console.log('hello');
    const userId = req.user.id;
    const user = await getUserById(userId);
    res.json(user);
    console.log('after try of getUserProfile');
  } catch (error) {
    res.json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedData = req.body;
    const updatedUser = await updateUser(userId, updatedData);
    res.json(updatedUser);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const getOutstandingBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await calculateOutstandingBalance(userId);
    res.status(200).json({ outstandingBalance: balance });
  } catch (error) {
    console.log(error);
    res.json({ error: 'Failed to fetch outstanding balance.' });
  }
};

const addFriend = async (req, res) => {
  const userId = req.user.id;
  const { friend_two } = req.body;

  console.log('hello');

  if (!friend_two || userId === friend_two) {
    return res.status(400).json({ message: 'Invalid friend IDs provided' });
  }

  try {
    const newFriendship = await addFriendService(userId, friend_two);
    res.status(201).json({
      message: 'Friend added successfully',
      friendship: newFriendship,
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.json({ error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
};
