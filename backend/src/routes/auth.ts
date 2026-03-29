import { Router } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

// In-memory OTP storage for demo/MVP
// In production, use Redis or a dedicated collection with TTL
const otpStore = new Map<string, { code: string, expires: number }>();

// Step 1: Login with Email/Password & Generate OTP
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // LOG THE OTP (Since we don't have a real mailer configured yet)
    console.log(`\n--- [OTP for ${email}] ---\nCODE: ${otp}\n---------------------------\n`);

    // In a real app, you would use a service like Resend/SendGrid here:
    // await sendOTPEmail(email, otp);

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

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }

    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    if (storedData.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
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
