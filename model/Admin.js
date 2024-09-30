const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the Admin schema
const AdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8, // Enforce a minimum password length
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'superadmin'], // Possible roles, you can add more as needed
    }
}, { timestamps: true });



// Create and export the Admin model
const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
