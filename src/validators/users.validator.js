const Joi = require('joi');

const updateUserValidator = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    profile_picture_url: Joi.string().uri().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.json({ error: error.details[0].message });
  next();
};

const addFriendValidator = (req, res, next) => {
  const schema = Joi.object({
    friend_two: Joi.number().integer().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { updateUserValidator, addFriendValidator };
