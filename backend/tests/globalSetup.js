const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_must_be_at_least_32_chars_long_for_security';
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.MONGO_URI = instance.getUri();
};

