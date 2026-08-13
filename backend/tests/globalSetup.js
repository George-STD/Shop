const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_must_be_at_least_32_chars_long_for_security';
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_dummy_gemini_api_key_for_unit_tests';
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.MONGO_URI = instance.getUri();
};

