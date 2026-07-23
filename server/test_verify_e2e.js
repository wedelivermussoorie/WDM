const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const crypto = require('crypto');
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });

  const user = await User.findOne();
  if (!user) { console.log("No user found"); return; }
  
  const product = await Product.findOne({ quantity: { $gt: 0 } });
  if (!product) { console.log("No available product"); return; }
  
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log("Generated token for user:", user._id.toString());

  // Generate a valid signature for the test
  const razorpay_order_id = "order_test123";
  const razorpay_payment_id = "pay_test123";
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const razorpay_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

  const data = JSON.stringify({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items: [{
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.imageUrl
    }],
    totalAmount: product.price,
    shippingAddress: {
      street: "123 Test St",
      city: "Mussoorie",
      state: "Uttarakhand",
      pincode: "248179"
    }
  });

  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}\nBody: ${body}`);
      mongoose.disconnect();
    });
  });

  req.on('error', error => { console.error(error); mongoose.disconnect(); });
  req.write(data);
  req.end();
}

runTest();
