const Razorpay = require("razorpay");
try {
  const razorpay = new Razorpay({
    key_id: "rzp_test_T6CbEXWqt5AxZR",
    key_secret: undefined,
  });
  razorpay.orders.create({ amount: 100, currency: "INR" })
    .then(order => console.log("Order created:", order))
    .catch(err => console.log("Razorpay SDK Error:", err));
} catch (e) {
  console.log("Sync Error:", e.message);
}
