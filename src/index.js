const express = require('express');
const { sequelize } = require('./models');
const app = express();
const { registerRoutes } = require('./routes');
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// const swaggerDocument = YAML.load(
//   path.join(__dirname, 'swagger', 'auth.swagger.yaml'),
// );
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// const swaggerDocument = YAML.load('src/swagger/swagger.yaml');
const swaggerMain = YAML.load(path.join(__dirname, 'swagger', 'swagger.yaml'));

// Load the auth and users swagger files
const authSwagger = YAML.load(
  path.join(__dirname, 'swagger', 'auth.swagger.yaml'),
);
const usersSwagger = YAML.load(
  path.join(__dirname, 'swagger', 'users.swagger.yaml'),
);
const groupsSwagger = YAML.load(
  path.join(__dirname, 'swagger', 'groups.swagger.yaml'),
);
const expensesSwagger = YAML.load(
  path.join(__dirname, 'swagger', 'expenses.swagger.yaml'),
);

// Merge the Swagger files manually
const combinedSwagger = {
  ...swaggerMain,
  paths: {
    ...swaggerMain.paths,
    ...authSwagger.paths,
    ...usersSwagger.paths,
    ...groupsSwagger.paths,
    ...expensesSwagger.paths,
  },
  components: {
    ...swaggerMain.components,
    ...authSwagger.components,
    ...usersSwagger.components,
    ...groupsSwagger.components,
    ...expensesSwagger.components,
  },
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(combinedSwagger));

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
