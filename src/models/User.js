'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'user_id',
      });
      User.belongsToMany(models.Group, {
        through: models.GroupMember,
        foreignKey: 'user_id',
      });
      User.hasMany(models.ExpenseSplit, {
        foreignKey: 'user_id',
      });
      User.hasMany(models.Comment, {
        foreignKey: 'user_id',
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      profile_picture_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'User',
      timestamps: true,
    },
  );
  return User;
};
