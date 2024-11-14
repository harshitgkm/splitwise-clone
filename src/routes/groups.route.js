const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  deleteGroup,
  updateGroup,
  addMemberToGroup,
  leaveGroup,
  removeUser,
} = require('../controllers/groups.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const { checkGroupAdmin } = require('../middlewares/groups.middleware.js');
const upload = require('../middlewares/multer.middleware.js');

router.post('/', verifyToken, createGroup);

router.get('/', verifyToken, getGroups);

router.put(
  '/:groupId',
  verifyToken,
  checkGroupAdmin,
  upload.single('group_profile_url'),
  updateGroup,
);

router.delete('/:groupId', verifyToken, checkGroupAdmin, deleteGroup);

router.post(
  '/:groupId/addMember',
  verifyToken,
  checkGroupAdmin,
  addMemberToGroup,
);

router.post('/:groupId/leave', verifyToken, leaveGroup);

router.delete(
  '/:groupId/:userId/remove',
  verifyToken,
  checkGroupAdmin,
  removeUser,
);

module.exports = router;
