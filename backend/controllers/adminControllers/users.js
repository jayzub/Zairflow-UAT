const { asyncHandler } = require('../../middleware/asyncHandler');
const User = require('../../models/user');
const Store = require('../../models/store');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Authentication functions
exports.login = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.JWT_SECRET || process.env.secret;

    // Check if user exists and password is correct
    if (!user || !bcrypt.compareSync(req.body.password, user.passwordHash)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const token = jwt.sign({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role
    }, secret, { expiresIn: '1d' });

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
        success: true,
        user: user.email,
        token: token
    });
});

exports.register = asyncHandler(async (req, res) => {
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

// Profile management functions
exports.getCurrentUser = asyncHandler(async (req, res) => {
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

exports.updateCurrentUser = asyncHandler(async (req, res) => {
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

exports.changePassword = asyncHandler(async (req, res) => {
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

// Admin: Render create admin page
exports.createAdminPage = asyncHandler(async (req, res) => {
    try {
        res.render('admin/create-admin', { 
            pageTitle: 'Create Admin'
        });
    } catch (error) {
        console.error('Error loading create admin page:', error);
        res.status(500).render('admin/error', { error: 'Failed to load create admin page' });
    }
});

// Admin: Create a new admin user
exports.createAdmin = asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, storeId } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }

        // Create new user
        const userData = {
            firstName,
            lastName,
            email,
            password,
            role: role || 'admin',
            isActive: true
        };

        const user = new User(userData);
        await user.save();

        // If storeId is provided, add user as admin to that store
        if (storeId) {
            const store = await Store.findById(storeId);
            if (store) {
                await Store.findByIdAndUpdate(
                    storeId,
                    { $push: { admins: user._id } }
                );
                
                await User.findByIdAndUpdate(
                    user._id,
                    { $push: { adminStores: storeId } }
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error creating admin user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin user',
            error: error.message
        });
    }
});

// Admin: Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('ownedStores', 'name')
            .populate('adminStores', 'name')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Admin: Get user count
exports.getUserCount = asyncHandler(async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        
        res.status(200).json({
            success: true,
            data: {
                userCount: userCount
            }
        });
    } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user count',
            error: error.message
        });
    }
});

// Admin: Get user details
exports.getUserDetails = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('ownedStores', 'name description')
            .populate('adminStores', 'name description');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

// Admin: Update user
exports.updateUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, isActive } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updateData = {
            firstName,
            lastName,
            email,
            role,
            isActive
        };

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// Admin: Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deletion of platform admin
        if (user.isPlatformAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete platform admin' 
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// Admin: Create store admin
exports.createStoreAdmin = asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, position, department, storeId } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Create new store admin user
        const userData = {
            firstName,
            lastName,
            email,
            password,
            phone,
            role: 'store_admin',
            position: position || 'Store Admin',
            department: department || 'Management',
            isAdmin: false,
            isActive: true,
            isVerified: false
        };
        
        const user = new User(userData);
        const savedUser = await user.save();
        
        // If storeId is provided, add the user as admin to that store
        if (storeId) {
            const store = await Store.findById(storeId);
            
            if (store) {
                // Check if the current user owns this store or is platform admin
                if (store.owner.toString() === req.user._id.toString() || req.user.isPlatformAdmin) {
                    // Add user as admin to the store
                    if (!store.admins.includes(savedUser._id)) {
                        store.admins.push(savedUser._id);
                        await store.save();
                    }
                    
                    // Add store to user's admin stores
                    savedUser.adminStores.push(store._id);
                    await savedUser.save();
                }
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Store admin created successfully',
            data: {
                id: savedUser._id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (error) {
        console.error('Error creating store admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating store admin',
            error: error.message
        });
    }
}); 