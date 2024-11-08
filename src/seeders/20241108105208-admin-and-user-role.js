'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.bulkInsert(
      'roles',
      [
        {
          name: 'admin',
        },
        {
          name: 'user',
        },
      ],
      { returning: ['id'] },
    );
    const [users] = await queryInterface.bulkInsert(
      'users',
      [
        {
          username: 'Harshit123',
          email: 'harshit123@gmail.com',
        },
      ],
      { returning: ['id'] },
    );

    await queryInterface.bulkInsert('users_roles', [
      {
        user_id: users.id,
        role_id: roles.id,
      },
    ]);
  },

  async down() {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
