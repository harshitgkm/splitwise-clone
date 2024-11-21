'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'expense_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'expenses',
        key: 'id',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('payments', 'expense_id');
  },
};
