const {
  User,
  ExpenseSplit,
  FriendList,
  Payment,
  Expense,
  Report,
  Group,
} = require('../models');
require('dotenv').config();
const Op = require('sequelize');
const { Sequelize } = require('sequelize');
const { uploadFileToS3 } = require('../helpers/aws.helper.js');

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

const addFriendService = async (friend_one, friend_username) => {
  const friend = await User.findOne({
    where: { username: friend_username },
    attributes: ['id', 'username'],
  });

  if (!friend) {
    throw new Error('User with this username not found');
  }

  const friend_two = friend.id;

  if (friend_one === friend_two) {
    throw new Error('You cannot add yourself as a friend');
  }

  const existingFriendship = await FriendList.findOne({
    where: Op.or(
      Op.literal(
        `"friend_one" = CAST('${friend_one}' AS UUID) AND "friend_two" = CAST('${friend_two}' AS UUID)`,
      ),
      Op.literal(
        `"friend_one" = CAST('${friend_two}' AS UUID) AND "friend_two" = CAST('${friend_one}' AS UUID)`,
      ),
    ),
  });

  if (existingFriendship) {
    throw new Error('Friendship already exists');
  }

  await FriendList.create({
    friend_one: friend_one,
    friend_two: friend_two,
  });

  return {
    message: `Friendship created successfully with ${friend.username}`,
    friend: friend.username,
  };
};

const getFriends = async userId => {
  const friends = await FriendList.findAll({
    where: Sequelize.literal(
      `"friend_one" = CAST('${userId}' AS UUID) OR "friend_two" = CAST('${userId}' AS UUID)`,
    ),
    attributes: ['friend_one', 'friend_two'],
  });

  const friendNames = await Promise.all(
    friends.map(async friend => {
      const friendId =
        friend.friend_one === userId ? friend.friend_two : friend.friend_one;

      const friendUser = await User.findOne({
        where: {
          id: friendId,
        },
        attributes: ['username'],
      });

      return friendUser ? friendUser.username : 'Unknown';
    }),
  );

  return friendNames;
};

const removeFriendService = async (friendId, userId) => {
  const friendship = await FriendList.findOne({
    id: friendId,
    where: Sequelize.literal(
      `"friend_one" = CAST('${userId}' AS UUID) OR "friend_two" = CAST('${userId}' AS UUID)`,
    ),
  });

  if (!friendship) {
    return { message: 'Friendship not found' };
  }

  await friendship.destroy();
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
    const totalPaid = await ExpenseSplit.findAll({
      where: { user_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount_paid')), 'totalPaid'],
      ],
      raw: true,
    });

    const totalOwed = await ExpenseSplit.findAll({
      where: { user_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount_owed')), 'totalOwed'],
      ],
      raw: true,
    });

    const totalPaidAmount = parseFloat(totalPaid[0].totalPaid || 0);
    const totalOwedAmount = parseFloat(totalOwed[0].totalOwed || 0);

    const payments = await ExpenseSplit.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Expense,
          include: [
            {
              model: Group,
              attributes: ['name'],
            },
            {
              model: ExpenseSplit,
              as: 'expenseSplits',
              attributes: ['amount_paid', 'amount_owed', 'split_ratio'],
            },
          ],
          attributes: ['description', 'amount', 'created_at'],
        },
      ],
      attributes: ['amount_paid', 'amount_owed', 'created_at'],
    });

    const expenses = await Expense.findAll({
      include: [
        {
          model: ExpenseSplit,
          as: 'expenseSplits',
          where: { user_id: userId },
          attributes: ['amount_paid', 'amount_owed', 'split_ratio'],
        },
        {
          model: Group,
          attributes: ['name'],
        },
      ],
      attributes: ['id', 'description', 'amount', 'created_at'],
    });

    const paymentRecords = payments.map(payment => {
      const expense = payment.Expense;
      return {
        amountPaid: payment.amount_paid,
        amountOwed: payment.amount_owed,
        expenseDescription: expense ? expense.description : 'Unknown',
        groupName: expense && expense.Group ? expense.Group.name : 'No Group',
        createdAt: payment.created_at,
      };
    });

    const userExpenses = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      createdAt: expense.created_at,
      groupName: expense.Group ? expense.Group.name : 'No Group',
      splits: expense.expenseSplits.map(split => ({
        amountPaid: split.amount_paid,
        amountOwed: split.amount_owed,
        splitRatio: split.split_ratio,
      })),
    }));

    return {
      totalPaid: totalPaidAmount,
      totalOwed: totalOwedAmount,
      paymentRecords,
      userExpenses,
    };
  } catch (error) {
    console.error('Error generating expense report:', error);
    throw new Error('Failed to generate report data');
  }
};

