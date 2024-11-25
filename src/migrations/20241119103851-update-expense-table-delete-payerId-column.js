'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('expenses', 'payer_id');
  },

  async down(queryInterface, Sequelize) {
    // re-adding the payer_id column, in case need to roll back this migration.
    await queryInterface.addColumn('expenses', 'payer_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    });
  },
};
