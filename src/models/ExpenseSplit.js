'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ExpenseSplit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ExpenseSplit.belongsTo(models.Expense, {
        foreignKey: 'expense_id',
      });
      ExpenseSplit.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }
  ExpenseSplit.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      expense_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Expense',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      split_ratio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      amount_owed: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'ExpenseSplit',
      timestamps: true,
      paranoid: true,
    },
  );
  return ExpenseSplit;
};
