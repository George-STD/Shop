const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.MONGO_URI = instance.getUri();
};
