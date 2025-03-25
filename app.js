const express = require('express')
const app = express()
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

// routes
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoute')

// *********Global middlewares
// Set security HTTP headers
app.use(helmet())

// logging the information on terminal when access the routes on DEVELOPMENT
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// set limit for accessing routes from ONE IP address
// NOTE: The limit will be reset if the server restarts
const limiter = rateLimit({
  max: 100, // limit the request to 100
  windowMs: 60 * 60 * 1000, // time for requesting from 1 IP (for example 1 hour here)
  message: 'Too many requests from this IP, please try again in an hour!'
})
app.use('/api', limiter) // apply the limiter middleware for all routes which includes '/api' in the route

// Body parser, reading the data from body into req.body
app.use(express.json({ limit: '10kb' })) // limit the body size

// Data sanitization against NoSQL injection
// Explain: this package will looks for request body, request params and request query string and filter to remove all '$' sign and '.' because that how mongoDB is written
app.use(mongoSanitize())

// Data sanitization against XSS
// Explain: This package clean any malicious HTML code from the input data and convert it to symbols
app.use(xss())

// Prevent parameter pollution (should be place at the end because this package cleaning up the query string)
// If the query string has a duplicate query params then the last param will be applied
app.use(
  hpp({
    // whitelist is an array that allow duplicates for the query string
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
  })
)

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`))

// *******define a middleware

// define a new property for the request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  next()
})

// *******define a middleware

// mounting the routes
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

// ******** handle all unhandled routes middleware
// .all() which means all of the http methods (get,post,put,patch,delete)
// * means all of the routes. NOTE: because this response is returned for all routes
//   so if we put this middleware at the top, this response will be returned instead of tourRouter or other routers
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // })

  // if we transfer a param to the next(), it will skip other middleware functions in middleware stacks
  // and go straight to the error middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

// ******** handling error routes middleware
// NOTE: when we defined a middleware function with 4 arguments, nodejs will automatically recognize it as an error middleware
// and if routes have any errors, this middleware will be called

app.use(globalErrorHandler)

module.exports = app
