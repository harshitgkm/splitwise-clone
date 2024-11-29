const { Group, GroupMember, User, Payment } = require('../../src/models');
const {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
  addGroupMember,
  leaveGroupService,
  removeUserService,
  getAllPaymentsInGroupService,
  fetchGroupMembers,
  sendInviteEmail,
} = require('../../src/services/groups.service');
const { faker } = require('@faker-js/faker');

const { sendMail } = require('../../src/helpers/mail.helper');
jest.mock('./../../src/helpers/mail.helper');

jest.mock('../../src/models', () => ({
  Group: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  GroupMember: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Payment: {
    findAll: jest.fn(),
  },
}));

describe('Groups Service', () => {
  let userId, groupId, groupData, targetUserId;

  beforeEach(() => {
    userId = faker.string.uuid();
    groupId = faker.string.uuid();
    targetUserId = faker.string.uuid();

    groupData = {
      name: faker.company.name(),
      type: 'private',
      profile_image_url: 'https://via.placeholder.com/150',
    };

    Group.create.mockResolvedValue({
      id: groupId,
      ...groupData,
    });

    GroupMember.create.mockResolvedValue({
      user_id: userId,
      group_id: groupId,
      is_admin: true,
      joined_at: new Date(),
    });

    GroupMember.findOne.mockResolvedValue(null);
    GroupMember.findAll.mockResolvedValue([]);
    GroupMember.destroy.mockResolvedValue(true);

    Group.findByPk.mockResolvedValue({
      id: groupId,
      name: groupData.name,
      type: groupData.type,
      profile_image_url: groupData.profile_image_url,
    });

    User.findByPk.mockResolvedValue({
      id: targetUserId,
      name: faker.name.firstName(),
    });

    Payment.findAll.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroupService', () => {
    it('should create a group successfully', async () => {
      const userId = 'a0f8cd35-7c9d-444e-b04b-cbae236055f2';
      const groupData = {
        name: 'Murphy, Cruickshank and Grant',
        type: 'private',
        profile_image_url: 'https://via.placeholder.com/150',
      };

      const groupId = 'some-group-id';
      Group.create.mockResolvedValue({ id: groupId, ...groupData });

      const result = await createGroupService(userId, groupData);

      console.log(Group.create.mock.calls);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(groupData.name);
      expect(Group.create).toHaveBeenCalledWith({
        name: groupData.name,
        created_by: userId,
        type: groupData.type,
        profile_image_url: groupData.profile_image_url,
      });
      expect(GroupMember.create).toHaveBeenCalledWith({
        user_id: userId,
        group_id: groupId,
        is_admin: true,
        joined_at: expect.any(Date),
      });
    });
  });

  describe('getGroupsService', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    const userId = 'user-id-1';
    const groupId1 = 'group-id-1';
    const groupId2 = 'group-id-2';

    it('should return a paginated list of groups for a user', async () => {
      const mockGroups = [
        { group_id: groupId1, user_id: userId },
        { group_id: groupId2, user_id: userId },
      ];
      const mockGroupDetails = [
        {
          id: groupId1,
          name: 'Group 1',
          type: 'Public',
          profile_image_url: 'https://example.com/group1.jpg',
        },
        {
          id: groupId2,
          name: 'Group 2',
          type: 'Private',
          profile_image_url: null,
        },
      ];

      GroupMember.count.mockResolvedValue(2);
      GroupMember.findAll.mockResolvedValue(mockGroups);
      Group.findByPk
        .mockResolvedValueOnce(mockGroupDetails[0])
        .mockResolvedValueOnce(mockGroupDetails[1]);

      const result = await getGroupsService(userId, 1, 10);

      expect(GroupMember.count).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(GroupMember.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        limit: 10,
        offset: 0,
      });
      expect(Group.findByPk).toHaveBeenCalledWith(groupId1, {
        attributes: ['id', 'name', 'type', 'profile_image_url'],
      });
      expect(Group.findByPk).toHaveBeenCalledWith(groupId2, {
        attributes: ['id', 'name', 'type', 'profile_image_url'],
      });
      expect(result).toEqual({
        groups: [
          {
            groupId: groupId1,
            groupName: 'Group 1',
            groupType: 'Public',
            profileImageUrl: 'https://example.com/group1.jpg',
          },
          {
            groupId: groupId2,
            groupName: 'Group 2',
            groupType: 'Private',
            profileImageUrl: null,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return an empty list if the user has no groups', async () => {
      GroupMember.count.mockResolvedValue(0);
      GroupMember.findAll.mockResolvedValue([]);

      const result = await getGroupsService(userId, 1, 10);

      expect(GroupMember.count).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(GroupMember.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        limit: 10,
        offset: 0,
      });
      expect(Group.findByPk).not.toHaveBeenCalled();

      expect(result).toEqual({
        groups: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });

    it('should filter out groups that are not found in the database', async () => {
      const mockGroups = [
        { group_id: groupId1, user_id: userId },
        { group_id: groupId2, user_id: userId },
      ];
      const mockGroupDetails = {
        id: groupId1,
        name: 'Group 1',
        type: 'Public',
        profile_image_url: 'https://example.com/group1.jpg',
      };

      GroupMember.count.mockResolvedValue(2);
      GroupMember.findAll.mockResolvedValue(mockGroups);
      Group.findByPk
        .mockResolvedValueOnce(mockGroupDetails)
        .mockResolvedValueOnce(null); // Group not found

      const result = await getGroupsService(userId, 1, 10);

      expect(Group.findByPk).toHaveBeenCalledWith(groupId1, {
        attributes: ['id', 'name', 'type', 'profile_image_url'],
      });
      expect(Group.findByPk).toHaveBeenCalledWith(groupId2, {
        attributes: ['id', 'name', 'type', 'profile_image_url'],
      });

      expect(result.groups).toEqual([
        {
          groupId: groupId1,
          groupName: 'Group 1',
          groupType: 'Public',
          profileImageUrl: 'https://example.com/group1.jpg',
        },
      ]);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockGroups = [{ group_id: groupId1, user_id: userId }];
      const mockGroupDetails = {
        id: groupId1,
        name: 'Group 1',
        type: 'Public',
        profile_image_url: 'https://example.com/group1.jpg',
      };

      GroupMember.count.mockResolvedValue(15); // 15 total groups
      GroupMember.findAll.mockResolvedValue(mockGroups);
      Group.findByPk.mockResolvedValueOnce(mockGroupDetails);

      const result = await getGroupsService(userId, 2, 10); // Page 2

      expect(GroupMember.findAll).toHaveBeenCalledWith({
        where: { user_id: userId },
        limit: 10,
        offset: 10, // Offset for page 2
      });
      expect(result.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
    });

    it('should handle errors gracefully', async () => {
      GroupMember.count.mockRejectedValue(new Error('Database error'));

      await expect(getGroupsService(userId)).rejects.toThrow('Database error');

      expect(GroupMember.count).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(GroupMember.findAll).not.toHaveBeenCalled();
    });
  });

  describe('updateGroupService', () => {
    it('should update group data successfully', async () => {
      const updatedGroupData = { name: 'Updated Group Name' };
      Group.findByPk.mockResolvedValue({
        ...groupData,
        save: jest.fn().mockResolvedValue({
          ...groupData,
          ...updatedGroupData,
        }),
      });

      const result = await updateGroupService(
        userId,
        groupId,
        updatedGroupData,
      );
      expect(result.name).toBe('Updated Group Name');
      expect(Group.findByPk).toHaveBeenCalledWith(groupId);
    });

    it('should throw error if group not found', async () => {
      Group.findByPk.mockResolvedValue(null);
      await expect(
        updateGroupService(userId, groupId, groupData),
      ).rejects.toThrow('Group not found');
    });
  });

  describe('deleteGroupService', () => {
    it('should delete a group successfully', async () => {
      Group.findByPk.mockResolvedValue({
        id: groupId,
        destroy: jest.fn().mockResolvedValue(true),
      });

      const result = await deleteGroupService(userId, groupId);
      expect(result.id).toBe(groupId);
      expect(Group.findByPk).toHaveBeenCalledWith(groupId);
    });

    it('should throw error if group not found', async () => {
      Group.findByPk.mockResolvedValue(null);
      await expect(deleteGroupService(userId, groupId)).rejects.toThrow(
        'Group not found',
      );
    });
  });

  describe('addGroupMember', () => {
    it('should add a new member to the group successfully', async () => {
      const groupId = 1;
      const currentUserId = 2;
      const username = 'john_doe';
      const isAdmin = true;

      Group.findByPk.mockResolvedValue({ id: groupId });
      User.findOne.mockResolvedValue({ id: 3, username: 'john_doe' });

      GroupMember.findOne.mockResolvedValue(null);
      GroupMember.create.mockResolvedValue({
        group_id: groupId,
        user_id: 3,
        is_admin: isAdmin,
        joined_at: new Date(),
      });

      const result = await addGroupMember(
        groupId,
        currentUserId,
        username,
        isAdmin,
      );

      expect(Group.findByPk).toHaveBeenCalledWith(groupId);
      expect(User.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: groupId, user_id: 3 },
      });
      expect(GroupMember.create).toHaveBeenCalledWith({
        group_id: groupId,
        user_id: 3,
        is_admin: isAdmin,
        joined_at: expect.any(Date),
      });

      expect(result).toHaveProperty('group_id', groupId);
      expect(result).toHaveProperty('user_id', 3);
      expect(result.is_admin).toBe(isAdmin);
    });
  });

  describe('leaveGroupService', () => {
    it('should throw error if user is not a member of the group', async () => {
      GroupMember.findOne.mockResolvedValue(null);
      await expect(leaveGroupService(userId, groupId)).rejects.toThrow(
        'You are not a member of this group',
      );
    });
  });

  describe('removeUserService', () => {
    it('should throw error if user to remove not found', async () => {
      GroupMember.findOne.mockResolvedValue(null);
      await expect(
        removeUserService(userId, groupId, targetUserId),
      ).rejects.toThrow('User not found in the group');
    });

    it('should throw error if group not found', async () => {
      Group.findByPk.mockResolvedValue(null);
      await expect(
        removeUserService(userId, groupId, targetUserId),
      ).rejects.toThrow('Group not found');
    });
  });

  describe('getAllPaymentsInGroupService', () => {
    it('should return payments for the group', async () => {
      Payment.findAll.mockResolvedValue([{ amount: 100, user_id: userId }]);

      const payments = await getAllPaymentsInGroupService(groupId);
      expect(payments).toHaveLength(1);
      expect(Payment.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        order: [['created_at', 'DESC']],
      });
    });
  });

  describe('fetchGroupMembers', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    const mockMembers = [
      {
        User: {
          username: 'testuser1',
          email: 'test1@example.com',
          profile_picture_url: 'https://example.com/profile1.jpg',
        },
        is_admin: true,
        joined_at: '2024-01-01',
      },
      {
        User: {
          username: 'testuser2',
          email: 'test2@example.com',
          profile_picture_url: 'https://example.com/profile2.jpg',
        },
        is_admin: false,
        joined_at: '2024-02-01',
      },
    ];

    it('should throw an error if group is not found', async () => {
      Group.findByPk.mockResolvedValue(null);

      await expect(fetchGroupMembers(1, 2)).rejects.toThrow('Group not found');

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).not.toHaveBeenCalled();
      expect(GroupMember.findAll).not.toHaveBeenCalled();
    });

    it('should throw an error if current user is not a member of the group', async () => {
      Group.findByPk.mockResolvedValue({ id: 1 });
      GroupMember.findOne.mockResolvedValue(null);

      await expect(fetchGroupMembers(1, 2)).rejects.toThrow(
        'You do not have access to this group',
      );

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: 1, user_id: 2 },
      });
      expect(GroupMember.findAll).not.toHaveBeenCalled();
    });

    it('should fetch group members successfully with pagination', async () => {
      Group.findByPk.mockResolvedValue({ id: 1 });
      GroupMember.findOne.mockResolvedValue({ id: 2 });
      GroupMember.count.mockResolvedValue(20);
      GroupMember.findAll.mockResolvedValue(mockMembers);

      const result = await fetchGroupMembers(1, 2, 2, 10);

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: 1, user_id: 2 },
      });
      expect(GroupMember.count).toHaveBeenCalledWith({
        where: { group_id: 1 },
      });
      expect(GroupMember.findAll).toHaveBeenCalledWith({
        where: { group_id: 1 },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'profile_picture_url'],
          },
        ],
        attributes: ['is_admin', 'joined_at'],
        limit: 10,
        offset: 10,
      });

      expect(result).toEqual({
        members: [
          {
            username: 'testuser1',
            email: 'test1@example.com',
            profilePicture: 'https://example.com/profile1.jpg',
            isAdmin: true,
            joinedAt: '2024-01-01',
          },
          {
            username: 'testuser2',
            email: 'test2@example.com',
            profilePicture: 'https://example.com/profile2.jpg',
            isAdmin: false,
            joinedAt: '2024-02-01',
          },
        ],
        pagination: {
          total: 20,
          page: 2,
          limit: 10,
          totalPages: 2,
        },
      });
    });

    it('should handle empty group members gracefully', async () => {
      Group.findByPk.mockResolvedValue({ id: 1 });
      GroupMember.findOne.mockResolvedValue({ id: 2 });
      GroupMember.count.mockResolvedValue(0);
      GroupMember.findAll.mockResolvedValue([]);

      const result = await fetchGroupMembers(1, 2, 1, 5);

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: 1, user_id: 2 },
      });
      expect(GroupMember.count).toHaveBeenCalledWith({
        where: { group_id: 1 },
      });
      expect(GroupMember.findAll).toHaveBeenCalledWith({
        where: { group_id: 1 },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'profile_picture_url'],
          },
        ],
        attributes: ['is_admin', 'joined_at'],
        limit: 5,
        offset: 0,
      });

      expect(result).toEqual({
        members: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 0,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      Group.findByPk.mockRejectedValue(new Error('Database error'));

      await expect(fetchGroupMembers(1, 2)).rejects.toThrow('Database error');

      expect(Group.findByPk).toHaveBeenCalledWith(1);
    });
  });

  describe('sendInviteEmail', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should throw an error if group is not found', async () => {
      Group.findByPk.mockResolvedValue(null);

      await expect(sendInviteEmail(1, 'test@example.com', 2)).rejects.toThrow(
        'Group not found',
      );

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
    });

    test('should throw an error if inviter is not a member of the group', async () => {
      Group.findByPk.mockResolvedValue({ id: 1, name: 'Test Group' });
      GroupMember.findOne.mockResolvedValue(null);

      await expect(sendInviteEmail(1, 'test@example.com', 2)).rejects.toThrow(
        'You must be a group member to invite others',
      );

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: 1, user_id: 2 },
      });
      expect(sendMail).not.toHaveBeenCalled();
    });

    test('should send an invitation email successfully', async () => {
      Group.findByPk.mockResolvedValue({ id: 1, name: 'Test Group' });
      GroupMember.findOne.mockResolvedValue({ id: 2 });
      sendMail.mockResolvedValue(true);

      const result = await sendInviteEmail(1, 'test@example.com', 2);

      expect(Group.findByPk).toHaveBeenCalledWith(1);
      expect(GroupMember.findOne).toHaveBeenCalledWith({
        where: { group_id: 1, user_id: 2 },
      });
      expect(sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: "You're Invited to Join a Group!",
        text: `You've been invited to join the group "Test Group". Click here to join: https://your-app.com/invite?groupId=1&email=test@example.com`,
      });
      expect(result).toBe('Invitation sent successfully to test@example.com');
    });
  });
});
