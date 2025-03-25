const catchAsync = require('../utils/catchAsync')
const User = require('../models/userModel')
const AppError = require('../utils/appError')
const factory = require('./handleFactory')

exports.checkBody = (req, res, next, val) => {
  return res.status(500).json({
    status: 'fail',
    message: 'The route is not defined'
  })
}

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find()

//   return res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   })
// })

// ********* Filter OBJECT FROM REQUEST BODY
// Solution 1
const findObject = (data, ...rests) => {
  const obj = {}
  const updatedKeyFields = Object.keys(data)
  for (const val of rests) {
    if (updatedKeyFields.includes(val)) obj[val] = data[val]
  }
  return obj
}

// Solution 2
// const findObject = (data, ...allowedUpdateFields) => {
//   const obj = {}
//   Object.keys(data).forEach(key => {
//     if (allowedUpdateFields.includes(key)) obj[key] = data[key]
//   })

//   return obj
// }
// ********* Filter OBJECT FROM REQUEST BODY

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
  }

  // 2. Update user document
  const filterBody = findObject(req.body, 'name', 'email')
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
    runValidators: true
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id
  next()
}

exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User)

exports.updateUser = factory.updateOne(User)

exports.deleteUser = factory.deleteOne(User)
