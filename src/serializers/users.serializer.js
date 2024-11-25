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
  let receivedData = res.data || [];
  let resultData = {};
  if (receivedData) {
    resultData = {
      friends: receivedData,
    };
  }

  res.json(resultData);
};

const getAllPaymentsSerializer = (req, res) => {
  const receivedData = res.data || [];
  console.log(receivedData);
  const resultData = receivedData.map(payment => ({
    id: payment.id,
    groupId: payment.group_id,
    payerId: payment.payer_id,
    payeeId: payment.payee_id,
    amount: payment.amount,
    status: payment.status,
  }));

  res.json(resultData);
};

const generateExpenseReportSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      totalPaid: receivedData.totalPaid || 0,
      totalOwed: receivedData.totalOwed || 0,
      paymentRecords:
        receivedData.paymentRecords?.map(payment => ({
          amountPaid: payment.amountPaid || 0,
          amountOwed: payment.amountOwed || 0,
          expenseDescription: payment.expenseDescription || 'Unknown',
          groupName: payment.groupName || 'No Group',
          createdAt: payment.createdAt || null,
        })) || [],
      userExpenses:
        receivedData.userExpenses?.map(expense => ({
          id: expense.id || '',
          description: expense.description || '',
          amount: expense.amount || 0,
          createdAt: expense.createdAt || null,
          groupName: expense.groupName || 'No Group',
          splits:
            expense.splits?.map(split => ({
              amountPaid: split.amountPaid || 0,
              amountOwed: split.amountOwed || 0,
              splitRatio: split.splitRatio || 0,
            })) || [],
        })) || [],
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
