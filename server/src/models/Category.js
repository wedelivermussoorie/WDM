const mongoose = require("mongoose");

const subsectionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  image: { type: String },
});

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    icon: { type: String },
    image: { type: String },
    subsections: [subsectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
