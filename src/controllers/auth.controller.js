const {
  registerUser,
  validateOtp,
  requestOtpService,
  checkExistingUser,
  logoutUser,
} = require('../services/auth.service');
const jwt = require('jsonwebtoken');

const { redisClient } = require('../config/redis.js');

const register = async (req, res) => {
  const { username, email } = req.body;

  try {
    const userKey = `register:${email}`;

    const existingDetails = await redisClient.get(userKey);
    if (existingDetails) {
      return res.json({
        message:
          'User already in registration process, please continue with OTP verification.',
      });
    }
    await redisClient.set(userKey, JSON.stringify({ username, email }), {
      EX: 1800,
    });

    console.log(
      'User details stored temporarily in Redis, redirecting to request OTP...',
    );
    res.json({ message: 'redirect to request-otp' });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email } = req.body;

  try {
    const ifUserExist = await checkExistingUser(email);

    if (ifUserExist) {
      await requestOtpService(email);
      return res.json({ message: 'OTP sent to your email for login' });
    } else {
      return res.json({ message: 'This user does not exist in the DB' });
    }
  } catch (err) {
    res.json({ error: err.message });
  }
};

const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const userKey = `register:${email}`;
    const userDetails = await redisClient.get(userKey);

    if (!userDetails) {
      return res.status(404).json({
        message:
          'User details not found. Please start the registration process.',
      });
    }

    const { email: storedEmail } = JSON.parse(userDetails);
    console.log('Sending OTP to:', storedEmail);
    await requestOtpService(storedEmail);

    res.json({ message: 'OTP sent to your email for registration' });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValidOtp = await validateOtp(email, otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const userKey = `register:${email}`;
    const userDetails = await redisClient.get(userKey);

    if (userDetails) {
      //registration flow
      const { username, email: storedEmail } = JSON.parse(userDetails);

      const message = await registerUser(username, storedEmail);

      console.log(`User registered successfully: ${message}`);
      await redisClient.del(userKey);

      const token = jwt.sign({ email: storedEmail }, process.env.JWT_SECRET, {
        expiresIn: '20h',
      });

      return res.json({ message: 'Registration successful', token });
    }

    //if user is not in redis -> login flow
    const userExists = await checkExistingUser(email);

    if (!userExists) {
      return res.status(404).json({ message: 'User does not exist.' });
    }

    console.log('User logged in successfully');
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '20h',
    });

    return res.json({ message: 'Login successful', token });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const logout = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.json({ message: 'No token provided' });
  }

  try {
    const result = await logoutUser(token);
    res.json({ message: result.message });
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = { register, requestOtp, verifyOtp, login, logout };
