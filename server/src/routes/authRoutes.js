const express = require("express");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserAddresses,
  verifyOtp,
  resendVerificationEmail,
  verifyAge,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-verification", resendVerificationEmail);
router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);
router.put("/me/addresses", protect, updateCurrentUserAddresses);
router.post("/me/verify-age", protect, verifyAge);

module.exports = router;
