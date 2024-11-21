const expenseSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.dataValues.id,
      groupId: receivedData.dataValues.group_id,
      description: receivedData.dataValues.description,
      amount: parseFloat(receivedData.dataValues.amount),
      splitType: receivedData.dataValues.split_type,
    };
  }

  res.json(resultData);
};

const getAllExpensesSerializer = (req, res) => {
  const receivedData = res.data || [];
  const resultData = receivedData.map(expense => ({
    id: expense.id || '',
    description: expense.description || '',
    amount: expense.amount || 0,
    splitType: expense.split_type || '',
    expenseImage: expense.expense_image_url || '',
  }));

  res.status(200).json(resultData);
};

const expenseDetailsSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (Object.keys(receivedData).length) {
    resultData = {
      id: receivedData.id || '',
      groupId: receivedData.group_id || '',
      description: receivedData.description || '',
      amount: parseFloat(receivedData.amount) || 0,
      splitType: receivedData.split_type || '',
      expenseSplits: Array.isArray(receivedData.expenseSplits)
        ? receivedData.expenseSplits.map(split => ({
            userId: split.user_id || '',
            amountPaid: parseFloat(split.amount_paid) || 0,
            amountOwed: parseFloat(split.amount_owed) || 0,
            splitRatio: parseFloat(split.split_ratio) || 0,
            username: split.username || '',
          }))
        : [],
      oweDetails: Array.isArray(receivedData.oweDetails)
        ? receivedData.oweDetails.map(owe => ({
            payer: owe.payer || '',
            oweTo: owe.oweTo || '',
            amount: parseFloat(owe.amount) || 0,
          }))
        : [],
    };
  }

  res.status(200).json(resultData);
};

const updateExpenseSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.id || '',
      groupId: receivedData.group_id || '',
      description: receivedData.description || '',
      amount: receivedData.amount || 0,
      splitType: receivedData.split_type || '',
      createdAt: receivedData.created_at || '',
      updatedAt: receivedData.updated_at || '',
    };
  }

  res.status(200).json(resultData);
};

const settleUpSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      payerId: receivedData.payerId || '',
      payeeId: receivedData.payeeId || '',
      payment: {
        id: receivedData.payment?.id || '',
        amount: parseFloat(receivedData.payment?.amount) || 0,
        status: receivedData.payment?.status || 'Pending',
        expenseId: receivedData.payment?.expense_id || '',
      },
    };
  }

  res.status(200).json(resultData);
};

const createCommentSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.id,
      expenseId: receivedData.expenseId,
      userId: receivedData.userId,
      username: receivedData.user?.username || '',
      profilePicture: receivedData.user?.profilePicture || '',
      comment: receivedData.comment,
      createdAt: receivedData.createdAt,
      updatedAt: receivedData.updatedAt,
    };
  }

  res.status(201).json(resultData);
};

const getCommentsSerializer = (req, res) => {
  const receivedData = res.data || [];
  const resultData = receivedData.map(comment => ({
    id: comment.id,
    expenseId: comment.expense_id,
    userId: comment.user_id,
    username: comment.User?.username || '',
    profilePicture: comment.User?.profile_picture_url || '',
    comment: comment.comment,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }));

  res.status(200).json(resultData);
};

const updateCommentSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.id,
      expenseId: receivedData.expenseId,
      userId: receivedData.userId,
      username: receivedData.user?.username || '',
      profilePicture: receivedData.user?.profilePicture || '',
      comment: receivedData.comment,
      createdAt: receivedData.createdAt,
      updatedAt: receivedData.updatedAt,
    };
  }

  res.status(200).json(resultData);
};

module.exports = {
  expenseSerializer,
  getAllExpensesSerializer,
  expenseDetailsSerializer,
  updateExpenseSerializer,
  settleUpSerializer,
  createCommentSerializer,
  getCommentsSerializer,
  updateCommentSerializer,
};
