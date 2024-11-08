'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GroupMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GroupMember.belongsTo(models.User, { foreignKey: 'user_id' });
      GroupMember.belongsTo(models.Group, { foreignKey: 'group_id' });
    }
  }
  GroupMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      joined_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'GroupMember',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  );
  return GroupMember;
};
