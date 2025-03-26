const jwt = require('jsonwebtoken')
const { promisify } = require('util') // library of NodeJS
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')
const { response } = require('express')

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  // jwt token
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true // add secure for https method

  // create cookie
  // res.cookie('jwt', token, cookieOptions)

  // remove password from output
  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
  })
}

exports.signUpUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    changedPasswordAt: req.body.changedPasswordAt
  })

  // jwt token
  createSendToken(newUser, 201, res)
})

exports.signInUser = catchAsync(async (req, res, next) => {
  // 1. Check if email and password exist
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('Please enter email or password', 400))
  }

  // 2. Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password') // select('+password') => + mean select the hidden field (password field have a select property = false in model)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  // 3. If everything ok, send token
  createSendToken(user, 200, res)
})

// protect routes using authentication
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token and check if it's exist
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in and try again', 401))
  }

  // 2. Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // promisify convert a function to Promise (promisify take a function as argument)

  // 3. Check if user still exists
  // Ex: user can not be authenticated (the token is not valid) if their accounts is deleted for some reason
  const currentUser = await User.findById(decoded.id)

  if (!currentUser) return next(new AppError('The user belonging to this token does no longer exist', 401))

  // 4. Check if user changed password after the token was issued
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again!', 401))
  }

  // Grant access to protected route
  // we can pass the data to the request to transfer between middlewares
  req.user = currentUser
  next()
})

// Because the middleware function can not take other parameters except req,res and next
// so we need to wrap the middleware by another function and pass the data to the wrapper function
exports.restrictTo = (...roles) => {
  console.log('roles', roles)
  return (req, res, next) => {
    console.log('include', !roles.includes(req.user.role))
    // role is an array => Ex: ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403)) // 403 code for forbidden
    }
    next()
  }
}

// forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user by posted email
  const user = await User.findOne({ email: req.body.email })
  if (!user) return next(new AppError('There is no user with this email address', 404)) // 404 code for not found

  // 2.Generate random reset token and save to DB
  const resetToken = await user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false }) // validateBeforeSave: false => do not validate fields before save document to DB

  // 3. Send token to user's email
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}. \nIf you didn't forget your password, please ignore this email!`
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    })

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return next(new AppError('There was an error sending the email. Try again later!', 500))
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedResetToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({ passwordResetToken: hashedResetToken, passwordResetToken: { $gt: Date.now() } })

  // 2. If token has not expired, and there is user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400))
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  // reset the passwordResetToken and passwordResetExpires
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // 3. Update changedPasswordAt property for the user => do on userModel

  // 4. Log the user in, send JWT
  // jwt token
  createSendToken(user, 201, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get user from collection
  const user = await User.findById(req.user._id).select('+password')
  console.log('user', user)
  // 2. Check if posted current password is correct
  const isCorrectPassword = await user.correctPassword(req.body.password, user.password)
  console.log('isCorrectPassword', isCorrectPassword)
  if (!isCorrectPassword) return next(new AppError('The current password is incorrect', 401))

  // 3. If so, update password
  user.password = req.body.newPassword
  user.passwordConfirm = req.body.newPasswordConfirm

  // ************************ IMPORTANT ************************
  // The custom validator of the passwordConfirm property can not be executed and some middleware functions such as pre,post (on Model) with update query such as (findByIdAndUpdate, updateOne, updateMany)
  // so we need to use findById and then use save() for the document
  // Basically, don't use any UPDATE query for anything related to the password
  await user.save()

  // 4. Log user in, send JWT
  createSendToken(user, 200, res)
})
