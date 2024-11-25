const Joi = require('joi');

const createGroupValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    type: Joi.string().min(3).max(50).optional(),
    profile_image_url: Joi.string().uri().optional(),
    username: Joi.string().min(3).max(50).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.json({ error: error.details[0].message });
  next();
};

const updateGroupValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    type: Joi.string().min(3).max(50).optional(),
    profile_image_url: Joi.string().uri().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.json({ error: error.details[0].message });
  next();
};

module.exports = { createGroupValidator, updateGroupValidator };
