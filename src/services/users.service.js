const {
  User,
  Expense,
  ExpenseSplit,
  FriendList,
  Payment,
  Report,
} = require('../models');
require('dotenv').config();
const Op = require('sequelize');
const { Sequelize } = require('sequelize');
const { uploadFileToS3 } = require('../helpers/aws.helper.js');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const { v4: uuidv4 } = require('uuid');

const getUserById = async userId => {
  console.log('Fetching user by ID');
  return await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
};

const updateUser = async (userId, updatedData) => {
  console.log('updated-user-data', updatedData);
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

const getFriends = async (userId, page = 1, limit = 10) => {
  console.log('User id => ', typeof userId);

  const offset = (page - 1) * limit;

  let friend = await FriendList.findAll({
    where: Op.or(
      Op.literal(`"friend_one" = CAST('${userId}' AS UUID)`),
      Op.literal(`"friend_two" = CAST('${userId}' AS UUID)`),
    ),
    include: [
      {
        model: User,
        as: 'friend_one_details',
      },
      {
        model: User,
        as: 'friend_two_details',
      },
    ],
    limit: limit,
    offset: offset,
  });
  return friend;
};

const getAllPaymentsService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const payments = await Payment.findAll({
    where: Op.or(
      Op.literal(`"payer_id" = CAST('${userId}' AS UUID)`),
      Op.literal(`"payee_id" = CAST('${userId}' AS UUID)`),
    ),
    order: [['created_at', 'DESC']],
    limit: limit,
    offset: offset,
  });

  return payments;
};

const generateExpenseReportService = async userId => {
  try {
    const totalExpenses = await Expense.findAll({
      where: { payer_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalExpenses'],
      ],
      raw: true,
    });

    const totalPayments = await Payment.findAll({
      where: { payer_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalPayments'],
      ],
      raw: true,
    });

    const balance =
      (totalExpenses[0].totalExpenses || 0) -
      (totalPayments[0].totalPayments || 0);

    return {
      totalExpenses: totalExpenses[0].totalExpenses || 0,
      totalPayments: totalPayments[0].totalPayments || 0,
      balance,
    };
  } catch (error) {
    console.log(error);
    throw new Error('Failed to generate report data');
  }
};

const generatePDFAndUploadToS3 = async userId => {
  try {
    const reportData = await generateExpenseReportService(userId);
    console.log('Hello worrld');
    console.log(reportData);

    // const fs = require('fs');
    // const path = require('path');

    //create a pdf document
    const pdfDoc = new PDFDocument();
    const passThroughStream = new PassThrough();
    pdfDoc.pipe(passThroughStream);

    //add content to the PDF
    pdfDoc.fontSize(18).text('Expense Report', { align: 'center' });
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(`Total Expenses: ${reportData.totalExpenses}`);
    pdfDoc.text(`Total Payments: ${reportData.totalPayments}`);
    pdfDoc.text(`Balance: ${reportData.balance}`);
    pdfDoc.end();

    //save to local

    // const pdfPath = path.join(__dirname, `expense-report-${userId}.pdf`);
    // const writeStream = fs.createWriteStream(pdfPath);
    // pdfDoc.pipe(writeStream);
    // pdfDoc.end();

    // writeStream.on('finish', () => {
    //   console.log(`PDF report saved locally at ${pdfPath}`);
    // });

    // pdfDoc.on('data', chunk => {
    //   console.log('Writing chunk to buffer:', chunk);
    // });

    //prepare file object for S3 upload
    const pdfFile = {
      originalname: `expense-report-${userId}-${uuidv4()}.pdf`,
      buffer: passThroughStream.read(),
      ACL: 'public-read',
      mimetype: 'application/pdf',
    };

    //upload PDF to S3 and get the file url
    const s3Url = await uploadFileToS3(pdfFile);

    console.log('hello world 2 ');

    await Report.create({
      user_id: userId,
      report_url: s3Url,
    });

    return s3Url;
  } catch (error) {
    throw new Error(
      'Error generating and uploading PDF report: ' + error.message,
    );
  }
};

const getReportsService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const reports = await Report.findAll({
    where: {
      user_id: userId,
    },
    order: [['created_at', 'DESC']],
    limit: limit,
    offset: offset,
  });

  if (reports.length === 0) {
    throw new Error('No reports found for this user');
  }

  return reports;
};

module.exports = {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
  getAllPaymentsService,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
  getReportsService,
};
