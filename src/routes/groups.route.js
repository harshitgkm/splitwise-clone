const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  deleteGroup,
  updateGroup,
} = require('../controllers/groups.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, createGroup);

router.get('/', verifyToken, getGroups);

router.put('/:groupId', verifyToken, updateGroup);

router.delete('/:groupId', verifyToken, deleteGroup);

module.exports = router;
