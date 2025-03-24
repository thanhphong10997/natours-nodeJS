class AppError extends Error {
  constructor(message, statusCode) {
    // The first argument of the error constructor is the message
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'

    // these errors must be the operational errors which means errors that we can predict
    this.isOperational = true

    // the error stack strace would not add this object to the stack trace
    // stack strace means where the error comes from (in file location)
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
