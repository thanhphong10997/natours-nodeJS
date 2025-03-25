const dotenv = require('dotenv')
const mongoose = require('mongoose')

// handle uncaught exceptions for synchronous codes
// Put this handle function on the top of the file so it can catch the error correctly
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...')
  console.log({ 'error-name': err.name }, { 'err.message': err.message }, { 'err.stack': err.stack })

  // Synchronous code does not need to wait the server close
  process.exit(1)
})

// set up env variables
dotenv.config({
  path: './.env'
})

const app = require('./app')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

// Connect to DB
mongoose
  .connect(DB, {
    // custom options for deprecated warning
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('Connected to database successfully!'))

// create test tour based on tour model
// const Tour = mongoose.model('Tour', tourSchema)
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 497
// })

// testTour.save().then(tour => console.log(tour))

// Start server
const port = 3002
const server = app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

// handle unhandled rejections for asynchronous code (outside of Express)
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  console.log({ 'error-name': err.name }, { 'err.message': err.message }, { 'err.stack': err.stack })

  // Only exit after the sever is closed
  server.close(() => {
    process.exit(1)
  })
})
