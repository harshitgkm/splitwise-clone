const {
  getUserProfile,
  updateUserProfile,
  getOutstandingBalance,
  addFriend,
  getFriendsList,
  removeFriend,
  getAllPaymentsForUser,
  generateExpenseReport,
  exportReportToPDF,
  getAllReports,
} = require('../../src/controllers/users.controller');

const validUser = {
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  profile_picture_url: 'http://example.com/profile.jpg',
};

const updatedData = {
  username: 'updateduser',
  email: 'updateduser@example.com',
};

const {
  getUserById,
  updateUser,
  addFriendService,
  getFriends,
  removeFriendService,
  calculateOutstandingBalance,
  getAllPaymentsService,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
  getReportsService,
} = require('../../src/services/users.service');

const { uploadFileToS3 } = require('../../src/helpers/aws.helper');

jest.mock('../../src/services/users.service');
jest.mock('../../src/helpers/aws.helper');

describe('Users Controller Unit Tests', () => {
  let res, next;

  beforeEach(() => {
    res = {
      data: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return the user profile', async () => {
      const req = { user: { id: '123' } };
      const mockUser = { id: '123', username: 'test_user' };
      getUserById.mockResolvedValue(mockUser);

      await getUserProfile(req, res, next);

      expect(getUserById).toHaveBeenCalledWith('123');
      expect(res.data).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors and respond with an error message', async () => {
      const req = { user: { id: '123' } };
      const error = new Error('User not found');
      getUserById.mockRejectedValue(error);

      await getUserProfile(req, res, next);

      expect(getUserById).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile with uploaded file', async () => {
      const req = {
        params: { id: '123' },
        body: { username: 'new_username' },
        file: { path: '/path/to/file', originalname: 'profile.jpg' },
      };
      const updatedUser = {
        id: '123',
        username: 'new_username',
        profile_picture_url: 'http://s3url.com/profile.jpg',
      };
      uploadFileToS3.mockResolvedValue('http://s3url.com/profile.jpg');
      updateUser.mockResolvedValue(updatedUser);

      await updateUserProfile(req, res, next);

      expect(uploadFileToS3).toHaveBeenCalledWith(req.file);
      expect(updateUser).toHaveBeenCalledWith('123', {
        username: 'new_username',
        profile_picture_url: 'http://s3url.com/profile.jpg',
      });
      expect(res.data).toEqual(updatedUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors and respond with an error message', async () => {
      const req = { params: { id: '123' }, body: {} };
      const error = new Error('Update failed');
      updateUser.mockRejectedValue(error);

      await updateUserProfile(req, res, next);

      expect(updateUser).toHaveBeenCalledWith('123', {});
      expect(res.json).toHaveBeenCalledWith({ error: 'Update failed' });
    });
  });

  describe('getOutstandingBalance', () => {
    it('should return the outstanding balance', async () => {
      const req = { user: { id: '123' } };
      calculateOutstandingBalance.mockResolvedValue(500);

      await getOutstandingBalance(req, res, next);

      expect(calculateOutstandingBalance).toHaveBeenCalledWith('123');
      expect(res.data).toEqual(500);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors and respond with a default error message', async () => {
      const req = { user: { id: '123' } };
      calculateOutstandingBalance.mockRejectedValue(
        new Error('Balance calculation failed'),
      );

      await getOutstandingBalance(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch outstanding balance.',
      });
    });

    it('should return zero outstanding balance when none exists', async () => {
      const req = { user: { id: validUser.id } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      calculateOutstandingBalance.mockResolvedValue(0);

      await getOutstandingBalance(req, res);

      expect(calculateOutstandingBalance).toHaveBeenCalledWith(validUser.id);
    });
  });

  describe('addFriend', () => {
    it('should add a new friend', async () => {
      const req = {
        user: { id: '123' },
        body: { username: 'friend_username' },
      };
      const mockFriendship = {
        id: 'friendship123',
        username: 'friend_username',
      };
      addFriendService.mockResolvedValue(mockFriendship);

      await addFriend(req, res, next);

      expect(addFriendService).toHaveBeenCalledWith('123', 'friend_username');
      expect(res.data).toEqual(mockFriendship);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if friend username is invalid', async () => {
      const req = {
        user: { id: validUser.id },
        body: { username: 'non_existing_user' }, // Invalid username
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      addFriendService.mockRejectedValue(new Error('User not found'));

      await addFriend(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle errors when adding a friend', async () => {
      const req = {
        user: { id: '123' },
        body: { username: 'friend_username' },
      };
      const error = new Error('Friend not found');
      addFriendService.mockRejectedValue(error);

      await addFriend(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ error: 'Friend not found' });
    });
  });

  describe('getFriendsList', () => {
    it('should return a list of friends', async () => {
      const req = { user: { id: '123' }, query: { page: 1, limit: 10 } };
      const friendsList = [
        { id: '1', username: 'friend1' },
        { id: '2', username: 'friend2' },
      ];
      getFriends.mockResolvedValue(friendsList);

      await getFriendsList(req, res, next);

      expect(getFriends).toHaveBeenCalledWith('123', 1, 10);
      expect(res.data).toEqual(friendsList);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors when fetching friends list', async () => {
      const req = { user: { id: '123' }, query: { page: 1, limit: 10 } };
      const error = new Error('Failed to fetch friends');
      getFriends.mockRejectedValue(error);

      await getFriendsList(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch friends',
      });
    });
  });

  it('should handle error if expense report generation fails', async () => {
    const req = { user: { id: validUser.id } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    generateExpenseReportService.mockRejectedValue(
      new Error('No expenses found'),
    );

    await generateExpenseReport(req, res);

    expect(generateExpenseReportService).toHaveBeenCalledWith(validUser.id);
    expect(res.json).toHaveBeenCalledWith({ error: 'No expenses found' });
  });

  it('should return error if friendship does not exist during removeFriend', async () => {
    const req = {
      params: { id: 'non_existing_friend_id' },
      user: { id: validUser.id },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    removeFriendService.mockRejectedValue(new Error('Friendship not found'));

    await removeFriend(req, res);

    expect(res.json).toHaveBeenCalledWith({ error: 'Friendship not found' });
  });

  it('should return an empty array if no reports exist', async () => {
    const req = { user: { id: validUser.id }, query: { page: 1, limit: 10 } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    getReportsService.mockResolvedValue([]);

    await getAllReports(req, res);

    expect(getReportsService).toHaveBeenCalledWith(validUser.id, 1, 10);
  });
});
