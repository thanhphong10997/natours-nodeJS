const AppError = require('../utils/appError')

const sendErrorDev = (res, error) => {
  res.status(error.statusCode).json({
    error: error,
    status: error.status,
    message: error.message,
    stack: error.stack
  })
}

const sendErrorProd = (res, error) => {
  // operational , prediction error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.log('Unknown error:', error)

    // send generic message
    res.status(error.statusCode).json({
      status: 'error',
      message: 'Something went wrong!'
    })
  }
}

// handling mongoose cast error (usually for send wrong param while sending request, Ex: send wrong id for post method)
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

// handling mongoose duplicate key error (usually for sending data that have been already existed, Ex: send duplicate name for post method)
const handleDuplicateFieldsDB = err => {
  const value = err.keyValue.name
  const message = `Duplicate field value: ${value}. Please choose another value`
  return new AppError(message, 400)
}

// handling mongoose validation error
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(errElement => errElement.message)
  console.log('errorrrr', errors)
  const message = `Invalid data: ${errors.join('. ')}`
  return new AppError(message, 400)
}

// handling JWT error
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401)

// ******** Global handling error middleware
module.exports = (error, req, res, next) => {
  // console.log('Error stack trace:', error.stack)
  error.statusCode = error.statusCode || 500
  error.status = error.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, error)
  } else if (process.env.NODE_ENV === 'production') {
    let copyError = { ...error }

    console.log('copy error:', copyError)

    if (copyError.name === 'CastError') copyError = handleCastErrorDB(copyError)

    if (copyError.code === 11000) copyError = handleDuplicateFieldsDB(copyError)

    if (copyError._message === 'Tour validation failed') copyError = handleValidationErrorDB(copyError)

    if (copyError.name === 'JsonWebTokenError') copyError = handleJWTError(copyError)
    if (copyError.name === 'TokenExpiredError') copyError = handleJWTExpiredError(copyError)

    sendErrorProd(res, copyError)
  }
}
