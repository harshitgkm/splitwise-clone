'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('friend_list', 'friend_one', 'user_id');
    await queryInterface.renameColumn('friend_list', 'friend_two', 'friend_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('friend_list', 'user_id', 'friend_one');
    await queryInterface.renameColumn('friend_list', 'friend_id', 'friend_two');
  },
};
