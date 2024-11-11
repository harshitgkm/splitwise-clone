const { getUserById, updateUser } = require('../services/users.service');

const getUserProfile = async (req, res) => {
  try {
    console.log('hello');
    const userId = req.user.id; // Use authenticated user's ID from JWT
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

module.exports = { getUserProfile, updateUserProfile };
