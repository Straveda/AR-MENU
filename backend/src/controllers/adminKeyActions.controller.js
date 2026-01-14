import { User } from '../models/user.models.js';
import bcrypt from 'bcryptjs';


export const changeStaffPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, confirmPassword } = req.body;
    const adminUser = req.user; 

    
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both new password and confirmation are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long',
        });
    }

    
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    

    
    
    if (targetUser.restaurantId?.toString() !== adminUser.restaurantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User belongs to a different restaurant',
      });
    }

    
    
    
    const allowedRoles = ['KDS']; 
    
    
    
    
    
    if (targetUser.role === 'RESTAURANT_ADMIN' || targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'PLATFORM_ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized: Cannot change password for other Admins',
        });
    }

    
    if (targetUser._id.toString() === adminUser._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized: Use profile settings to change your own password',
        });
    }

    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    targetUser.password = hashedPassword;
    await targetUser.save();

    
    console.log(`[AUDIT] Admin ${adminUser._id} changed password for User ${targetUser._id} at Restaurant ${adminUser.restaurantId}`);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });

  } catch (error) {
    console.error('Change Staff Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
