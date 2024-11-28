const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  deleteGroup,
  updateGroup,
  addMemberToGroup,
  getGroupMembers,
  leaveGroup,
  removeUser,
  sendGroupInvite,
} = require('../controllers/groups.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const { checkGroupAdmin } = require('../middlewares/groups.middleware.js');

const upload = require('../middlewares/multer.middleware.js');

const {
  createGroupValidator,
  updateGroupValidator,
} = require('../validators/groups.validator');

const {
  createGroupSerializer,
  getGroupsSerializer,
  updateGroupSerializer,
  deleteGroupSerializer,
  addMemberToGroupSerializer,
  getAllMembersSerializer,
  leaveGroupSerializer,
  removeUserSerializer,
} = require('../serializers/groups.serializer.js');

router.post(
  '/',
  createGroupValidator,
  verifyToken,
  createGroup,
  createGroupSerializer,
);

router.get('/', verifyToken, getGroups, getGroupsSerializer);

router.put(
  '/:id',
  updateGroupValidator,
  verifyToken,
  checkGroupAdmin,
  upload.single('group_profile_url'),
  updateGroup,
  updateGroupSerializer,
);

router.delete(
  '/:id',
  verifyToken,
  checkGroupAdmin,
  deleteGroup,
  deleteGroupSerializer,
);

router.post(
  '/:id/add-member',
  verifyToken,
  checkGroupAdmin,
  addMemberToGroup,
  addMemberToGroupSerializer,
);

router.delete('/:id/leave', verifyToken, leaveGroup, leaveGroupSerializer);

router.get(
  '/:id/members',
  verifyToken,
  getGroupMembers,
  getAllMembersSerializer,
);

router.delete(
  '/:id/members/:userId',
  verifyToken,
  checkGroupAdmin,
  removeUser,
  removeUserSerializer,
);

router.post('/:id/invite', verifyToken, checkGroupAdmin, sendGroupInvite);

module.exports = router;
