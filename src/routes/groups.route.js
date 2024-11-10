const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
} = require('../controllers/groups.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, createGroup);

router.get('/', verifyToken, getGroups);

module.exports = router;
