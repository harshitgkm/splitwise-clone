const { Group, GroupMember } = require('../models');

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

module.exports = { createGroupService, getGroupsService, updateGroupService };
