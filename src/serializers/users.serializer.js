const userSerializer = (req, res) => {
  let receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.dataValues.id,
      username: receivedData.dataValues.username,
      email: receivedData.dataValues.email,
      profilePicture: receivedData.dataValues.profile_picture_url,
    };
  }

  res.json(resultData);
};

const outstandingBalanceSerializer = (req, res) => {
  let receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      outstandingBalance: receivedData,
    };
  }
  res.json(resultData);
};

const addFriendSerializer = (req, res) => {
  let receivedData = res.data || {};
  let resultData = {};

  console.log(receivedData);

  if (receivedData) {
    resultData = {
      message: receivedData.message || 'Friendship created successfully',
      friend: receivedData.friend || '',
    };
  }

  res.json(resultData);
};

const getFriendsListSerializer = (req, res) => {
  const receivedData = res.data || {};
  const resultData = {
    friends: receivedData.data || [],
    pagination: {
      currentPage: receivedData.currentPage || 1,
      totalFriends: receivedData.totalFriends || 0,
    },
  };

  res.status(200).json(resultData);
};

const getAllPaymentsSerializer = (req, res) => {
  const receivedData = res.data || {};
  const { payments = [], pagination = {} } = receivedData;

  const resultData = payments.map(payment => ({
    id: payment.id,
    groupId: payment.group_id,
    payerId: payment.payer_id,
    payeeId: payment.payee_id,
    amount: payment.amount,
    status: payment.status,
  }));

  res.json({
    data: resultData,
    pagination: {
      totalItems: pagination.totalItems || 0,
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 0,
      itemsPerPage: pagination.itemsPerPage || 10,
    },
  });
};

const generateExpenseReportSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      totalPaid: receivedData.totalPaid || 0,
      totalOwed: receivedData.totalOwed || 0,
      paymentRecords: {
        data:
          receivedData.paymentRecords?.data.map(payment => ({
            amountPaid: payment.amount_paid || 0,
            amountOwed: payment.amount_owed || 0,
            expenseDescription: payment.Expense?.description || 'Unknown',
            groupName: payment.Expense?.Group?.name || 'No Group',
            createdAt: payment.created_at || null,
          })) || [],
        pagination: receivedData.paymentRecords?.pagination || {},
      },
      userExpenses: {
        data:
          receivedData.userExpenses?.data.map(expense => ({
            id: expense.id || '',
            description: expense.description || '',
            amount: expense.amount || 0,
            createdAt: expense.created_at || null,
            groupName: expense.Group?.name || 'No Group',
            splits:
              expense.expenseSplits?.map(split => ({
                amountPaid: split.amount_paid || 0,
                amountOwed: split.amount_owed || 0,
                splitRatio: split.split_ratio || 0,
              })) || [],
          })) || [],
        pagination: receivedData.userExpenses?.pagination || {},
      },
    };
  }

  res.status(200).json(resultData);
};
const exportReportToPDFSerializer = (req, res) => {
  const receivedData = res.data || {};
  const resultData = {
    url: receivedData || '',
  };

  res.json(resultData);
};

const getAllReportsSerializer = (req, res) => {
  const receivedData = res.data || [];
  const resultData = receivedData.map(report => ({
    id: report.id,
    reportUrl: report.report_url,
    createdAt: report.created_at,
  }));

  res.json(resultData);
};

module.exports = {
  userSerializer,
  outstandingBalanceSerializer,
  addFriendSerializer,
  getFriendsListSerializer,
  getAllPaymentsSerializer,
  generateExpenseReportSerializer,
  exportReportToPDFSerializer,
  getAllReportsSerializer,
};
