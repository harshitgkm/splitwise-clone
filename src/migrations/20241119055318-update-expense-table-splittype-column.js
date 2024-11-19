'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('expenses', 'split_type', {
      type: Sequelize.ENUM,
      values: ['EQUALLY', 'PERCENTAGE', 'SHARES', 'UNEQUAL'],
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('expenses', 'split_type', {
      type: Sequelize.ENUM,
      values: ['EQUALLY', 'PERCENTAGE', 'SHARES'],
      allowNull: false,
    });
  },
};
