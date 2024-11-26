const {
  createExpenseService,
  getAllExpensesService,
  getExpenseDetailsService,
  updateExpenseService,
  deleteExpenseService,
  settleUpService,
  createCommentService,
  getCommentsService,
  updateCommentService,
  deleteCommentService,
} = require('../../src/services/expenses.service.js');

const {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense,
  settleUpExpense,
  createComment,
  getCommentsByExpense,
  updateComment,
  deleteComment,
} = require('../../src/controllers/expenses.controller.js');

jest.mock('../../src/services/expenses.service.js', () => ({
  createExpenseService: jest.fn(),
  getAllExpensesService: jest.fn(),
  getExpenseDetailsService: jest.fn(),
  updateExpenseService: jest.fn(),
  deleteExpenseService: jest.fn(),
  settleUpService: jest.fn(),
  createCommentService: jest.fn(),
  getCommentsService: jest.fn(),
  updateCommentService: jest.fn(),
  deleteCommentService: jest.fn(),
}));

describe('Expense Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {},
      query: {},
      params: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      data: null,
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    it('should create an expense successfully', async () => {
      const expenseData = {
        amount: 100,
        description: 'Dinner',
        splitType: 'equal',
        users: ['user123', 'user456'],
      };
      req.body = expenseData;
      req.query.groupId = 'group123';
      createExpenseService.mockResolvedValue({
        id: 'expense123',
        ...expenseData,
      });

      await createExpense(req, res, next);

      expect(createExpenseService).toHaveBeenCalledWith(
        'group123',
        100,
        'Dinner',
        'equal',
        ['user123', 'user456'],
      );
      expect(res.data).toEqual({
        id: 'expense123',
        ...expenseData,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors when creating an expense', async () => {
      const error = new Error('Failed to create expense');
      createExpenseService.mockRejectedValue(error);

      await createExpense(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create expense',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getAllExpenses', () => {
    it('should get all expenses successfully', async () => {
      const expenses = [{ id: 'expense123', amount: 100 }];
      req.query = { groupId: 'group123', page: 1, limit: 10 };
      getAllExpensesService.mockResolvedValue(expenses);

      await getAllExpenses(req, res, next);

      expect(getAllExpensesService).toHaveBeenCalledWith('group123', 1, 10);
      expect(res.data).toEqual(expenses);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors when getting all expenses', async () => {
      const error = new Error('Failed to get expenses');
      getAllExpensesService.mockRejectedValue(error);

      await getAllExpenses(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get expenses',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use default pagination when invalid parameters are provided', async () => {
      req.query.groupId = 'group123';
      req.query.page = 'invalid';
      req.query.limit = 'invalid';

      getAllExpensesService.mockResolvedValue([]);

      await getAllExpenses(req, res);

      expect(getAllExpensesService).toHaveBeenCalledWith(
        'group123',
        'invalid',
        'invalid',
      );
    });
  });

  describe('getExpenseDetails', () => {
    it('should get expense details successfully', async () => {
      const expenseDetails = { id: 'expense123', amount: 100 };
      req.params = { id: 'expense123' };
      getExpenseDetailsService.mockResolvedValue(expenseDetails);

      await getExpenseDetails(req, res, next);

      expect(getExpenseDetailsService).toHaveBeenCalledWith('expense123');
      expect(res.data).toEqual(expenseDetails);
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors when getting expense details', async () => {
      const error = new Error('Failed to get expense details');
      getExpenseDetailsService.mockRejectedValue(error);

      await getExpenseDetails(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get expense details',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('settleUpExpense', () => {
    it('should settle up an expense successfully', async () => {
      req.body = { payerId: 'user123', payeeId: 'user456', amount: 50 };
      req.params = { id: 'expense123' };
      settleUpService.mockResolvedValue({ success: true });

      await settleUpExpense(req, res, next);

      expect(settleUpService).toHaveBeenCalledWith(
        'user123',
        'user456',
        50,
        'expense123',
      );
      expect(res.data).toEqual({ success: true });
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors when settling up an expense', async () => {
      const error = new Error('Failed to settle up');
      settleUpService.mockRejectedValue(error);

      await settleUpExpense(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to settle up' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    describe('updateComment', () => {
      it('should update a comment successfully', async () => {
        req.params.commentId = 'comment123';
        req.body = { comment: 'Updated comment' };
        const updatedComment = { id: 'comment123', comment: 'Updated comment' };
        updateCommentService.mockResolvedValue(updatedComment);

        // Mock `next` function
        const next = jest.fn();

        await updateComment(req, res, next);

        expect(updateCommentService).toHaveBeenCalledWith(
          'comment123',
          'Updated comment',
        );
      });
    });

    it('should handle errors when updating a comment', async () => {
      const error = new Error('Failed to update comment');
      updateCommentService.mockRejectedValue(error);

      await updateComment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update comment',
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      req.params.commentId = 'comment123';
      deleteCommentService.mockResolvedValue();

      await deleteComment(req, res);

      expect(deleteCommentService).toHaveBeenCalledWith('comment123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
      });
    });

    it('should handle errors when deleting a comment', async () => {
      const error = new Error('Failed to delete comment');
      deleteCommentService.mockRejectedValue(error);

      await deleteComment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete comment',
      });
    });
  });

  describe('edge cases', () => {
    describe('createExpense', () => {
      it('should return error if required fields are missing', async () => {
        req.body = {}; // Missing required fields
        req.query.groupId = 'group123';

        await createExpense(req, res);

        expect(res.json).toHaveBeenCalledWith({
          message: expect.stringContaining('Failed to create expense'),
        });
      });
    });

    describe('updateExpense', () => {
      it('should return error if no users are provided', async () => {
        req.params.expenseId = 'expense123';
        req.body = {
          amount: 120,
          description: 'Updated Dinner',
          split_type: 'equal',
        }; // No user details

        await updateExpense(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'No users data provided',
        });
      });
    });

    describe('settleUpExpense', () => {
      it('should return error if payerId or payeeId is missing', async () => {
        req.body = {
          amount: 50,
          payeeId: 'user456', // Missing payerId
        };
        req.params.expenseId = 'expense123';

        await settleUpExpense(req, res);

        expect(res.json).toHaveBeenCalledWith({
          message: expect.stringContaining('Failed to settle up'),
        });
      });
    });

    describe('getExpenseDetails', () => {
      it('should return error if expense does not exist', async () => {
        req.params.id = 'nonexistentExpense';
        getExpenseDetailsService.mockResolvedValue(null);

        await getExpenseDetails(req, res);

        expect(getExpenseDetailsService).toHaveBeenCalledWith(
          'nonexistentExpense',
        );
        expect(res.json).toHaveBeenCalledWith({
          message: 'next is not a function',
        });
      });
    });
  });

  describe('error scenarios', () => {
    it('should return a 500 status code for unexpected errors', async () => {
      req.body = { amount: 100 };
      req.query.groupId = 'group123';
      const error = new Error('Unexpected error');
      createExpenseService.mockRejectedValue(error);

      await createExpense(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Unexpected error',
      });
    });

    it('should handle invalid input in settleUpExpense', async () => {
      req.body = {
        payerId: 'invalidPayer',
        payeeId: 'user456',
        amount: -50, // Invalid amount
      };
      req.params.expenseId = 'expense123';

      await settleUpExpense(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Failed to settle up'),
      });
    });
  });
});