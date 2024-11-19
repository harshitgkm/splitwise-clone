const Joi = require('joi');

const createExpenseValidator = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().precision(2).positive().required(),
    description: Joi.string().max(255).optional(),
    splitType: Joi.string()
      .valid('EQUALLY', 'PERCENTAGE', 'SHARES', 'UNEQUAL')
      .required(),
    users: Joi.array()
      .items(
        Joi.object({
          userId: Joi.string().uuid().required(),
          amountPaid: Joi.number().precision(2).positive().optional(),
          amountOwed: Joi.number().precision(2).optional(),
          percentage: Joi.number().precision(2).optional(),
          shares: Joi.number().precision(2).optional(),
        }),
      )
      .required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

const updateExpenseValidator = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().precision(2).positive().optional(),
    description: Joi.string().max(255).optional(),
    splitType: Joi.string()
      .valid('EQUALLY', 'PERCENTAGE', 'SHARES', 'UNEQUAL')
      .optional(),
    users: Joi.array()
      .items(
        Joi.object({
          userId: Joi.number().integer().optional(),
          amountPaid: Joi.number().precision(2).positive().optional(),
          amountOwed: Joi.number().precision(2).optional(),
          percentage: Joi.number().precision(2).optional(),
          shares: Joi.number().precision(2).optional(),
        }),
      )
      .optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

const settleUpValidator = (req, res, next) => {
  const schema = Joi.object({
    groupId: Joi.string().uuid().required(),
    payerId: Joi.string().uuid().required(),
    payeeId: Joi.string().uuid().required(),
    amount: Joi.number().precision(2).positive().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = {
  createExpenseValidator,
  updateExpenseValidator,
  settleUpValidator,
};
