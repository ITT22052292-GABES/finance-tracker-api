import User from '../models/User.js';


/**
 * Get all users (admin only)
 */
/**
 * Get all users (admin only)
 */
export async function getAllUsers(req, res) {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({}).select('-password');
    
    // Return the users as an array
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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