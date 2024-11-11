const { Group, GroupMember, User } = require('../models');

const createGroupService = async (userId, groupData) => {
  const { name, type, profile_image_url } = groupData;

  // Create the group
  const group = await Group.create({
    name,
    created_by: userId,
    type,
    profile_image_url,
  });

  // Add the creator as the first member of the group
  await GroupMember.create({
    user_id: userId,
    group_id: group.id,
    is_admin: true,
    joined_at: new Date(),
  });

  return group;
};

const getGroupsService = async userId => {
  return await Group.findAll({
    include: {
      model: GroupMember,
      where: { user_id: userId },
    },
  });
};

const updateGroupService = async (userId, groupId, groupData) => {
  const { name, type, profile_image_url } = groupData;

  const group = await Group.findByPk(groupId);

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if the user is the group admin (created_by)
  if (group.created_by !== userId) {
    throw new Error('Only the group admin can update details');
  }

  // Update group details
  group.name = name || group.name;
  group.type = type || group.type;
  group.profile_image_url = profile_image_url || group.profile_image_url;
  await group.save();

  return group;
};

const deleteGroupService = async (userId, groupId) => {
  const group = await Group.findByPk(groupId);

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if the user is the group admin (created_by)
  if (group.created_by !== userId) {
    throw new Error('Only the group admin can delete the group');
  }

  // Delete the group and its associated members, expenses, etc.
  await group.destroy();

  return group;
};

const addGroupMember = async (
  groupId,
  currentUserId,
  userId,
  isAdmin = false,
) => {
  // Check if the group exists
  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check if the current user is an admin in the group
  const isCurrentUserAdmin = await GroupMember.findOne({
    where: { group_id: groupId, user_id: currentUserId, is_admin: true },
  });
  if (!isCurrentUserAdmin) {
    throw new Error('Only admins can add members to the group');
  }

  // Check if the user to be added exists
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if the user is already a member of the group
  const existingMember = await GroupMember.findOne({
    where: { group_id: groupId, user_id: userId },
  });
  if (existingMember) {
    throw new Error('User is already a member of the group');
  }

  // Add the user to the group
  const newMember = await GroupMember.create({
    group_id: groupId,
    user_id: userId,
    is_admin: isAdmin,
    joined_at: new Date(),
  });

  return newMember;
};

module.exports = {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
};
