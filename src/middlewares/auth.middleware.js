const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();
const { redisClient } = require('../config/redis.js');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const isBlacklisted = await redisClient.get(token);
    if (isBlacklisted) {
      return res.json({ message: 'Token is invalid (blacklisted)' });
    }

    // If token is not blacklisted, verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { email: decoded.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.json({ message: 'Not authorized, token failed' });
  }
};

module.exports = {
  verifyToken,
};
