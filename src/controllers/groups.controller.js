const {
  createGroupService,
  getGroupsService,
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

// Retrieve all groups
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

module.exports = {
  createGroup,
  getGroups,
};
