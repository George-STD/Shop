const mongoose = require('mongoose');

// Start MongoMemoryServer before all tests
beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI;

  // If already connected, disconnect first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear DB and disconnect after all tests in the file
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.dropDatabase();
      } catch (err) {
        // ignore if already dropped or closed
      }
    }
    await mongoose.disconnect();
  }
});
