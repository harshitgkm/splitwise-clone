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
        foreignKey: 'friend_one',
        as: 'friend_one_details',
      });
      FriendList.belongsTo(models.User, {
        foreignKey: 'friend_two',
        as: 'friend_two_details',
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
      friend_one: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      friend_two: {
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
