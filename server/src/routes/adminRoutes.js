const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

console.log("adminRoutes file loaded");

router.get("/test", (req, res) => {
  res.send("Admin route works");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPasswordHash || !jwtSecret) {
      return res.status(500).json({
        message: "Admin environment variables are missing",
      });
    }

    if (email !== adminEmail) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      adminPasswordHash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        email: adminEmail,
        role: "admin",
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.log("Admin login error:", error.message);

    res.status(500).json({
      message: "Server error during admin login",
      error: error.message,
    });
  }
});

module.exports = router;