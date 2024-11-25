const Joi = require('joi');
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.json({ error: error.details[0].message });
  }
  next();
};
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.json({ error: error.details[0].message });
  }
  next();
};
module.exports = {
  validateRegister,
  validateLogin,
};
