const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell me your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true, // not validator, just format string to lowercase
    validate: [validator.isEmail, 'Please enter the correct email']
  },
  password: {
    type: String,
    required: [true, 'Please enter your password!'],
    minLength: 8,
    select: false // hide password field when read the document
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // This only works on SAVE and CREATE documents
      validator: function (val) {
        return val === this.password
      },
      message: 'Passwords are not the same!'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false // hide active field when read the document
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  changedPasswordAt: Date,
  photo: String
})

// hash the password before save document to DB
userSchema.pre('save', async function (next) {
  // "this" point to the current document
  if (!this.isModified('password')) return next()

  // 12 which means measure how cpu intensive will be
  this.password = await bcrypt.hash(this.password, 12)

  // delete the password confirm field because we don't want to save it to DB
  // ,just only want to make sure the user type the correct password
  // NOTE: remove the password confirm will not affect the validation process because validation process for the input data, not for save document
  this.passwordConfirm = undefined
  next()
})

// Update changedPasswordAt property for the user
userSchema.pre('save', async function (next) {
  // Check if the password property is modified and the document is just created recently
  if (!this.isModified('password') || this.isNew) return next()
  this.changedPasswordAt = Date.now() - 1000 // some times the save() method will delay a little bit so the time will be greater than the issued time of JWT token => we could minus 1 second to handle this
  next()
})

// Filtering the document with property active not equals to FALSE before every find query is executed
userSchema.pre(/^find/, function (next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } })
  next()
})

// Compare password from user request to user password in DB (true => same, false => different)
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword) // candidate password is the password that user send to server and user password is the password (hashed) stored in DB
}

// Check if user changed password after JWT was issued
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.changedPasswordAt) {
    const convertChangedPasswordTime = parseInt(this.changedPasswordAt.getTime() / 1000, 10)
    return JWTTimestamp < convertChangedPasswordTime
  }

  // False means no password change
  return false
}

userSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex')
  console.log('resetToken:', resetToken)

  // encrypt token
  const encryptToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.passwordResetToken = encryptToken
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000
  console.log('encryptToken:', encryptToken)

  return resetToken
}

const User = mongoose.model('User', userSchema) // this code will create a collection which has name based on the name parameter of the model
// (tên sẽ được chuyển thành số nhiều và chữ thường)

module.exports = User
