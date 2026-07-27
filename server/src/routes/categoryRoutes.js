const express = require("express");
const Category = require("../models/Category");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// ─── PUBLIC ROUTES ──────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ id: req.params.id });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ─── ADMIN ROUTES ───────────────────────────────────────────
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { id, title, icon, image, subsections } = req.body;
    if (!id || !title) {
      return res.status(400).json({ message: "ID and title are required" });
    }
    
    const existing = await Category.findOne({ id });
    if (existing) return res.status(409).json({ message: "Category ID already exists" });

    const category = await Category.create({ id, title, icon, image, subsections });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ id: req.params.id });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
