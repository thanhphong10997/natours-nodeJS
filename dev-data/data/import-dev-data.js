const fs = require('fs')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const Tour = require('../../models/tourModel')

// set up env variables
dotenv.config({
  path: './.env'
})

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

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))

// Import data to database
const importData = async () => {
  try {
    await Tour.create(tours)
    console.log('Data loaded successfully!')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

// Delete all data from the collection of DB
const deleteData = async () => {
  try {
    await Tour.deleteMany()
    console.log('Data deleted successfully!')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

// console.log(process.argv)

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}
