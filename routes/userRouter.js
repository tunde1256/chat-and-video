const express = require('express');
const router = express.Router();

// Import the controllers
const userController = require('../controller/user');


// Define the routes
router.post('/register', userController.register);
router.post('/login', userController.login);
 router.post('/logout', userController.logout);
  router.get('/get', userController.getUsers);
  router.put('/update', userController.updateUser);
 router.delete('/delete', userController.deleteUser);


//  router.put(userController.resetPassword);
// router.put(userController.changePassword);
module.exports = router;