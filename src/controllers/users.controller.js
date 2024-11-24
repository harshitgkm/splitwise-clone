const {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
  removeFriendService,
  getAllPaymentsService,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
  getReportsService,
} = require('../services/users.service');

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

const getUserProfile = async (req, res, next) => {
  try {
    console.log('hello');
    const userId = req.user.id;
    const user = await getUserById(userId);
    res.data = user;
    next();
  } catch (error) {
    res.json({ error: error.message });
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const updatedData = req.body;

    if (req.file) {
      console.log('File uploaded:', req.file);
      const imageUrl = await uploadFileToS3(req.file);
      console.log('imageUrl', imageUrl);
      updatedData.profile_picture_url = imageUrl;
    }

    console.log(req.file);
    const updatedUser = await updateUser(req.params.id, updatedData);
    res.data = updatedUser;
    next();
  } catch (error) {
    console.log(error);
    res.json({ error: error.message });
  }
};

const getOutstandingBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const balance = await calculateOutstandingBalance(userId);
    console.log(balance);
    res.data = balance;

    next();
  } catch (error) {
    console.log(error);
    res.json({ error: 'Failed to fetch outstanding balance.' });
  }
};

const addFriend = async (req, res, next) => {
  const userId = req.user.id;
  const { id: friend_two } = req.body;

  if (!friend_two || userId === friend_two) {
    return res.status(400).json({ message: 'Invalid friend IDs provided' });
  }

  try {
    const newFriendship = await addFriendService(userId, friend_two);
    res.data = newFriendship;
    next();
  } catch (error) {
    console.error('Error adding friend:', error);
    res.json({ error: error.message });
  }
};

const getFriendsList = async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  try {
    const friendsList = await getFriends(userId, page, limit);
    res.data = friendsList;
    next();
  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
};

const removeFriend = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await removeFriendService(id, userId);
    return res.status(200).json({ message: 'Friend removed successfully' });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const getAllPaymentsForUser = async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const payments = await getAllPaymentsService(userId, page, limit);
    res.data = payments;
    next();
  } catch (err) {
    res.json({ error: err.message });
  }
};

const generateExpenseReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reportData = await generateExpenseReportService(userId);
    res.data = reportData;
    next();
  } catch (error) {
    res.json({ error: error.message });
  }
};

const exportReportToPDF = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const s3Url = await generatePDFAndUploadToS3(userId);
    res.data = s3Url;
    next();
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
};

const getAllReports = async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const reports = await getReportsService(userId, page, limit);
    res.data = reports;
    next();
  } catch (error) {
    return res.json({ error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
  getFriendsList,
  removeFriend,
  getAllPaymentsForUser,
  generateExpenseReport,
  exportReportToPDF,
  getAllReports,
};
