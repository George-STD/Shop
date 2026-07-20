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

// Clear DB collections between tests (actually after all tests in the file)
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});



// Stop server and disconnect after all tests
afterAll(async () => {
  await mongoose.disconnect();
});
