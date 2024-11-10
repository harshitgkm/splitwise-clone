const {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
} = require('../services/groups.service.js');

const createGroup = async (req, res) => {
  try {
    const groupData = req.body;
    const userId = req.user.id; //User from the JWT token

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

module.exports = {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
};
