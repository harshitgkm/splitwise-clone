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
} = require('../../src/services/groups.service');
const { faker } = require('@faker-js/faker');

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
  },
  User: {
    findByPk: jest.fn(),
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
      const result = await createGroupService(userId, groupData);
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
    it('should return a list of groups for a user', async () => {
      GroupMember.findAll.mockResolvedValue([
        {
          group_id: groupId,
          user_id: userId,
        },
      ]);

      const groups = await getGroupsService(userId);
      expect(groups).toHaveLength(1);
      expect(groups[0].groupId).toBe(groupId);
      expect(Group.findByPk).toHaveBeenCalledWith(groupId, {
        attributes: ['id', 'name', 'type', 'profile_image_url'],
      });
    });

    it('should return an empty list if no groups are found for the user', async () => {
      GroupMember.findAll.mockResolvedValue([]);
      const groups = await getGroupsService(userId);
      expect(groups).toHaveLength(0);
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
    it('should throw error if user is already a member', async () => {
      GroupMember.findOne.mockResolvedValue({ user_id: targetUserId });
      await expect(
        addGroupMember(groupId, userId, targetUserId),
      ).rejects.toThrow('User is already a member of the group');
    });

    it('should throw error if group not found', async () => {
      Group.findByPk.mockResolvedValue(null);
      await expect(
        addGroupMember(groupId, userId, targetUserId),
      ).rejects.toThrow('Group not found');
    });

    it('should throw error if user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(
        addGroupMember(groupId, userId, targetUserId),
      ).rejects.toThrow('User not found');
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
});
