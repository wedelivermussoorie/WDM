const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    subsection: { type: String, default: null },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    mrp: { type: Number, default: null },
    unit: { type: String, default: null },
    rating: { type: Number, default: null },
    imageUrl: { type: String, required: true },
    badge: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
