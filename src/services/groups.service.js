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

module.exports = { createGroupService, getGroupsService };
