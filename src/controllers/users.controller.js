const {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
} = require('../services/users.service');

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

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

    if (req.file) {
      console.log('File uploaded:', req.file);

      const imageUrl = await uploadFileToS3(req.file);
      console.log('imageUrl', imageUrl);
      updatedData.profile_picture_url = imageUrl;
    }

    console.log(req.file);
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

const getFriendsList = async (req, res) => {
  const userId = req.user.id;
  console.log(userId);

  try {
    const friendsList = await getFriends(userId);
    console.log(friendsList);
    res.status(200).json({ friends: friendsList });
  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
  getFriendsList,
};
