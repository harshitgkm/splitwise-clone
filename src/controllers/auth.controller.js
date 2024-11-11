const {
  registerUser,
  validateOtp,
  requestOtpService,
  checkExistingUser,
  logoutUser,
} = require('../services/auth.service');
const jwt = require('jsonwebtoken');

let tempUserStore = {};

const register = async (req, res) => {
  console.log('Before request body of register in controller');
  const { username, email } = req.body;

  try {
    tempUserStore[email] = { username, email };

    console.log(
      `User details stored temporarily, redirecting to request OTP...`,
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
      return res.json({ message: 'redirect to request-otp' });
    }
    res.json({ message: 'This user does not exist in DB' });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the temporary store (if they are in the process of registration)
    const userDetails = tempUserStore[email];
    if (!userDetails) {
      // If the user does not exist, check if they are already in the DB (login flow)
      const userExists = await checkExistingUser(email);
      if (!userExists) {
        // If the user doesn't exist in DB, treat it as a registration process
        return res
          .status(404)
          .json({ message: 'User not found. Please register first.' });
      }
      // If the user exists, it's a login, proceed with sending OTP
      console.log('Sending OTP to:', email);
      await requestOtpService(email);
      return res.json({ message: 'OTP sent to your email for login' });
    }
    // If the user details are in the temporary store, it's a registration process
    console.log('Sending OTP to:', email);
    await requestOtpService(email);
    res.json({ message: 'OTP sent to your email for registration' });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log(
    `after getting otp form email : the user entered otp is: ${otp} and ${email}`,
  );

  try {
    const isValidOtp = await validateOtp(email, otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the user exists in the temporary store (i.e., it's a registration)
    const userDetails = tempUserStore[email];

    if (userDetails) {
      // Registration flow: create a new user
      const message = await registerUser(
        userDetails.username,
        userDetails.email,
      );
      console.log(`User registered successfully: ${message}`);

      // Clear the temporary store after successful registration
      delete tempUserStore[email];

      // Generate JWT token after registration
      const token = jwt.sign(
        { email: userDetails.email },
        process.env.JWT_SECRET,
        { expiresIn: '20h' },
      );

      return res.json({ message: 'Registration successful', token });
    }

    // Login flow: If the user already exists, just send the login response
    // User exists in the database (not in temp store), so it's a login flow
    console.log('User logged in successfully');
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ message: 'Login successful', token });
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
