const { Group, GroupMember, User } = require('../models');

const createGroupService = async (userId, groupData) => {
  const { name, type, profile_image_url } = groupData;

  const group = await Group.create({
    name,
    created_by: userId,
    type,
    profile_image_url,
  });

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

  await group.destroy();

  return group;
};

const addGroupMember = async (
  groupId,
  currentUserId,
  userId,
  isAdmin = false,
) => {
  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const existingMember = await GroupMember.findOne({
    where: { group_id: groupId, user_id: userId },
  });
  if (existingMember) {
    throw new Error('User is already a member of the group');
  }

  const newMember = await GroupMember.create({
    group_id: groupId,
    user_id: userId,
    is_admin: isAdmin,
    joined_at: new Date(),
  });

  return newMember;
};

const leaveGroupService = async (userId, groupId) => {
  const groupMember = await GroupMember.findOne({
    where: { group_id: groupId, user_id: userId },
  });

  if (!groupMember) {
    throw new Error('You are not a member of this group');
  }

  await groupMember.destroy();
  return groupMember;
};

const removeUserService = async (userId, groupId, targetUserId) => {
  const group = await Group.findByPk(groupId);

  if (!group) {
    throw new Error('Group not found');
  }

  await GroupMember.findOne({
    where: { group_id: groupId, user_id: userId },
  });

  const userToRemove = await GroupMember.findOne({
    where: { group_id: groupId, user_id: targetUserId },
  });

  if (!userToRemove) {
    throw new Error('User not found in the group');
  }

  await userToRemove.destroy();

  return userToRemove;
};

module.exports = {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
  leaveGroupService,
  removeUserService,
};
