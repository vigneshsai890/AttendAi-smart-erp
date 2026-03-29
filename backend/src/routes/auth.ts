import { Router } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

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

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: false // Legacy flag
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
