import User from "../models/User.js";
import pkg from "jsonwebtoken";
import { compare } from "bcryptjs";

const { sign } = pkg;

export async function register(req, res) {
  try {
    const { name, email, password,role } = req.body;
    const user = new User({ name, email, password,role });
    await user.save();
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Check for NoSQL injection attempts
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: "Invalid input format" });
    }
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    
    // Now we can safely compare passwords since user exists
    const isMatch = await compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    
    const token = sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );
    
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}