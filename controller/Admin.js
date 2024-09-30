const Admin = require('../model/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../logger'); // Import the logger

exports.register = async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({ email: req.body.email }); // Correctly check for existing admin
        if (existingAdmin) {
            logger.warn(`Admin registration attempt with existing email: ${req.body.email}`);
            return res.status(400).json({ error: 'Admin already exists' });
        }

        // Hash the password before saving it in the database
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new admin instance with the hashed password
        const admin = new Admin({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        // Save the admin in the database
        await admin.save();

        // Generate and send a JWT token with the admin's ID
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        logger.info(`Admin registered successfully: ${admin.email}`);
        res.json({ token });
    } catch (error) {
        logger.error('Error registering admin:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.login = async (req, res) => {
    try {
        // Find the admin by their email
        const admin = await Admin.findOne({ email: req.body.email });

        // Check if the admin exists and if their password matches the hashed version in the database
        if (!admin || !(await bcrypt.compare(req.body.password, admin.password))) {
            logger.warn(`Failed login attempt for email: ${req.body.email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate and send a JWT token with the admin's ID
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        logger.info(`Admin logged in successfully: ${admin.email}`);
        res.json({ token });
    } catch (error) {
        logger.error('Error logging in admin:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.protect = async (req, res, next) => {
    try {
        // Check if the token is provided in the request headers
        const token = req.headers.authorization?.split(' ')[1];

        // Verify the token using the secret key
        if (!token) {
            logger.warn('Token not provided');
            return res.status(401).json({ error: 'Token not provided' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // If the token is valid, attach the admin's ID to the request object
        req.user = payload.id;
        next();
    } catch (error) {
        logger.error('Invalid token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

exports.adminOnly = async (req, res, next) => {
    try {
        // Check if the user has the 'admin' role
        const admin = await Admin.findById(req.user);

        if (!admin || admin.role !== 'admin') {
            logger.warn('Unauthorized access attempt by user: ' + req.user);
            return res.status(403).json({ error: 'Unauthorized' });
        }

        next();
    } catch (error) {
        logger.error('Error checking admin access:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.superadminOnly = async (req, res, next) => {
    try {
        // Check if the user has the 'superadmin' role
        const admin = await Admin.findById(req.user);

        if (!admin || (admin.role !== 'superadmin' && admin.role !== 'admin')) {
            logger.warn('Unauthorized access attempt by user: ' + req.user);
            return res.status(403).json({ error: 'Unauthorized' });
        }

        next();
    } catch (error) {
        logger.error('Error checking superadmin access:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getAdmin = async (req, res) => {
    try {
        // Retrieve all admin users from the database
        const admins = await Admin.find();
        logger.info('Retrieved admin users successfully');
        res.json(admins);
    } catch (error) {
        logger.error('Error retrieving admins:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getAdminById = async (req, res) => {
    try {
        // Retrieve the admin user with the given ID from the database
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            logger.warn(`Admin not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Admin not found' });
        }

        logger.info(`Retrieved admin: ${admin.email}`);
        res.json(admin);
    } catch (error) {
        logger.error('Error retrieving admin by ID:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.updateAdmin = async (req, res) => {
    try {
        // Find the admin user with the given ID in the database
        const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!admin) {
            logger.warn(`Admin not found for update: ${req.params.id}`);
            return res.status(404).json({ error: 'Admin not found' });
        }

        logger.info(`Admin updated successfully: ${admin.email}`);
        res.json(admin);
    } catch (error) {
        logger.error('Error updating admin:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteAdmin = async (req, res) => {
    try {
        // Find the admin user with the given ID in the database
        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            logger.warn(`Admin not found for deletion: ${req.params.id}`);
            return res.status(404).json({ error: 'Admin not found' });
        }

        logger.info(`Admin deleted successfully: ${admin.email}`);
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        logger.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        // Find the admin user by their email
        const admin = await Admin.findOne({ email: req.body.email });

        if (!admin) {
            logger.warn(`Forgot password attempt for non-existing email: ${req.body.email}`);
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Generate a random token for password reset
        const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // Update the admin's resetPasswordToken and resetPasswordExpires field
        admin.resetPasswordToken = resetToken;
        admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await admin.save();

        // Send a password reset email to the admin's email
        // (replace this with your own email sending logic)
        logger.info(`Password reset token generated for admin: ${admin.email}`);
        console.log(`Password reset token: ${resetToken}`);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Error in forgot password:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        // Verify the reset password token and its expiration
        const resetPasswordToken = req.body.token;
        const admin = await Admin.findOne({ resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } });

        if (!admin) {
            logger.warn('Invalid or expired reset password token');
            return res.status(400).json({ error: 'Invalid or expired reset password token' });
        }

        // Hash the new password and update the admin's password and resetPassword fields
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        admin.password = hashedPassword;
        admin.resetPasswordToken = null;
        admin.resetPasswordExpires = null;

        await admin.save();
        logger.info(`Password reset successfully for admin: ${admin.email}`);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Error resetting password:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.changePassword = async (req, res) => {
    try {
        // Check if the user has the 'admin' role
        const admin = await Admin.findById(req.user);

        if (!admin || admin.role !== 'admin') {
            logger.warn('Unauthorized password change attempt by user: ' + req.user);
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(req.body.currentPassword, admin.password);

        if (!isMatch) {
            logger.warn('Incorrect current password attempt for admin: ' + admin.email);
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Hash the new password and update the admin's password
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        admin.password = hashedPassword;

        await admin.save();
        logger.info(`Password changed successfully for admin: ${admin.email}`);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Error changing password:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
