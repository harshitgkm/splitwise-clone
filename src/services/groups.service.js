const { Group, GroupMember, User, Payment } = require('../models');
const { sendMail } = require('../helpers/mail.helper.js');

const generateTwoUserIdentifier = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
};

const createGroupService = async groupData => {
  const { name, type, username: otherUsername, userId } = groupData;

  // if otherUsername is provided, handle two-user group logic
  if (otherUsername) {
    const otherUser = await User.findOne({
      where: { username: otherUsername },
    });
    if (!otherUser) {
      throw new Error(`User with username "${otherUsername}" not found`);
    }

    const otherUserId = otherUser.id;
    const twoUserIdentifier = generateTwoUserIdentifier(userId, otherUserId);

    let group = await Group.findOne({
      where: { two_user_identifier: twoUserIdentifier },
    });

    if (group) {
      throw new Error('You already have one-one group with this user');
    }

    if (!group) {
      group = await Group.create({
        name: otherUsername,
        type: 'Two-User',
        two_user_identifier: twoUserIdentifier,
        created_by: userId,
      });

      await GroupMember.bulkCreate([
        {
          user_id: userId,
          group_id: group.id,
          is_admin: true,
          joined_at: new Date(),
        },
        {
          user_id: otherUserId,
          group_id: group.id,
          is_admin: false,
          joined_at: new Date(),
        },
      ]);
    }

    return group;
  }

  //handle multi-user groups
  const group = await Group.create({
    name,
    type,
    created_by: userId,
  });

  await GroupMember.create({
    user_id: userId,
    group_id: group.id,
    is_admin: true,
    joined_at: new Date(),
  });

  return group;
};

const getGroupsService = async (
  userId,
  page = 1,
  limit = 10,
  filter = 'owed',
) => {
  try {
    const offset = (page - 1) * limit;

    const groupMembers = await GroupMember.findAll({
      where: { user_id: userId },
      limit: limit,
      offset: offset,
    });

    if (!groupMembers || groupMembers.length === 0) {
      return [];
    }

    const groups = [];

    for (let member of groupMembers) {
      try {
        const group = await Group.findByPk(member.group_id, {
          attributes: ['id', 'name', 'type', 'profile_image_url'],
        });

        if (group) {
          if (filter === 'all' || filter === 'owe' || filter === 'owed') {
            groups.push({
              groupId: group.id,
              groupName: group.name,
              groupType: group.type,
              profileImageUrl: group.profile_image_url || null,
            });
          }
        } else {
          console.warn(`Group not found for group_member: ${member.group_id}`);
        }
      } catch (error) {
        console.error(`Error fetching group for member ${member.id}:`, error);
      }
    }

    return groups;
  } catch (error) {
    console.error('Error retrieving groups:', error);
    throw new Error('Error retrieving groups');
  }
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
  username,
  isAdmin = false,
) => {
  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('User not found');
  }

  const userId = user.id;

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

const fetchGroupMembers = async (groupId, currentUserId) => {
  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = await GroupMember.findOne({
    where: { group_id: groupId, user_id: currentUserId },
  });
  if (!isMember) {
    throw new Error('You do not have access to this group');
  }

  const members = await GroupMember.findAll({
    where: { group_id: groupId },
    include: [
      {
        model: User,
        attributes: ['id', 'username', 'email', 'profile_picture_url'],
      },
    ],
    attributes: ['is_admin', 'joined_at'],
  });

  return members.map(member => ({
    username: member.User.username,
    email: member.User.email,
    profilePicture: member.User.profile_picture_url,
    isAdmin: member.is_admin,
    joinedAt: member.joined_at,
  }));
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

const getAllPaymentsInGroupService = async groupId => {
  const payments = await Payment.findAll({
    where: { group_id: groupId },
    order: [['created_at', 'DESC']],
  });

  return payments;
};

const sendInviteEmail = async (groupId, email, inviterId) => {
  const group = await Group.findByPk(groupId);
  if (!group) throw new Error('Group not found');

  const isMember = await GroupMember.findOne({
    where: { group_id: groupId, user_id: inviterId },
  });
  if (!isMember) throw new Error('You must be a group member to invite others');

  const inviteLink = `https://your-app.com/invite?groupId=${groupId}&email=${email}`;

  await sendMail({
    to: email,
    subject: "You're Invited to Join a Group!",
    text: `You've been invited to join the group "${group.name}". Click here to join: ${inviteLink}`,
  });

  return `Invitation sent successfully to ${email}`;
};

module.exports = {
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
};
