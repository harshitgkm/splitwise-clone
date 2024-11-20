const {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
  leaveGroupService,
  removeUserService,
  getAllPaymentsInGroupService,
} = require('../services/groups.service.js');

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

const createGroup = async (req, res, next) => {
  try {
    const groupData = req.body;
    const userId = req.user.id;

    const group = await createGroupService(userId, groupData);
    res.data = group;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error creating group' });
  }
};

const getGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const groups = await getGroupsService(userId, page, limit);
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
    const { groupId } = req.params;
    const groupData = req.body;

    if (req.url) {
      console.log(req.url);

      const image = await uploadFileToS3(req.url);
      console.log(image);
      groupData.profile_image_url = image;
    }

    const group = await updateGroupService(userId, groupId, groupData);
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
    const { groupId } = req.params;

    const response = await deleteGroupService(userId, groupId);
    res.data = response;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error deleting group' });
  }
};

const addMemberToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId, isAdmin } = req.body; // `userId` is the ID of the user to add, `isAdmin` is optional
    const currentUserId = req.user.id;

    const result = await addGroupMember(
      groupId,
      currentUserId,
      userId,
      isAdmin,
    );

    res.data = result;
    next();
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error adding user to group' });
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const response = await leaveGroupService(userId, groupId);
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
    const { groupId, userId: targetUserId } = req.params;

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

module.exports = {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  leaveGroup,
  removeUser,
  getAllPaymentsForGroup,
};
