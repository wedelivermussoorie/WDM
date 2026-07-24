const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── DASHBOARD STATS ────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ─── USER MANAGEMENT ────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/users/:id/toggle-admin", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own admin status" });
    }
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ message: `User ${user.isAdmin ? "promoted to" : "removed from"} admin`, user });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── PRODUCT MANAGEMENT ─────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { id, name, category, subsection, price, quantity, mrp, unit, imageUrl, badge } = req.body;
    if (!id || !name || !category || !price || quantity === undefined || !imageUrl) {
      return res.status(400).json({ message: "id, name, category, price, quantity, imageUrl are required" });
    }
    const existing = await Product.findOne({ id });
    if (existing) return res.status(409).json({ message: "Product ID already exists" });

    const product = await Product.create({ id, name, category, subsection: subsection || null, price, quantity, mrp, unit, imageUrl, badge });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── ORDER MANAGEMENT ───────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email phone");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Send Delivery Email if status is changed to Delivered
    if (status === "Delivered" && order.user) {
      const { sendDeliveryEmail } = require("../utils/emailTemplates");
      sendDeliveryEmail(order.user, order).catch((err) => {
        console.error("Failed to send delivery email:", err);
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
