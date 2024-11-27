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

const addFriendService = async (user_id, friend_username) => {
  const friend = await User.findOne({
    where: { username: friend_username },
    attributes: ['id', 'username'],
  });

  if (!friend) {
    throw new Error('User with this username not found');
  }

  const friend_id = friend.id;

  if (user_id === friend_id) {
    throw new Error('You cannot add yourself as a friend');
  }

  const existingFriendship = await FriendList.findOne({
    where: Op.or(
      Op.literal(
        `"user_id" = CAST('${user_id}' AS UUID) AND "friend_id" = CAST('${friend_id}' AS UUID)`,
      ),
      Op.literal(
        `"user_id" = CAST('${friend_id}' AS UUID) AND "friend_id" = CAST('${user_id}' AS UUID)`,
      ),
    ),
  });

  if (existingFriendship) {
    throw new Error('Friendship already exists');
  }

  await FriendList.create({
    user_id: user_id,
    friend_id: friend_id,
  });

  return {
    message: `Friendship created successfully with ${friend.username}`,
    friend: friend.username,
  };
};

const getFriends = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const friends = await FriendList.findAll({
    where: Sequelize.literal(
      `"user_id" = CAST('${userId}' AS UUID) OR "friend_id" = CAST('${userId}' AS UUID)`,
    ),
    attributes: ['user_id', 'friend_id'],
    limit,
    offset,
  });

  const friendDetails = await Promise.all(
    friends.map(async friend => {
      const friendId =
        friend.user_id === userId ? friend.friend_id : friend.user_id;

      const friendUser = await User.findOne({
        where: {
          id: friendId,
        },
        attributes: ['username'],
      });

      const friendName = friendUser ? friendUser.username : 'Unknown';

      const totalAmountOwed = await ExpenseSplit.sum('amount_owed', {
        where: {
          user_id: friendId,
          expense_id: {
            [Sequelize.Op.in]: Sequelize.literal(
              `(
                SELECT id 
                FROM expenses 
                WHERE group_id IN (
                  SELECT id 
                  FROM groups 
                  WHERE EXISTS (
                    SELECT 1 
                    FROM group_members 
                    WHERE user_id = '${userId}' AND group_id = groups.id
                  )
                )
              )`,
            ),
          },
        },
      });

      return {
        id: friendId,
        username: friendName,
        amountOwed: totalAmountOwed || 0,
      };
    }),
  );

  return friendDetails;
};

const removeFriendService = async (friendId, userId) => {
  const existingFriendship = await FriendList.findOne({
    where: Op.or(
      Op.literal(
        `"user_id" = CAST('${friendId}' AS UUID) AND "friend_id" = CAST('${userId}' AS UUID)`,
      ),
      Op.literal(
        `"user_id" = CAST('${userId}' AS UUID) AND "friend_id" = CAST('${friendId}' AS UUID)`,
      ),
    ),
  });

  if (!existingFriendship) {
    throw new Error('Friendship does not exists');
  }

  await existingFriendship.destroy();
};

const getAllPaymentsService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const [totalPaidResult, totalOwedResult] = await Promise.all([
    ExpenseSplit.findOne({
      where: { user_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount_paid')), 'totalPaid'],
      ],
      raw: true,
    }),
    ExpenseSplit.findOne({
      where: { user_id: userId },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('amount_owed')), 'totalOwed'],
      ],
      raw: true,
    }),
  ]);
  const { count, rows: payments } = await Payment.findAndCountAll({
    where: Op.or(
      Op.literal(`"payer_id" = CAST('${userId}' AS UUID)`),
      Op.literal(`"payee_id" = CAST('${userId}' AS UUID)`),
    ),
    order: [['created_at', 'DESC']],
    limit: limit,
    offset: offset,
  });
  return {
    totalPaidResult,
    totalOwedResult,
    payments,
    pagination: {
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      itemsPerPage: limit,
    },
  };
};

const generateExpenseReportService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const expensesResult = await Expense.findAndCountAll({
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
    limit,
    offset,
  });

  return {
    userExpenses: {
      data: expensesResult.rows,
      pagination: {
        totalItems: expensesResult.count,
        currentPage: page,
        totalPages: Math.ceil(expensesResult.count / limit),
        itemsPerPage: limit,
      },
    },
  };
};

const generatePDFAndUploadToS3 = async userId => {
  const reportData = await generateExpenseReportService(userId);
  const paymentData = await getAllPaymentsService(userId);

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

  pdfDoc.fontSize(18).text(' Payment and Expense Report', { align: 'center' });
  pdfDoc.moveDown();

  const totalPaid = paymentData.totalPaidResult?.totalPaid || 0;
  const totalOwed = paymentData.totalOwedResult?.totalOwed || 0;

  pdfDoc.fontSize(14).text('Summary', { underline: true });
  pdfDoc.fontSize(12).text(`Total Paid: ${totalPaid}`);
  pdfDoc.text(`Total Owed: ${totalOwed}`);
  pdfDoc.moveDown();

  pdfDoc.fontSize(14).text('Payment Records:', { underline: true });
  pdfDoc.moveDown();

  if (paymentData.payments.length === 0) {
    pdfDoc.fontSize(12).text('No payments found for this user.');
  } else {
    paymentData.payments.forEach((payment, index) => {
      const payerId = payment.payer_id || 'Unknown';
      const payeeId = payment.payee_id || 'Unknown';
      const amount = payment.amount || 'N/A';
      const createdAt = payment.created_at
        ? new Date(payment.created_at).toLocaleDateString()
        : 'Unknown Date';

      pdfDoc
        .fontSize(12)
        .text(
          `${index + 1}. Payer ID: ${payerId}, Payee ID: ${payeeId}, Amount: ${amount}, Date: ${createdAt}`,
        );
    });
  }

  pdfDoc.moveDown();

  pdfDoc.fontSize(14).text('Expense Records:', { underline: true });
  pdfDoc.moveDown();

  if (reportData.userExpenses.data.length === 0) {
    pdfDoc.fontSize(12).text('No expenses found for this user.');
  } else {
    reportData.userExpenses.data.forEach((expense, index) => {
      const groupName = expense.Group?.name || 'No Group';
      const description = expense.description || 'No Description';
      const amount = expense.amount || 0;
      const createdAt = expense.created_at
        ? new Date(expense.created_at).toLocaleDateString()
        : 'Unknown Date';

      pdfDoc
        .fontSize(12)
        .text(
          `${index + 1}. Description: ${description}, Amount: ${amount}, Group: ${groupName}, Date: ${createdAt}`,
        );

      if (expense.expenseSplits?.length > 0) {
        pdfDoc.text('Splits:');
        expense.expenseSplits.forEach((split, splitIndex) => {
          const splitPaid = split.amount_paid || 0;
          const splitOwed = split.amount_owed || 0;
          const splitRatio = split.split_ratio || 'N/A';

          pdfDoc.text(
            `  - Split ${splitIndex + 1}: Paid: ${splitPaid}, Owed: ${splitOwed}, Ratio: ${splitRatio}`,
          );
        });
      } else {
        pdfDoc.text('  No splits available for this expense.');
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
