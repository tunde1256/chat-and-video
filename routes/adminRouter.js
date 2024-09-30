const express = require('express');
const router  = express.Router()


// Import the controllers
const adminController = require('../controller/Admin');

// Define the routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protect routes that require authentication
// router.use(adminController.protect);

// // Admin routes
// router.get('/admin', adminController.getAdmin);
// router.get('/admin/:id', adminController.getAdminById);
// router.put('/admin/:id', adminController.updateAdmin);
// router.delete('/admin/:id', adminController.deleteAdmin);

// // Admin only routes
// router.use(adminController.adminOnly);
// router.post('/admin/updatepassword', adminController.updatePassword);

// // Superadmin only routes
// router.use(adminController.superadminOnly);
// router.post('/admin/forgotpassword', adminController.forgotPassword);
// router.post('/admin/resetpassword/:token', adminController.resetPassword);

module.exports = router;