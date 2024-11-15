'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Group.hasMany(models.GroupMember, {
        foreignKey: 'group_id',
      });

      Group.belongsToMany(models.User, {
        through: models.GroupMember,
        foreignKey: 'group_id',
      });

      Group.hasMany(models.Payment, {
        foreignKey: 'group_id',
      });

      Group.hasMany(models.Expense, {
        foreignKey: 'group_id',
      });
    }
  }
  Group.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      two_user_identifier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'Group',
      tableName: 'groups',
    },
  );
  return Group;
};
