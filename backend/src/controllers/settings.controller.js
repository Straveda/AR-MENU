import bcrypt from 'bcryptjs';
import { Restaurant } from '../models/restaurant.models.js';
import { User } from '../models/user.models.js';

export const getRestaurantProfile = async (req, res) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      // For Super Admin, return the user profile directly
      const user = await User.findById(req.user._id).select('-password');
      return res.status(200).json({
        success: true,
        data: user,
      });
    }

    const restaurantId = req.restaurant._id;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const updateRestaurantProfile = async (req, res) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      const { username, email, phone } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (username) user.username = username;
      // Note: Changing email might require re-verification or check for uniqueness depending on system rules
      // For now allowing direct update as per simple requirement
      if (email) user.email = email;
      if (phone) user.phone = phone;

      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse
      });
    }

    const { name, address, contactEmail, contactPhone, logo, openingTime, closingTime } = req.body;
    const restaurantId = req.restaurant._id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (name) restaurant.name = name;
    if (address) restaurant.address = address;
    if (contactEmail) restaurant.contactEmail = contactEmail;
    if (contactPhone) restaurant.contactPhone = contactPhone;
    if (logo !== undefined) restaurant.logo = logo;
    if (openingTime !== undefined) restaurant.openingTime = openingTime;
    if (closingTime !== undefined) restaurant.closingTime = closingTime;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant profile updated successfully',
      data: restaurant,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
