const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });

module.exports = {
  development: {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    username: process.env.DB_USERNAME,
    password: `${process.env.DB_PASSWORD}`,
    database: process.env.DB_DATABASE,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  },
  test: {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    username: process.env.DB_USERNAME,
    password: `${process.env.DB_PASSWORD}`,
    database: process.env.TEST_DATABASE,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  },
};
