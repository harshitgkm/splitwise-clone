'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('friend_list', 'user_id', 'user_id');
    await queryInterface.renameColumn('friend_list', 'friend_id', 'friend_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('friend_list', 'user_id', 'user_id');
    await queryInterface.renameColumn('friend_list', 'friend_id', 'friend_id');
  },
};
