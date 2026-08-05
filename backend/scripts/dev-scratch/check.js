require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const Product = require('./models/Product.js');
  
  const ids = [
    '6a5a0465aa51a08b0937e88d',
    '6a5cbc76aa51a08b09385fb1',
    '6a5f8609370ca6db505490f0',
    '6a689e191160876a3e471238'
  ];
  
  const products = await Product.find({ _id: { $in: ids } }, 'name price oldPrice discount boxDiscount');
  console.log(products);
  process.exit(0);
}

run();