const generatePDFAndUploadToS3 = async userId => {
  try {
    const reportData = await generateExpenseReportService(userId);
    console.log('Report Data:', reportData);

    const fs = require('fs');
    const path = require('path');
    const { PassThrough } = require('stream');
    const PDFDocument = require('pdfkit');
    const { v4: uuidv4 } = require('uuid');

    const pdfDoc = new PDFDocument();
    const passThroughStream = new PassThrough();

    const pdfPath = path.join(__dirname, `expense-report-${userId}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);

    pdfDoc.pipe(passThroughStream);
    pdfDoc.pipe(writeStream);

    pdfDoc.fontSize(18).text('Expense Report', { align: 'center' });
    pdfDoc.moveDown();

    pdfDoc.fontSize(12).text(`Total Paid: ${reportData.totalPaid}`);
    pdfDoc.text(`Total Owed: ${reportData.totalOwed}`);
    pdfDoc.moveDown();

    if (reportData.paymentRecords.length > 0) {
      pdfDoc.fontSize(14).text('Payment Records:', { underline: true });
      pdfDoc.moveDown();
      reportData.paymentRecords.forEach((record, index) => {
        pdfDoc
          .fontSize(12)
          .text(
            `${index + 1}. Paid: ${record.amountPaid}, Owed: ${record.amountOwed}, Description: ${record.expenseDescription}, Group: ${record.groupName}, Date: ${new Date(record.createdAt).toLocaleDateString()}`,
          );
      });
      pdfDoc.moveDown();
    }

    if (reportData.userExpenses.length > 0) {
      pdfDoc.fontSize(14).text('User Expenses:', { underline: true });
      pdfDoc.moveDown();
      reportData.userExpenses.forEach((expense, index) => {
        pdfDoc
          .fontSize(12)
          .text(
            `${index + 1}. Description: ${expense.description}, Amount: ${expense.amount}, Group: ${expense.groupName}, Date: ${new Date(expense.createdAt).toLocaleDateString()}`,
          );
        if (expense.splits.length > 0) {
          pdfDoc.text('Splits:');
          expense.splits.forEach(split => {
            pdfDoc.text(
              `  - Paid: ${split.amountPaid}, Owed: ${split.amountOwed}, Ratio: ${split.splitRatio}`,
            );
          });
        }
        pdfDoc.moveDown();
      });
    }

    pdfDoc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`PDF report saved locally at ${pdfPath}`);

    const fileBuffer = await new Promise((resolve, reject) => {
      const buffer = [];
      passThroughStream.on('data', chunk => buffer.push(chunk));
      passThroughStream.on('end', () => resolve(Buffer.concat(buffer)));
      passThroughStream.on('error', reject);
    });

    const pdfFile = {
      originalname: `expense-report-${userId}-${uuidv4()}.pdf`,
      buffer: fileBuffer,
      ACL: 'public-read',
      mimetype: 'application/pdf',
    };

    const s3Url = await uploadFileToS3(pdfFile);

    await Report.create({
      user_id: userId,
      report_url: s3Url,
    });

    console.log(`PDF report uploaded to S3: ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error('Error generating and uploading PDF report:', error);
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
  removeFriendService,
};
