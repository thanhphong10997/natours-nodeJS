const express = require('express')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const router = express.Router()

// authenticate user
router.post('/signup', authController.signUpUser)
router.post('/signin', authController.signInUser)
router.post('/forgot-password', authController.forgotPassword)
router.patch('/reset-password/:token', authController.resetPassword)

// When user want to modify the data, it will need to pass this middleware to go through the code below and access router paths
// instead of add protect to each of the routes such as (/update-me, /delete-me, /:id, etc...)
router.use(authController.protect)

// modify user data
router.patch('/update-my-password', authController.updatePassword)
router.route('/me').get(userController.getMe, userController.getUser)
router.patch('/update-me', userController.updateMe)
router.delete('/delete-me', userController.deleteMe)

// authorization with admin access
router.use(authController.restrictTo('admin'))

// Interact with user data
router.route('/').get(userController.getAllUsers)
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser)

module.exports = router
