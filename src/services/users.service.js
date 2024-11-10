const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis.js');
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

const logoutUser = async token => {
  try {
    // Decode without verification to avoid expiration errors
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new Error('Failed to decode token');
    }

    const expTime = decoded.exp - Math.floor(Date.now() / 1000); // Calculate expiration time in seconds
    console.log('Token expiration time in seconds:', expTime);

    if (expTime <= 0) {
      throw new Error('Token is already expired');
    }

    // Add the token to Redis with an expiration time
    await redisClient.set(token, 'blacklisted', { EX: expTime });

    return {
      success: true,
      message: 'Token blacklisted successfully, You are now logged out',
    };
  } catch (error) {
    console.log(error);
    throw new Error('Token invalid or expired');
  }
};

module.exports = { getUserById, updateUser, logoutUser };
