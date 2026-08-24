/**
 * Standalone Index Synchronization Job
 * Builds and synchronizes all Mongoose model indexes safely outside the request loop.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { buildConnectOptions } = require('../config/mongo');

// Require all models to register schemas
require('../models/User');
require('../models/Product');
require('../models/Order');
require('../models/Category');
require('../models/Review');
require('../models/ReviewVote');
require('../models/LoyaltyLedger');
require('../models/OrderDailyStats');
require('../models/Occasion');
require('../models/Settings');
require('../models/AuditLog');
require('../models/AiChatSession');
require('../models/ReceivedEmail');

const syncAllIndexes = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB for index synchronization...');
  await mongoose.connect(uri, buildConnectOptions());

  const modelNames = mongoose.modelNames();
  console.log(`📋 Found ${modelNames.length} registered models. Synchronizing indexes...`);

  for (const modelName of modelNames) {
    const Model = mongoose.model(modelName);
    try {
      console.log(`🔨 Syncing indexes for [${modelName}]...`);
      await Model.syncIndexes();
      console.log(`✅ [${modelName}] indexes synchronized successfully.`);
    } catch (err) {
      console.error(`❌ Error syncing indexes for [${modelName}]:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('🎉 Index synchronization complete.');
  process.exit(0);
};

syncAllIndexes().catch((err) => {
  console.error('Fatal error during index sync:', err);
  process.exit(1);
});
