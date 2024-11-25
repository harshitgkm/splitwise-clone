'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('payments', 'group_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'group_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    });
  },
};
