const {
  getUserById,
  updateUser,
  addFriendService,
  getFriends,
} = require('../src/services/users.service');
const { User, FriendList } = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/helpers/aws.helper.js', () => ({
  uploadFileToS3: jest.fn(),
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should fetch user by ID and exclude password', async () => {
      const mockUser = {
        id: '123',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const userId = '123';
      const result = await getUserById(userId);

      expect(User.findByPk).toHaveBeenCalledWith(userId, {
        attributes: { exclude: ['password'] },
      });
      expect(result).toEqual({
        id: '123',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      });
    });

    it('should return null if user is not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      const userId = '999';
      const result = await getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user and exclude password', async () => {
      const updatedData = { username: 'john_doe_updated' };
      const mockUser = {
        id: '123',
        username: 'john_doe_updated',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      };

      User.update = jest.fn().mockResolvedValue([1]);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const userId = '123';
      const result = await updateUser(userId, updatedData);

      expect(User.update).toHaveBeenCalledWith(updatedData, {
        where: { id: userId },
      });
      expect(result).toEqual({
        id: '123',
        username: 'john_doe_updated',
        email: 'johndoe@example.com',
        profile_picture_url: 'https://example.com/profile.jpg',
      });
    });

    it('should throw an error if user update fails', async () => {
      User.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      const updatedData = { username: 'john_doe_updated' };
      const userId = '123';

      await expect(updateUser(userId, updatedData)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('addFriendService', () => {
    it('should add a new friendship', async () => {
      const mockFriend = { username: 'janedoe' };
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockFriend);

      const result = await addFriendService(friend_one, friend_two);

      expect(FriendList.findOne).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: friend_two },
        attributes: ['username'],
      });
      expect(result).toEqual({
        message: 'Friendship created successfully with janedoe',
        friend: 'janedoe',
      });
    });

    it('should throw an error if friendship already exists', async () => {
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(true);

      await expect(addFriendService(friend_one, friend_two)).rejects.toThrow(
        'Friendship already exists',
      );
    });

    it('should throw an error if friend not found', async () => {
      const friend_one = '123';
      const friend_two = '456';

      FriendList.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(addFriendService(friend_one, friend_two)).rejects.toThrow(
        'Friend not found',
      );
    });
  });

  describe('getFriends', () => {
    it('should return the list of friends for the user', async () => {
      const userId = '123';
      const mockFriends = [
        { friend_one: '123', friend_two: '456' },
        { friend_one: '123', friend_two: '789' },
      ];

      const mockFriendNames = ['janedoe', 'samsmith'];

      FriendList.findAll = jest.fn().mockResolvedValue(mockFriends);
      User.findOne = jest
        .fn()
        .mockResolvedValueOnce({ username: 'janedoe' })
        .mockResolvedValueOnce({ username: 'samsmith' });

      const result = await getFriends(userId);

      expect(FriendList.findAll).toHaveBeenCalledWith({
        where: expect.anything(),
        attributes: ['friend_one', 'friend_two'],
      });
      expect(result).toEqual(mockFriendNames);
    });

    it('should return an empty list if no friends are found', async () => {
      const userId = '123';

      FriendList.findAll = jest.fn().mockResolvedValue([]);
      const result = await getFriends(userId);

      expect(result).toEqual([]);
    });
  });
});
