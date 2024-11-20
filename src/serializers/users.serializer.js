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
      id: receivedData.dataValues.id,
      friendOne: receivedData.dataValues.friend_one,
      friendTwo: receivedData.dataValues.friend_two,
    };
  }
  res.json(resultData);
};

const getFriendsListSerializer = (req, res) => {
  const receivedData = res.data || [];
  const resultData = receivedData.map(friend => ({
    id: friend.id,
    friendOne: friend.friend_one,
    friendTwo: friend.friend_two,
  }));

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
  console.log('receivedData', receivedData);
  const resultData = {
    totalExpenses: receivedData.totalPaid || 0,
    totalPayments: receivedData.totalOwed || 0,
    balance: receivedData.balance || 0,
  };

  res.json(resultData);
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
    userId: report.user_id,
    reportUrl: report.report_url,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
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
