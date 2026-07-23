require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME }).then(async () => {
  const count = await Product.countDocuments();
  console.log('Total products:', count);
  
  const samples = await Product.find().select('id name category').limit(10);
  console.log('Sample products:', JSON.stringify(samples, null, 2));
  
  mongoose.disconnect();
}).catch(console.error);
