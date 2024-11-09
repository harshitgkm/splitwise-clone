const express = require('express');
const { sequelize } = require('./models');
const app = express();
const { registerRoutes } = require('./routes');

app.use(express.json());
registerRoutes(app);

const PORT = process.env.PORT || 3000;

const startServer = async function () {
  try {
    await sequelize.authenticate();
    console.log('Db Connected Successfully!');
  } catch (err) {
    console.log('Error runing server', err);
  }
};

startServer();

app.listen(PORT, () => {
  console.log(`server listening on port : ${PORT}`);
});
