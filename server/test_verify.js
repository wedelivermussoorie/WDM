const http = require('http');

const data = JSON.stringify({
  razorpay_order_id: "order_xyz",
  razorpay_payment_id: "pay_xyz",
  razorpay_signature: "invalid",
  items: [],
  totalAmount: 100,
  shippingAddress: {
    street: "123",
    city: "City",
    state: "State",
    pincode: "12345"
  }
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/orders/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(`Status: ${res.statusCode}\nBody: ${body}`));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
