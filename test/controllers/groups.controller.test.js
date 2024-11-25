const {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  leaveGroup,
  removeUser,
  getAllPaymentsForGroup,
} = require('../../src/controllers/groups.controller');
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
const { uploadFileToS3 } = require('../../src/helpers/aws.helper');

jest.mock('../../src/services/groups.service');
jest.mock('../../src/helpers/aws.helper');

describe('Group Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const groupData = { name: 'Test Group' };
      req.body = groupData;
      createGroupService.mockResolvedValue({
        id: 'group123',
        name: 'Test Group',
      });

      await createGroup(req, res);

      expect(createGroupService).toHaveBeenCalledWith('user123', groupData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Group created successfully',
        group: { id: 'group123', name: 'Test Group' },
      });
    });

    it('should handle errors when creating a group', async () => {
      const error = new Error('Database error');
      createGroupService.mockRejectedValue(error);

      await createGroup(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating group',
      });
    });
  });

  describe('getGroups', () => {
    it('should retrieve groups successfully', async () => {
      const groups = [{ id: 'group123', name: 'Test Group' }];
      req.query.page = 1;
      req.query.limit = 10;
      getGroupsService.mockResolvedValue(groups);

      await getGroups(req, res);

      expect(getGroupsService).toHaveBeenCalledWith('user123', 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(groups);
    });

    it('should handle errors when retrieving groups', async () => {
      const error = new Error('Database error');
      getGroupsService.mockRejectedValue(error);

      await getGroups(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving groups',
      });
    });
  });

  describe('updateGroup', () => {
    it('should update the group successfully', async () => {
      req.params.groupId = 'group123';
      req.body = { name: 'Updated Group' };

      // Simulate that req.url contains the file URL
      req.url = 'https://some.url.com/image.jpg';

      // Mocking the S3 file upload
      uploadFileToS3.mockResolvedValue(
        'https://s3.amazonaws.com/groupimage.jpg',
      );
      updateGroupService.mockResolvedValue({
        id: 'group123',
        name: 'Updated Group',
        profile_image_url: 'https://s3.amazonaws.com/groupimage.jpg',
      });

      await updateGroup(req, res);

      // Assert that the uploadFileToS3 was called with the URL
      expect(uploadFileToS3).toHaveBeenCalledWith(req.url);
      expect(updateGroupService).toHaveBeenCalledWith(
        'user123',
        'group123',
        req.body,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Group updated successfully',
        group: {
          id: 'group123',
          name: 'Updated Group',
          profile_image_url: 'https://s3.amazonaws.com/groupimage.jpg',
        },
      });
    });

    it('should handle errors when updating a group', async () => {
      const error = new Error('Database error');
      updateGroupService.mockRejectedValue(error);

      await updateGroup(req, res);

      // Expecting the error message returned by the service
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('deleteGroup', () => {
    it('should delete the group successfully', async () => {
      req.params.groupId = 'group123';
      deleteGroupService.mockResolvedValue();

      await deleteGroup(req, res);

      expect(deleteGroupService).toHaveBeenCalledWith('user123', 'group123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Group deleted successfully',
      });
    });

    it('should handle errors when deleting a group', async () => {
      const error = new Error('Database error');
      deleteGroupService.mockRejectedValue(error);

      await deleteGroup(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('addMemberToGroup', () => {
    it('should add a user to the group successfully', async () => {
      req.params.groupId = 'group123';
      req.body = { userId: 'user456', isAdmin: false };
      addGroupMember.mockResolvedValue({ success: true });

      await addMemberToGroup(req, res);

      expect(addGroupMember).toHaveBeenCalledWith(
        'group123',
        'user123',
        'user456',
        false,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User added to group successfully',
        data: { success: true },
      });
    });

    it('should handle errors when adding a user to a group', async () => {
      const error = new Error('Database error');
      addGroupMember.mockRejectedValue(error);

      await addMemberToGroup(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('leaveGroup', () => {
    it('should let a user leave the group', async () => {
      req.params.groupId = 'group123';
      leaveGroupService.mockResolvedValue();

      await leaveGroup(req, res);

      expect(leaveGroupService).toHaveBeenCalledWith('user123', 'group123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have left the group',
      });
    });

    it('should handle errors when leaving a group', async () => {
      const error = new Error('Database error');
      leaveGroupService.mockRejectedValue(error);

      await leaveGroup(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('removeUser', () => {
    it('should remove a user from the group successfully', async () => {
      req.params.groupId = 'group123';
      req.params.userId = 'user456';
      removeUserService.mockResolvedValue();

      await removeUser(req, res);

      expect(removeUserService).toHaveBeenCalledWith(
        'user123',
        'group123',
        'user456',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User removed from the group',
      });
    });

    it('should handle errors when removing a user from a group', async () => {
      const error = new Error('Database error');
      removeUserService.mockRejectedValue(error);

      await removeUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getAllPaymentsForGroup', () => {
    it('should get all payments for the group', async () => {
      req.params.groupId = 'group123';
      const payments = [{ amount: 100, userId: 'user123' }];
      getAllPaymentsInGroupService.mockResolvedValue(payments);

      await getAllPaymentsForGroup(req, res);

      expect(getAllPaymentsInGroupService).toHaveBeenCalledWith('group123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(payments);
    });
    it('should handle errors when getting payments', async () => {
      const error = new Error('Database error');
      getAllPaymentsInGroupService.mockRejectedValue(error);

      await getAllPaymentsForGroup(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });
});
