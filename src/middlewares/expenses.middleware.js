const { GroupMember } = require('../models');

const checkUserInGroup = async (req, res, next) => {
  const { groupId } = req.query;
  console.log('group_id', groupId);

  const userInGroup = await GroupMember.findOne({
    where: { user_id: req.user.id, group_id: groupId },
  });

  if (!userInGroup) return res.json({ message: 'User not in this group' });
  next();
};

module.exports = { checkUserInGroup };
