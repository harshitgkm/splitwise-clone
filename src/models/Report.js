'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Report.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      Report.belongsTo(models.Group, {
        foreignKey: 'group_id',
      });
    }
  }
  Report.init(
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
      report_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      generated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Report',
      paranoid: true,
      timestamps: true,
    },
  );
  return Report;
};
