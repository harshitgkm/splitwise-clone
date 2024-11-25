const createGroupSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.id || '',
      name: receivedData.name || '',
      type: receivedData.type || '',
      createdBy: receivedData.created_by || '',
    };
  }

  res.status(201).json(resultData);
};

const getGroupsSerializer = (req, res) => {
  const receivedData = res.data || [];
  console.log('Received Data:', receivedData);

  const resultData = receivedData.map(group => ({
    groupId: group.groupId,
    name: group.groupName,
    type: group.groupType,
    profileImageUrl: group.profileImageUrl || null,
  }));

  res.status(200).json(resultData);
};

const updateGroupSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      id: receivedData.id,
      name: receivedData.name,
      type: receivedData.type,
      createdBy: receivedData.created_by,
      profileImageUrl: receivedData.profile_image_url,
    };
  }

  res.status(200).json({ group: resultData });
};

const deleteGroupSerializer = (req, res) => {
  res.status(200).json({
    message: 'Group deleted successfully',
  });
};

const addMemberToGroupSerializer = (req, res) => {
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = {
      groupId: receivedData.group_id,
      userId: receivedData.user_id,
      isAdmin: receivedData.is_admin,
      joinedAt: receivedData.joined_at,
    };
  }

  res.status(200).json({
    message: 'User added to group successfully',
    data: resultData,
  });
};

const leaveGroupSerializer = (req, res) => {
  res.status(200).json({
    message: 'You have left the group',
  });
};

const removeUserSerializer = (req, res) => {
  res.status(200).json({
    message: 'User removed from the group',
  });
};

const getAllPaymentsForGroupSerializer = (req, res) => {
  const receivedData = res.data || [];
  const resultData = receivedData.map(payment => ({
    id: payment.id,
    payerId: payment.payer_id,
    payeeId: payment.payee_id,
    amount: payment.amount,
    status: payment.status,
  }));

  res.status(200).json(resultData);
};

const getAllMembersSerializer = (req, res) => {
  console.log(res.data);
  const receivedData = res.data || {};
  let resultData = {};

  if (receivedData) {
    resultData = receivedData.map(member => ({
      username: member.username || '',
      email: member.email || '',
      profilePicture: member.profile_picture_url || '',
      isAdmin: member.is_admin || '',
      joinedAt: member.joined_at || '',
    }));
  }

  res.status(201).json(resultData);
};

module.exports = {
  createGroupSerializer,
  getGroupsSerializer,
  updateGroupSerializer,
  deleteGroupSerializer,
  addMemberToGroupSerializer,
  getAllMembersSerializer,
  leaveGroupSerializer,
  removeUserSerializer,
  getAllPaymentsForGroupSerializer,
};
