const {
  registerUser,
  validateOtp,
  requestOtpService,
} = require('../services/auth.service');

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

const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // const user = await User.findOne({ email });
    // if (!user) return res.status(404).json({ message: 'User not found' });
    // Check if the user exists in the temporary store
    const userDetails = tempUserStore[email];
    if (!userDetails) {
      return res
        .status(404)
        .json({ message: 'User not found. Please register first.' });
    }
    // await requestOtpService(user._id, email);
    console.log('Sending OTP to:', email);
    await requestOtpService(email);
    res.json({ message: 'OTP sent to your email' });
    console.log('Otp sent');
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
    // const user = await User.findOne({ email });
    // if (!user) return res.status(404).json({ message: 'User not found' });
    const userDetails = tempUserStore[email];
    if (!userDetails) {
      return res
        .status(404)
        .json({ message: 'User not found. Please register first.' });
    }

    // const isValidOtp = await validateOtp(user._id, otp);
    const isValidOtp = await validateOtp(email, otp);
    if (!isValidOtp) return res.status(400).json({ message: 'Invalid OTP' });

    // const message = await registerUser(username, email);

    const message = await registerUser(userDetails.username, userDetails.email);
    console.log(`User registered successfully: ${message}`);

    // Clear the temporary store after successful registration
    delete tempUserStore[email];

    console.log(message);

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = { register, requestOtp, verifyOtp };
