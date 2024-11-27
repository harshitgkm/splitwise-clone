const {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  getGroupMembers,
  leaveGroup,
  removeUser,
  getAllPaymentsForGroup,
  sendGroupInvite,
} = require('../../src/controllers/groups.controller');

const {
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
} = require('../../src/services/groups.service');

const { uploadFileToS3 } = require('../../src/helpers/aws.helper');

jest.mock('../../src/services/groups.service');
jest.mock('../../src/helpers/aws.helper');

describe('Group Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1, username: 'test_user' },
      params: {},
      body: {},
      query: {},
    };
    res = {
      data: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const mockGroup = { id: 1, name: 'Test Group' };
      createGroupService.mockResolvedValue(mockGroup);

      req.body = { name: 'Test Group' };
      await createGroup(req, res, next);

      expect(createGroupService).toHaveBeenCalledWith({
        ...req.body,
        userId: req.user.id,
        my_username: req.user.username,
      });
      expect(res.data).toEqual(mockGroup);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during group creation', async () => {
      createGroupService.mockRejectedValue(new Error('Error creating group'));

      await createGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating group',
        error: 'Error creating group',
      });
    });
  });

  describe('getGroups', () => {
    it('should retrieve groups for a user', async () => {
      const mockGroups = [{ id: 1, name: 'Group 1' }];
      getGroupsService.mockResolvedValue(mockGroups);

      req.query = { page: 1, limit: 10 };
      await getGroups(req, res, next);

      expect(getGroupsService).toHaveBeenCalledWith(req.user.id, 1, 10);
      expect(res.data).toEqual(mockGroups);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during group retrieval', async () => {
      getGroupsService.mockRejectedValue(new Error('Error retrieving groups'));

      await getGroups(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving groups',
      });
    });
  });

  describe('updateGroup', () => {
    it('should update a group successfully', async () => {
      const mockUpdatedGroup = { id: 1, name: 'Updated Group' };
      updateGroupService.mockResolvedValue(mockUpdatedGroup);

      req.params.id = 1;
      req.body = { name: 'Updated Group' };
      await updateGroup(req, res, next);

      expect(updateGroupService).toHaveBeenCalledWith(req.user.id, 1, req.body);
      expect(res.data).toEqual(mockUpdatedGroup);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during group update', async () => {
      updateGroupService.mockRejectedValue(new Error('Error updating group'));

      await updateGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating group',
      });
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group successfully', async () => {
      deleteGroupService.mockResolvedValue('Group deleted successfully');

      req.params.id = 1;
      await deleteGroup(req, res, next);

      expect(deleteGroupService).toHaveBeenCalledWith(req.user.id, 1);
      expect(res.data).toEqual('Group deleted successfully');
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during group deletion', async () => {
      deleteGroupService.mockRejectedValue(new Error('Error deleting group'));

      await deleteGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting group',
      });
    });
  });

  describe('addMemberToGroup', () => {
    it('should add a member to a group successfully', async () => {
      const mockResponse = { id: 1, username: 'new_member', isAdmin: false };
      addGroupMember.mockResolvedValue(mockResponse);

      req.params.id = 1;
      req.body = { username: 'new_member', isAdmin: false };
      await addMemberToGroup(req, res, next);

      expect(addGroupMember).toHaveBeenCalledWith(
        1,
        req.user.id,
        'new_member',
        false,
      );
      expect(res.data).toEqual(mockResponse);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during adding a member to group', async () => {
      addGroupMember.mockRejectedValue(new Error('Error adding user to group'));

      await addMemberToGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error adding user to group',
      });
    });
  });

  describe('getGroupMembers', () => {
    it('should retrieve group members successfully', async () => {
      const mockMembers = [{ id: 1, username: 'member1' }];
      fetchGroupMembers.mockResolvedValue(mockMembers);

      req.params.id = 1;
      req.query = { page: 1, limit: 10 };
      await getGroupMembers(req, res, next);

      expect(fetchGroupMembers).toHaveBeenCalledWith(1, req.user.id, 1, 10);
      expect(res.data).toEqual(mockMembers);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during retrieving group members', async () => {
      fetchGroupMembers.mockRejectedValue(new Error('Error getting members'));

      await getGroupMembers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error getting members',
      });
    });
  });

  describe('leaveGroup', () => {
    it('should allow a user to leave a group', async () => {
      leaveGroupService.mockResolvedValue('Left group successfully');

      req.params.id = 1;
      await leaveGroup(req, res, next);

      expect(leaveGroupService).toHaveBeenCalledWith(req.user.id, 1);
      expect(res.data).toEqual('Left group successfully');
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during leaving group', async () => {
      leaveGroupService.mockRejectedValue(new Error('Error leaving group'));

      await leaveGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error leaving group',
      });
    });
  });

  describe('removeUser', () => {
    it('should remove a user from a group successfully', async () => {
      removeUserService.mockResolvedValue('User removed successfully');

      req.params = { id: 1, userId: 2 };
      await removeUser(req, res, next);

      expect(removeUserService).toHaveBeenCalledWith(1, 1, 2);
      expect(res.data).toEqual('User removed successfully');
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during user removal', async () => {
      removeUserService.mockRejectedValue(
        new Error('Error removing user from group'),
      );

      await removeUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error removing user from group',
      });
    });
  });

  describe('getAllPaymentsForGroup', () => {
    it('should get all payments in a group', async () => {
      const mockPayments = [{ id: 1, amount: 100 }];
      getAllPaymentsInGroupService.mockResolvedValue(mockPayments);

      req.params.groupId = 1;
      await getAllPaymentsForGroup(req, res, next);

      expect(getAllPaymentsInGroupService).toHaveBeenCalledWith(1);
      expect(res.data).toEqual(mockPayments);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors during getting payments', async () => {
      getAllPaymentsInGroupService.mockRejectedValue(
        new Error('Error getting payments'),
      );

      await getAllPaymentsForGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error getting payments',
      });
    });
  });

  describe('sendGroupInvite', () => {
    it('should send a group invite successfully', async () => {
      sendInviteEmail.mockResolvedValue('Invite sent successfully');

      req.params.id = 1;
      req.body.email = 'test@example.com';
      await sendGroupInvite(req, res);

      expect(sendInviteEmail).toHaveBeenCalledWith(1, 'test@example.com', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invite sent successfully',
      });
    });

    it('should handle errors during sending group invite', async () => {
      sendInviteEmail.mockRejectedValue(new Error('Error sending invite'));

      await sendGroupInvite(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: 'Error sending invite' });
    });
  });
});
