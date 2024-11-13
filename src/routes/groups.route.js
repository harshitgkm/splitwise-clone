const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  deleteGroup,
  updateGroup,
  addMemberToGroup,
} = require('../controllers/groups.controller.js');

const {
  verifyToken,
  checkGroupAdmin,
} = require('../middlewares/auth.middleware.js');

router.post('/', verifyToken, createGroup);

router.get('/', verifyToken, getGroups);

router.put('/:groupId', verifyToken, checkGroupAdmin, updateGroup);

router.delete('/:groupId', verifyToken, checkGroupAdmin, deleteGroup);

router.post(
  '/:groupId/addMember',
  verifyToken,
  checkGroupAdmin,
  addMemberToGroup,
);

module.exports = router;
