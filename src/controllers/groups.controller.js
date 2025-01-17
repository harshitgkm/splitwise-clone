const {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
  fetchGroupMembers,
  leaveGroupService,
  removeUserService,
  getAllPaymentsInGroupService,
  sendInviteEmail,
} = require('../services/groups.service.js');

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

const createGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const my_username = req.user.username;
    const groupData = { ...req.body, userId, my_username };

    const group = await createGroupService(groupData);
    res.data = group;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error creating group', error: error.message });
  }
};

const getGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const groups = await getGroupsService(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    res.data = groups;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error retrieving groups' });
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const groupData = req.body;

    if (req.file) {
      console.log(req.file);

      const image = await uploadFileToS3(req.file);
      console.log(image);
      groupData.profile_image_url = image;
    }

    const group = await updateGroupService(userId, id, groupData);
    res.data = group;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error updating group' });
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const response = await deleteGroupService(userId, id);
    res.data = response;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error deleting group' });
  }
};

const addMemberToGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, isAdmin } = req.body;
    const currentUserId = req.user.id;

    const result = await addGroupMember(id, currentUserId, username, isAdmin);

    res.data = result;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error adding user to group' });
  }
};

const getGroupMembers = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const membersData = await fetchGroupMembers(
      groupId,
      currentUserId,
      page,
      limit,
    );

    res.data = membersData;
    next();
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .json({ message: error.message || 'Error getting group members' });
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const response = await leaveGroupService(userId, id);
    res.data = response;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error leaving group' });
  }
};

const removeUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: groupId, userId: targetUserId } = req.params;

    const response = await removeUserService(userId, groupId, targetUserId);
    res.data = response;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error removing user from group' });
  }
};

const getAllPaymentsForGroup = async (req, res, next) => {
  const { groupId } = req.params;

  try {
    const payments = await getAllPaymentsInGroupService(groupId);
    res.data = payments;
    next();
  } catch (error) {
    res.json({ message: error.message || 'Error getting payments' });
  }
};

const sendGroupInvite = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const inviterId = req.user.id;

  try {
    const result = await sendInviteEmail(id, email, inviterId);
    res.status(200).json({ message: result });
  } catch (error) {
    console.log(error);

    res.json({ error: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  getGroupMembers,
  leaveGroup,
  removeUser,
  getAllPaymentsForGroup,
  sendGroupInvite,
};
