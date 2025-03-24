const express = require('express')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const router = express.Router()

// authenticate user
router.post('/signup', authController.signUpUser)
router.post('/signin', authController.signInUser)
router.post('/forgot-password', authController.forgotPassword)
router.patch('/reset-password/:token', authController.resetPassword)
router.patch('/update-my-password', authController.protect, authController.updatePassword)

// modify user data
router.patch('/update-me', authController.protect, userController.updateMe)
router.delete('/delete-me', authController.protect, userController.deleteMe)

router.route('/').get(userController.getAllUsers).post(userController.createUser)

router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser)

module.exports = router
