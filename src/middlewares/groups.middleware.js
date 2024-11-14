const { GroupMember } = require('../models');

const checkGroupAdmin = async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;

  try {
    const groupMember = await GroupMember.findOne({
      where: {
        user_id: userId,
        group_id: groupId,
        is_admin: true,
      },
    });

    if (!groupMember) {
      return res.status(403).json({
        message: 'Access denied. Only group admin can perform this action.',
      });
    }

    next();
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = { checkGroupAdmin };
