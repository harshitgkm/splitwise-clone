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
} = require('../../src/controllers/users.controller.js');

const {
  getUserById,
  updateUser,
  calculateOutstandingBalance,
  addFriendService,
  getFriends,
  removeFriendService,
  getAllPaymentsService,
  generateExpenseReportService,
  generatePDFAndUploadToS3,
  getReportsService,
} = require('../../src/services/users.service');

const { uploadFileToS3 } = require('../../src/helpers/aws.helper.js');

jest.mock('../../src/services/users.service', () => ({
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  calculateOutstandingBalance: jest.fn(),
  addFriendService: jest.fn(),
  getFriends: jest.fn(),
  removeFriendService: jest.fn(),
  getAllPaymentsService: jest.fn(),
  generateExpenseReportService: jest.fn(),
  generatePDFAndUploadToS3: jest.fn(),
  getReportsService: jest.fn(),
}));

jest.mock('../../src/helpers/aws.helper.js', () => ({
  uploadFileToS3: jest.fn(),
}));

describe('Users Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 1 }, file: null, body: {}, query: {} };
    res = { data: null, status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should get user profile', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    getUserById.mockResolvedValue(mockUser);

    await getUserProfile(req, res, next);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(res.data).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should update user profile', async () => {
    req.body = { username: 'newuser' };
    const mockImageUrl = 'https://s3.amazonaws.com/image.jpg';
    const mockUser = {
      id: 1,
      username: 'newuser',
      profile_picture_url: mockImageUrl,
    };
    uploadFileToS3.mockResolvedValue(mockImageUrl);
    updateUser.mockResolvedValue(mockUser);

    await updateUserProfile(req, res, next);

    expect(res.data).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should handle error when updating user profile', async () => {
    const errorMessage = 'Error updating user profile';
    updateUser.mockRejectedValue(new Error(errorMessage));

    await updateUserProfile(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    expect(next).not.toHaveBeenCalled();
  });

  it('should get outstanding balance', async () => {
    const mockBalance = 100;
    calculateOutstandingBalance.mockResolvedValue(mockBalance);

    await getOutstandingBalance(req, res, next);

    expect(calculateOutstandingBalance).toHaveBeenCalledWith(1);
    expect(res.data).toEqual(mockBalance);
    expect(next).toHaveBeenCalled();
  });

  it('should add a friend', async () => {
    req.body = { username: 'friend' };
    const mockFriendship = { userId: 1, friendUsername: 'friend' };
    addFriendService.mockResolvedValue(mockFriendship);

    await addFriend(req, res, next);

    expect(addFriendService).toHaveBeenCalledWith(1, 'friend');
    expect(res.data).toEqual(mockFriendship);
    expect(next).toHaveBeenCalled();
  });

  it('should get friends list', async () => {
    const mockFriendsList = [
      { id: 2, username: 'friend1' },
      { id: 3, username: 'friend2' },
    ];
    getFriends.mockResolvedValue(mockFriendsList);

    await getFriendsList(req, res, next);

    expect(getFriends).toHaveBeenCalledWith(1, 1, 10);
    expect(res.data).toEqual({
      currentPage: 1,
      totalFriends: mockFriendsList.length,
      data: mockFriendsList,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should remove a friend', async () => {
    req.params = { id: 2 };
    removeFriendService.mockResolvedValue();

    await removeFriend(req, res);

    expect(removeFriendService).toHaveBeenCalledWith(2, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Friend removed successfully',
    });
  });

  it('should handle error when removing a friend', async () => {
    req.params = { id: 2 };
    const errorMessage = 'Error removing friend';
    removeFriendService.mockRejectedValue(new Error(errorMessage));

    await removeFriend(req, res);

    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });

  it('should get all payments for user', async () => {
    const mockPayments = {
      payments: [{ payer_id: 1, payee_id: 2, amount: 50 }],
      total: 1,
    };
    getAllPaymentsService.mockResolvedValue(mockPayments);

    await getAllPaymentsForUser(req, res, next);

    expect(getAllPaymentsService).toHaveBeenCalledWith(1, 1, 10);
    expect(res.data).toEqual(mockPayments);
    expect(next).toHaveBeenCalled();
  });

  it('should generate expense report', async () => {
    const mockReport = { expenses: [{ description: 'Dinner', amount: 20 }] };
    generateExpenseReportService.mockResolvedValue(mockReport);

    await generateExpenseReport(req, res, next);

    expect(generateExpenseReportService).toHaveBeenCalledWith(1, 1, 10);
    expect(res.data).toEqual(mockReport);
    expect(next).toHaveBeenCalled();
  });

  it('should export report to PDF', async () => {
    const mockS3Url = 'https://s3.amazonaws.com/report.pdf';
    generatePDFAndUploadToS3.mockResolvedValue(mockS3Url);

    await exportReportToPDF(req, res, next);

    expect(generatePDFAndUploadToS3).toHaveBeenCalledWith(1);
    expect(res.data).toEqual(mockS3Url);
    expect(next).toHaveBeenCalled();
  });

  it('should get all reports', async () => {
    const mockReports = [{ id: 1, title: 'Report 1' }];
    getReportsService.mockResolvedValue(mockReports);

    await getAllReports(req, res, next);

    expect(getReportsService).toHaveBeenCalledWith(1, 1, 10);
    expect(res.data).toEqual(mockReports);
    expect(next).toHaveBeenCalled();
  });

  it('should handle error in getAllPaymentsForUser', async () => {
    const errorMessage = 'Error fetching payments';
    getAllPaymentsService.mockRejectedValue(new Error(errorMessage));

    await getAllPaymentsForUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    expect(next).not.toHaveBeenCalled();
  });
});
