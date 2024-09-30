const User = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../logger'); // Import the logger

exports.register = async (req, res) => {
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            logger.warn('User already exists: ', req.body.email);
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password before saving it in the database
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new user instance with the hashed password
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        // Save the new user to the database
        await user.save();

        // Generate a JSON Web Token (JWT) for the new user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Log registration success
        logger.info(`User registered successfully: ${user.email}`);

        // Send the JWT and user information as a response
        res.status(201).json({ message: 'User registered successfully', token, user });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        // Find the user by their email
        const user = await User.findOne({ email: req.body.email });

        // If the user is not found, return an error
        if (!user) {
            logger.warn('Invalid login attempt: ', req.body.email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(req.body.password, user.password);

        // If the passwords do not match, return an error
        if (!isMatch) {
            logger.warn('Invalid password for user: ', user.email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate a JSON Web Token (JWT) for the user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        logger.info(`User logged in successfully: ${user.email}`);

        // Send the JWT as a response
        res.json({ token, user });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        // Retrieve all users from the database
        const users = await User.find({});
        logger.info('Retrieved all users successfully');
        // Send the retrieved users as a response
        res.json(users);
    } catch (error) {
        logger.error('Error retrieving users:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        // Retrieve the user with the given ID from the database
        const user = await User.findById(req.params.id);

        // If the user is not found, return an error
        if (!user) {
            logger.warn(`User not found: ${req.params.id}`);
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User retrieved: ${user.email}`);
        // Send the retrieved user as a response
        res.json(user);
    } catch (error) {
        logger.error('Error retrieving user by ID:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        // Retrieve the user with the given ID from the database
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // If the user is not found, return an error
        if (!user) {
            logger.warn(`User not found for update: ${req.params.id}`);
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User updated: ${user.email}`);
        // Send the updated user as a response
        res.json(user);
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        // Retrieve the user with the given ID from the database
        const user = await User.findByIdAndDelete(req.params.id);

        // If the user is not found, return an error
        if (!user) {
            logger.warn(`User not found for deletion: ${req.params.id}`);
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User deleted successfully: ${user.email}`);
        // Send a success message as a response
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        // Retrieve the user with the given ID from the database
        const user = await User.findById(req.params.id);

        // If the user is not found, return an error
        if (!user) {
            logger.warn(`User not found for password change: ${req.params.id}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash the new password before updating it in the database
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        logger.info(`Password updated successfully for user: ${user.email}`);
        // Send a success message as a response
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        logger.error('Error changing password:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const blacklist = []; // You can replace this with a Redis store for production

exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');

        // Blacklist the token
        blacklist.push(token);
        logger.info(`User logged out and token blacklisted: ${token}`);

        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Error during logout:', error);
        return res.status(500).json({ error: 'Server error during logout' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`Forgot password attempt: user not found with email: ${email}`);
            return res.status(404).json({ message: 'User not found with that email' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash the token using bcrypt before storing it in the database
        const saltRounds = 10;
        const hashedResetToken = await bcrypt.hash(resetToken, saltRounds);

        // Store the hashed token and set token expiration time (e.g., 1 hour)
        user.resetPasswordToken = hashedResetToken;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

        // Save the updated user to the database
        await user.save();

        logger.info(`Password reset token generated successfully for: ${user.email}`);
        // For now, return the reset token in the response (you can email this later)
        res.json({
            message: 'Password reset token generated successfully',
            resetToken, // You wouldn't normally return this in a production app
        });
    } catch (error) {
        logger.error('Error generating password reset token:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // Verify the reset token and expiration time
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            logger.warn('Invalid or expired reset token');
            return res.status(404).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password before updating it in the database
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        logger.info(`Password reset successfully for user: ${user.email}`);
        // Send a success message as a response
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Error resetting password:', error);
        res.status(500).send({ message: 'Password not changed successfully' });
    }
};

// Middleware to check if a token is blacklisted
exports.isTokenBlacklisted = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (blacklist.includes(token)) {
        logger.warn('Token is blacklisted: ', token);
        return res.status(401).json({ error: 'Token is blacklisted' });
    }
    next();
};

// Middleware to check if a user is authenticated
exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);

        if (!user) {
            logger.warn('User not authenticated');
            return res.status(401).json({ error: 'User not authenticated' });
        }

        req.user = user;
        logger.info(`User authenticated: ${user.email}`);
        next();
    } catch (error) {
        logger.error('Token is invalid:', error);
        return res.status(401).json({ error: 'Token is invalid' });
    }
};
