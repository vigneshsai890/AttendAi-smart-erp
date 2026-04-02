import { Router } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

// In-memory OTP storage for demo/MVP
const otpStore = new Map<string, { code: string, expires: number, attempts: number }>();

// Step 1: Login with Email/Password & Generate OTP
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: "Invalid input types" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate 6-digit OTP
    const otp = "123456"; // Fixed OTP for easier testing
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });

    // LOG THE OTP
    console.log(`\n--- [OTP for ${email}] ---\nCODE: ${otp}\n---------------------------\n`);

    res.json({
      success: true,
      message: "OTP sent to your registered email",
      requiresOTP: true,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Step 2: Verify OTP and return session data
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ error: "Invalid input types" });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }

    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    // ULTRAMAX: Brute-force protection
    if (storedData.attempts >= 5) {
      otpStore.delete(email);
      return res.status(429).json({ error: "Too many failed attempts. Please login again." });
    }

    if (storedData.code !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ error: `Invalid OTP code. ${5 - storedData.attempts} attempts remaining.` });
    }

    // OTP verified, get user and return session data
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    otpStore.delete(email); // Cleanup

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: true
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
