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

router.post('/:id/leave', verifyToken, leaveGroup, leaveGroupSerializer);

router.delete(
  '/:id/users/:userId',
  verifyToken,
  checkGroupAdmin,
  removeUser,
  removeUserSerializer,
);

// router.get(
//   '/:groupId/payments',
//   verifyToken,
//   getAllPaymentsForGroup,
//   getAllPaymentsForGroupSerializer,
// );

module.exports = router;
