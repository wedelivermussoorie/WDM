require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
  const Product = require('./src/models/Product');
  const count = await Product.countDocuments();
  console.log(`Product count: ${count}`);
  const sample = await Product.findOne();
  console.log('Sample product:', sample);
  mongoose.disconnect();
}
check();
