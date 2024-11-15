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
  getAllPaymentsForGroup,
} = require('../controllers/groups.controller.js');

const { verifyToken } = require('../middlewares/auth.middleware.js');

const { checkGroupAdmin } = require('../middlewares/groups.middleware.js');
const upload = require('../middlewares/multer.middleware.js');

const {
  createGroupValidator,
  updateGroupValidator,
} = require('../validators/groups.validator');

router.post('/', createGroupValidator, verifyToken, createGroup);

router.get('/', verifyToken, getGroups);

router.put(
  '/:groupId',
  updateGroupValidator,
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

router.get('/:groupId/payments', verifyToken, getAllPaymentsForGroup);

module.exports = router;
