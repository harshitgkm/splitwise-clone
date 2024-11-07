const dotenv = require('dotenv');
dotenv.config();
//require('dotenv').config();

//console.log("DB Password:", typeof process.env.DB_PASSWORD); 

module.exports = {
  development: {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  // You can add configurations for test and production environments as needed
};