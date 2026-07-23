const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// ─── In-memory OTP store (email → { name, email, phone, password, otp, expiresAt }) ───
// User data is NOT saved to DB until OTP is verified.
const pendingRegistrations = new Map();

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    isAdultVerified: user.isAdultVerified,
    addresses: user.addresses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(name, email, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
      <p style="font-size: 16px; color: #555;">Hi ${name},</p>
      <p style="font-size: 16px; color: #555;">Thank you for registering with <strong>We Deliver Mussoorie</strong>! Your 6-digit email verification code is:</p>
      <div style="background-color: #f59e0b; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">This code will expire in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Your Email Verification Code – We Deliver Mussoorie",
    html,
  });
}

function sendAuthResponse(res, statusCode, message, user) {
  res.status(statusCode).json({
    message,
    token: generateToken(user._id.toString()),
    user: sanitizeUser(user),
  });
}

// ─── REGISTER ───────────────────────────────────────────────
// Validates input, stores data in-memory, sends OTP.
// Does NOT save user to DB yet.
async function registerUser(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone ? phone.trim() : "";

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Check if email already exists in DB (fully registered users)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Generate OTP and store pending registration in memory
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations.set(normalizedEmail, {
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      password, // plain-text; will be hashed by User model pre-save hook on DB save
      otp,
      expiresAt,
    });

    // Send OTP email
    try {
      await sendVerificationEmail(trimmedName, normalizedEmail, otp);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      pendingRegistrations.delete(normalizedEmail);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(200).json({
      message: "Verification code sent to your email. Please enter the OTP to complete registration.",
    });
  } catch (error) {
    if (error.name === "MongoServerError" && error.codeName === "Unauthorized") {
      return res.status(500).json({ message: "Database authorization failed" });
    }

    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to register user",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

// ─── VERIFY OTP ─────────────────────────────────────────────
// Validates OTP against in-memory store, THEN saves user to DB.
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Check pending registration first (new unverified signups) ---
    const pending = pendingRegistrations.get(normalizedEmail);
    if (pending) {
      if (Date.now() > pending.expiresAt) {
        pendingRegistrations.delete(normalizedEmail);
        return res.status(400).json({ message: "OTP has expired. Please register again." });
      }

      if (pending.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid OTP. Please try again." });
      }

      // OTP is correct — create the user in DB now
      const user = await User.create({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        password: pending.password,
        isVerified: true,
      });

      pendingRegistrations.delete(normalizedEmail);

      return res.status(201).json({
        message: "Email verified successfully! Your account has been created.",
        token: generateToken(user._id.toString()),
        user: sanitizeUser(user),
      });
    }

    // --- Fallback: handle legacy users already in DB but not yet verified ---
    const user = await User.findOne({
      email: normalizedEmail,
      verificationOtp: otp.trim(),
      verificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    return res.json({
      message: "Email verified successfully",
      token: generateToken(user._id.toString()),
      user: sanitizeUser(user),
    });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to verify email",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

// ─── RESEND OTP ─────────────────────────────────────────────
async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check pending registrations first
    const pending = pendingRegistrations.get(normalizedEmail);
    if (pending) {
      const otp = generateOtp();
      pending.otp = otp;
      pending.expiresAt = Date.now() + 10 * 60 * 1000;
      pendingRegistrations.set(normalizedEmail, pending);

      await sendVerificationEmail(pending.name, normalizedEmail, otp);
      return res.json({ message: "Verification code resent successfully" });
    }

    // Fallback: legacy users already in DB
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "No pending registration found for this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = generateOtp();
    user.verificationOtp = otp;
    user.verificationOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.name, normalizedEmail, otp);
    return res.json({ message: "Verification code resent successfully" });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to resend verification code",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

// ─── LOGIN ──────────────────────────────────────────────────
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email to log in", unverified: true });
    }

    sendAuthResponse(res, 200, "Login successful", user);
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to login user",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

function getCurrentUser(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

async function updateCurrentUser(req, res) {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters long" });
      }
      user.name = trimmedName;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(409).json({ message: "Email is already in use" });
        }
        user.email = normalizedEmail;
      }
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    const wantsPasswordChange = Boolean(currentPassword || newPassword);
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      user.password = newPassword;
    }

    await user.save();
    res.json({ message: "Account updated successfully", user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to update account",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

async function updateCurrentUserAddresses(req, res) {
  try {
    const { billing, shipping } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (billing === null) {
      user.addresses = user.addresses || {};
      user.addresses.billing = undefined;
    } else if (billing && typeof billing === "object") {
      user.addresses = user.addresses || {};
      user.addresses.billing = billing;
    }

    if (shipping === null) {
      user.addresses = user.addresses || {};
      user.addresses.shipping = undefined;
    } else if (shipping && typeof shipping === "object") {
      user.addresses = user.addresses || {};
      user.addresses.shipping = shipping;
    }

    await user.save();
    res.json({ message: "Addresses updated successfully", user: sanitizeUser(user) });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to update addresses",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

// ─── VERIFY AGE ───────────────────────────────────────────────
async function verifyAge(req, res) {
  try {
    const user = req.user;
    user.isAdultVerified = true;
    await user.save();
    res.json({ message: "Age verified successfully", user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify age", error: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserAddresses,
  verifyOtp,
  resendVerificationEmail,
  verifyAge,
};
