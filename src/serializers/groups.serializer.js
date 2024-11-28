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
  const receivedData = res.data || { groups: [], pagination: {} };
  const { groups, pagination } = receivedData;

  const serializedGroups = groups.map(group => ({
    groupId: group.groupId,
    name: group.groupName,
    type: group.groupType,
    profileImageUrl: group.profileImageUrl || null,
  }));

  res.status(200).json({
    groups: serializedGroups,
    pagination,
  });
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

  res
    .status(200)
    .json({ message: 'Group updated successfully', data: resultData });
};

const deleteGroupSerializer = (req, res) => {
  res.status(204).json({
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
  res.status(204).json({
    message: 'You have left the group',
  });
};

const removeUserSerializer = (req, res) => {
  res.status(204).json({
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
  const receivedData = res.data || {};
  const { members = [], pagination = {} } = receivedData;

  const serializedMembers = members.map(member => ({
    username: member.username || '',
    email: member.email || '',
    profilePicture: member.profilePicture || '',
    isAdmin: member.isAdmin || false,
    joinedAt: member.joinedAt || '',
  }));

  res.status(200).json({
    members: serializedMembers,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPages: pagination.totalPages || 1,
    },
  });
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
