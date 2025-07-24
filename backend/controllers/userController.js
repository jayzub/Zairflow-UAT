const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * Admin user login
 */
const login = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.JWT_SECRET || process.env.secret;

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'User with given email not found'
        });
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role
        }, secret, { expiresIn: '1d' });

        // Set JWT as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // only send over HTTPS in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return res.status(200).json({
            success: true,
            user: user.email,
            token: token
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'Password mismatch'
        });
    }
});

/**
 * Register a new admin user
 */
const register = asyncHandler(async (req, res) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        role: req.body.role || 'store_owner',
        position: req.body.position,
        department: req.body.department,
        isAdmin: req.body.isAdmin || false
    });

    const savedUser = await user.save();

    if (!savedUser) {
        return res.status(500).json({
            success: false,
            message: 'User cannot be created'
        });
    }

    // Remove password hash from response
    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User registered successfully'
    });
});

/**
 * Get all users (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }

    res.json({
        success: true,
        data: userList
    });
});

/**
 * Get user by ID (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'The user with the given ID does not exist'
        });
    }

    res.json({
        success: true,
        data: user
    });
});

/**
 * Delete user (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

/**
 * Get total user count (Admin only)
 */
const getUserCount = asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments();

    res.json({
        success: true,
        data: {
            userCount: userCount
        }
    });
});

/**
 * Update user (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
    const { name, email, phone, role, position, department, isAdmin, isActive } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
    });
});

/**
 * Get current user profile
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-passwordHash')
        .populate('ownedStores', 'name slug')
        .populate('adminStores', 'name slug');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        data: user
    });
});

/**
 * Update current user profile
 */
const updateCurrentUser = asyncHandler(async (req, res) => {
    const { name, phone, position, department, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
    });
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Current password and new password are required'
        });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Update password
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    login,
    register,
    getAllUsers,
    getUserById,
    deleteUser,
    getUserCount,
    updateUser,
    getCurrentUser,
    updateCurrentUser,
    changePassword
}; 