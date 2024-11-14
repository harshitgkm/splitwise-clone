const {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
  leaveGroupService,
  removeUserService,
} = require('../services/groups.service.js');

const { uploadFileToS3 } = require('../helpers/aws.helper.js');

const createGroup = async (req, res) => {
  try {
    const groupData = req.body;
    const userId = req.user.id;

    const group = await createGroupService(userId, groupData);

    console.log(group);

    res.status(201).json({ message: 'Group created successfully', group });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error creating group' });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = getGroupsService(userId);

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error retrieving groups' });
  }
};

const updateGroup = async (req, res) => {
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
    res.status(200).json({ message: 'Group updated successfully', group });
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error updating group' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await deleteGroupService(userId, groupId);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error deleting group' });
  }
};

const addMemberToGroup = async (req, res) => {
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
    res
      .status(200)
      .json({ message: 'User added to group successfully', data: result });
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error adding user to group' });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await leaveGroupService(userId, groupId);
    res.status(200).json({ message: 'You have left the group' });
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error leaving group' });
  }
};

const removeUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, userId: targetUserId } = req.params;

    await removeUserService(userId, groupId, targetUserId);
    res.status(200).json({ message: 'User removed from the group' });
  } catch (error) {
    console.error(error);
    res.json({ message: error.message || 'Error removing user from group' });
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
};
