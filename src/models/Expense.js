'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Expense.belongsTo(models.Group, {
        foreignKey: 'group_id',
      });
      Expense.belongsTo(models.User, {
        foreignKey: 'payer_id',
      });
      Expense.hasMany(models.ExpenseSplit, {
        foreignKey: 'expense_id',
      });
      Expense.hasMany(models.Comment, {
        foreignKey: 'expense_id',
      });
    }
  }
  Expense.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
      },
      payer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      description: DataTypes.STRING,
      split_type: {
        type: DataTypes.ENUM('EQUALLY', 'UNEQUAL', 'PERCENTAGE', 'SHARES'),
        allowNull: false,
      },
      expense_image_url: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Expense',
      paranoid: true,
      timestamps: true,
    },
  );
  return Expense;
};
