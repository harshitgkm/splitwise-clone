jest.mock('../../src/models', () => ({
  Group: {
    findByPk: jest.fn(),
    getUsers: jest.fn(),
  },
  Expense: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
  },
  ExpenseSplit: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Payment: {
    create: jest.fn(),
  },
  Comment: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../../src/helpers/mail.helper.js', () => ({
  sendExpenseNotification: jest.fn(),
}));

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
} = require('../../src/services/expenses.service');

const {
  Group,
  Expense,
  ExpenseSplit,
  User,
  Payment,
  Comment,
} = require('../../src/models');
const { sendExpenseNotification } = require('../../src/helpers/mail.helper.js');

describe('Expense Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpenseService', () => {
    it('should create an expense and split equally', async () => {
      const groupId = 1;
      const amount = 100;
      const description = 'Dinner';
      const splitType = 'EQUALLY';
      const users = [{ userId: 1 }, { userId: 2 }];

      Group.findByPk.mockResolvedValue({
        id: groupId,
        getUsers: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      });

      Expense.create.mockResolvedValue({ id: 1 });
      ExpenseSplit.create.mockResolvedValue({});
      sendExpenseNotification.mockResolvedValue();

      const result = await createExpenseService(
        groupId,
        amount,
        description,
        splitType,
        users,
      );

      expect(result.id).toBe(1);
      expect(Expense.create).toHaveBeenCalledWith({
        group_id: groupId,
        description: description,
        amount,
        split_type: splitType,
      });
      expect(ExpenseSplit.create).toHaveBeenCalledTimes(2);
      expect(sendExpenseNotification).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the group is not found', async () => {
      const groupId = 1;
      const amount = 100;
      const description = 'Dinner';
      const splitType = 'EQUALLY';
      const users = [{ userId: 1 }, { userId: 2 }];

      Group.findByPk.mockResolvedValue(null);

      await expect(
        createExpenseService(groupId, amount, description, splitType, users),
      ).rejects.toThrow('Group not found');
    });
  });

  describe('getAllExpensesService', () => {
    it('should return all expenses for a group', async () => {
      const groupId = 1;
      const page = 1;
      const limit = 10;
      const expenses = [{ id: 1, description: 'Dinner', amount: 100 }];

      Expense.findAll.mockResolvedValue(expenses);

      const result = await getAllExpensesService(groupId, page, limit);

      expect(result).toEqual(expenses);
      expect(Expense.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        limit,
        offset: (page - 1) * limit,
      });
    });
  });

  describe('getExpenseDetailsService', () => {
    it('should return expense details', async () => {
      const expenseId = 1;
      const expenseDetails = {
        id: 1,
        description: 'Dinner',
        amount: 100,
        expenseSplits: [
          {
            user_id: 1,
            amount_paid: 50,
            amount_owed: 50,
            split_ratio: 50,
            user: { username: 'John' },
          },
        ],
        oweDetails: [{ payer: 'John', oweTo: 'Jane', amount: '50.00' }],
      };

      Expense.findOne.mockResolvedValue({
        id: 1,
        expenseSplits: [
          {
            user_id: 1,
            amount_paid: 50,
            amount_owed: 50,
            split_ratio: 50,
            user: { username: 'John' },
          },
        ],
      });
      ExpenseSplit.findOne.mockResolvedValue({});
      User.findByPk.mockResolvedValue({ username: 'John' });

      const result = await getExpenseDetailsService(expenseId);

      expect(result).toEqual();
    });

    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findOne.mockResolvedValue(null);

      await expect(getExpenseDetailsService(expenseId)).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('updateExpenseService', () => {
    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findByPk.mockResolvedValue(null);

      await expect(updateExpenseService({ expenseId })).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('deleteExpenseService', () => {
    it('should delete an expense', async () => {
      const expenseId = 1;
      const expense = { id: expenseId, destroy: jest.fn() };

      Expense.findOne.mockResolvedValue(expense);

      await deleteExpenseService(expenseId);

      expect(expense.destroy).toHaveBeenCalled();
    });

    it('should throw an error if the expense is not found', async () => {
      const expenseId = 999;

      Expense.findOne.mockResolvedValue(null);

      await expect(deleteExpenseService(expenseId)).rejects.toThrow(
        'Expense not found',
      );
    });
  });

  describe('settleUpService', () => {
    it('should settle up the amount between payer and payee', async () => {
      const payerId = 1;
      const payeeId = 2;
      const amount = 50;
      const expenseId = 1;

      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 50 });
      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 0 });
      ExpenseSplit.update.mockResolvedValue([1]);
      Payment.create.mockResolvedValue({ id: 1, amount });

      const result = await settleUpService(payerId, payeeId, amount, expenseId);

      expect(result.payment.amount).toBe(amount);
      expect(ExpenseSplit.update).toHaveBeenCalledTimes(2);
      expect(Payment.create).toHaveBeenCalled();
    });

    it('should throw an error if the amount to settle does not match', async () => {
      const payerId = 1;
      const payeeId = 2;
      const amount = 100;
      const expenseId = 1;

      ExpenseSplit.findOne.mockResolvedValueOnce({ amount_owed: 50 });

      await expect(
        settleUpService(payerId, payeeId, amount, expenseId),
      ).rejects.toThrow('The amount to settle must match the amount owed.');
    });
  });

  describe('createCommentService', () => {
    it('should create a comment', async () => {
      const expenseId = 1;
      const userId = 1;
      const comment = 'Nice dinner';
      const newComment = {
        id: 1,
        expense_id: expenseId,
        user_id: userId,
        comment,
        created_at: new Date(),
        updated_at: new Date(),
      };

      Comment.create.mockResolvedValue(newComment);
      User.findByPk.mockResolvedValue({
        username: 'John',
        profile_picture_url: 'url',
      });

      const result = await createCommentService(expenseId, userId, comment);

      expect(result.comment).toBe(comment);
      expect(Comment.create).toHaveBeenCalled();
    });
  });

  describe('getCommentsService', () => {
    it('should return all comments for an expense', async () => {
      const expenseId = 1;
      const comments = [
        {
          id: 1,
          expense_id: expenseId,
          user_id: 1,
          comment: 'Nice dinner',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      Comment.findAll.mockResolvedValue(comments);

      const result = await getCommentsService(expenseId);

      expect(result).toEqual(comments);
    });
  });

  describe('updateCommentService', () => {
    it('should throw an error if the comment is not found', async () => {
      const commentId = 999;
      const userId = 1;
      const newCommentText = 'Updated comment';
      Comment.findByPk.mockResolvedValue({
        id: 1,
        user_id: 1,
        comment: 'Nice dinner',
        User: { username: 'John' },
      });

      Comment.findByPk.mockResolvedValue(null);

      await expect(
        updateCommentService(commentId, userId, newCommentText),
      ).rejects.toThrow('Comment not found');
    });
  });

  describe('deleteCommentService', () => {
    it('should delete a comment', async () => {
      const commentId = 1;
      const comment = { id: commentId, destroy: jest.fn() };

      Comment.findByPk.mockResolvedValue(comment);

      await deleteCommentService(commentId);

      expect(comment.destroy).toHaveBeenCalled();
    });

    it('should throw an error if the comment is not found', async () => {
      const commentId = 999;

      Comment.findByPk.mockResolvedValue(null);

      await expect(deleteCommentService(commentId)).rejects.toThrow(
        'Comment not found',
      );
    });
  });
});
