import User from '../models/User.js';


export async function getAllUsers(req, res) {
  try {
    
    const users = await User.find({}, 'name email createdAt');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
}


export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, 'name email createdAt');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user details", error: error.message });
  }
}