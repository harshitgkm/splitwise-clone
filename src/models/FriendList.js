'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FriendList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      FriendList.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user_id_details',
      });
      FriendList.belongsTo(models.User, {
        foreignKey: 'friend_id',
        as: 'friend_id_details',
      });
    }
  }
  FriendList.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      friend_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      paranoid: true,
      tableName: 'friend_list',
      modelName: 'FriendList',
    },
  );
  return FriendList;
};
