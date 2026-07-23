const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

// Force IPv4 resolution globally to fix Render IPv6 ENETUNREACH errors (e.g. for Gmail SMTP)
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
const apiLimiter = require("./middleware/ratelimiter.js");
const { connectMongo } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const Product = require("./models/Product");
const Category = require("./models/Category");
const Order = require("./models/Order");
const { protect } = require("./middleware/authMiddleware");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration (explicit origin required in production)
// CLIENT_URL can be a single URL or comma-separated list of allowed origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((u) => u.trim()).filter(Boolean)
  : [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Return a JSON-friendly error so the client never receives unparseable HTML
        callback(new Error(`CORS: Origin '${origin}' is not allowed`));
      }
    },
  })
);
// Ensure CORS errors are returned as JSON, not HTML
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});
app.use(express.json());

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PORT = process.env.PORT || 5000;

/**
 * Atomically decrements stock for a list of order items.
 * Uses a single findOneAndUpdate per product with a $gte guard so the
 * check and the decrement happen in one atomic MongoDB operation.
 * On partial failure (one item out of stock), rolls back already-decremented
 * items before returning an error string. Returns null on full success.
 */
async function decrementStockAtomically(items) {
  const decremented = []; // track successes for rollback

  for (let item of items) {
    const updated = await Product.findOneAndUpdate(
      { id: item.productId, quantity: { $gte: item.quantity } }, // atomic guard
      { $inc: { quantity: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      // Product not found OR stock insufficient — roll back previous decrements
      for (let rolled of decremented) {
        await Product.findOneAndUpdate(
          { id: rolled.productId },
          { $inc: { quantity: rolled.quantity } }
        );
      }
      return `Insufficient stock for product: ${item.name}`;
    }

    decremented.push(item);
  }

  return null; // all items decremented successfully
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", apiLimiter, authRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);
app.use("/api/admin", apiLimiter, uploadRoutes);

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { section, category } = req.query;
    let filter = {};

    if (category) filter.category = category;

    if (section === "weekly-discounts") {
      filter.badge = { $ne: null }; // Any product with a badge
    }

    let query = Product.find(filter);

    if (section === "recently-viewed") {
      query = query.limit(8);
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Order Endpoint (COD)
app.post("/api/orders", protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Atomically reserve stock — eliminates the read-then-write race condition.
    // If any item fails the $gte guard, already-decremented items are rolled back.
    const stockError = await decrementStockAtomically(items);
    if (stockError) {
      return res.status(400).json({ message: stockError });
    }

    // Stock is safely reserved; now persist the order.
    let createdOrder;
    try {
      const order = new Order({
        user: req.user._id,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod: paymentMethod || "COD",
      });
      createdOrder = await order.save();
    } catch (saveError) {
      // Order save failed — restore decremented stock so it isn't permanently lost.
      for (let item of items) {
        await Product.findOneAndUpdate(
          { id: item.productId },
          { $inc: { quantity: item.quantity } }
        );
      }
      throw saveError;
    }

    // Generate Invoice and Send Order Confirmation Email asynchronously
    const { sendOrderConfirmationEmail } = require("./utils/emailTemplates");
    const generateInvoice = require("./utils/generateInvoice");
    
    generateInvoice(createdOrder, req.user).then((invoiceBuffer) => {
      return sendOrderConfirmationEmail(req.user, createdOrder, invoiceBuffer);
    }).catch((err) => {
      console.error("Failed to send order confirmation email with invoice:", err);
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
});

// Razorpay Generate Order ID
app.post("/api/orders/razorpay", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order) return res.status(500).json({ message: "Failed to create Razorpay order" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Razorpay Error", error: error.message });
  }
});

app.get("/api/razorpay/key", protect, (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) return res.status(500).json({ message: "Razorpay key is not configured" });
  res.json({ key: keyId });
});

// Razorpay Verify Signature and Save Order
app.post("/api/orders/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount, shippingAddress } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid payment signature!" });
    }

    // Atomically reserve stock after signature is verified.
    // If stock ran out between payment capture and this point, log it for manual refund.
    const stockError = await decrementStockAtomically(items);
    if (stockError) {
      console.error(
        `[STOCK ERROR] Razorpay payment ${razorpay_payment_id} was captured but stock check failed: ${stockError}`
      );
      return res.status(400).json({
        message: stockError,
        note: "Payment was captured. Please contact support for a refund.",
      });
    }

    // Stock reserved — persist the verified order.
    let createdOrder;
    try {
      const order = new Order({
        user: req.user._id,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod: "Razorpay",
        paymentStatus: "Paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      createdOrder = await order.save();
    } catch (saveError) {
      // Order save failed — restore decremented stock so it isn't permanently lost.
      for (let item of items) {
        await Product.findOneAndUpdate(
          { id: item.productId },
          { $inc: { quantity: item.quantity } }
        );
      }
      throw saveError;
    }

    // Generate Invoice and Send Order Confirmation Email asynchronously
    const { sendOrderConfirmationEmail } = require("./utils/emailTemplates");
    const generateInvoice = require("./utils/generateInvoice");
    
    generateInvoice(createdOrder, req.user).then((invoiceBuffer) => {
      return sendOrderConfirmationEmail(req.user, createdOrder, invoiceBuffer);
    }).catch((err) => {
      console.error("Failed to send order confirmation email with invoice:", err);
    });

    res.status(201).json({ message: "Payment verified successfully", order: createdOrder });
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
});

app.get("/api/orders/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/api/orders/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = String(order.user) === String(req.user._id);
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to load order" });
  }
});

// Serve static files from client/dist
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// SPA fallback: send index.html for any non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Global JSON error handler — catches any unhandled Express errors (multer, cloudinary, etc.)
// and returns JSON so the frontend never receives an HTML error page.
// IMPORTANT: must be the last app.use() before connectMongo()
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "An unexpected error occurred",
  });
});

connectMongo()
  .then(async () => {
    try {
      const User = require("./models/User");
      const adminEmail = "wedelivermussoorie@gmail.com";
      let admin = await User.findOne({ email: adminEmail });
      if (!admin) {
        admin = new User({
          name: "Admin",
          email: adminEmail,
          password: "WDM@13wedeliver",
          isAdmin: true,
          isVerified: true
        });
        await admin.save();
        console.log("Hardcoded Admin account created successfully.");
      } else if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log("Updated existing account to Admin.");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
    }

    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
