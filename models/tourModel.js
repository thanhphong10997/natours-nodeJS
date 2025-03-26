const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
// const User = require('./userModel')

// create documents from the model
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      unique: true,
      minLength: [5, 'A tour name must have more or equal then 5 characters'], // validator
      maxLength: [50, 'A tour name must have less or equal than 50 characters'] // validator
      // validate: [validator.isAlpha, 'Tour name must only contain characters'] // validator using 3rd party library
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,

      // build custom validator
      validate: {
        validator: function (val) {
          // "this" keyword only points to current doc on NEW document creation
          // if the result return false then get the validation error message
          return val < this.price
        },
        message: 'The discount price ({VALUE}) must below than regular price' // {VALUE} is point to the current value of the priceDiscount (similar to val in the validator function)
      }
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],

      // validator
      // enum validator can only be used for String
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // min & max validator can also use for DATE format
      min: [1, 'Rating must be above 1.0'], // validator
      max: [5, 'Rating must be below 5.0'] // validator
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],

    // show the document only if the secretTour is false
    secretTour: {
      type: Boolean,
      default: false
    },

    // define start location
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], // [longitude, latitude] of the map
      address: String,
      description: String
    },

    // define an array which means create a new document and embedded it into the the parent document
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array    // define for embedding method
    // define for reference method (child reference)
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // reference to User model
      }
    ]
  },

  {
    // add virtual properties for output in Object format or in JSON format
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// add indexes to increase performance
// NOTE: INDEXES will reduce the time of the query to go through all of the documents, but it only fit with hight read/write ratio, which mean mostly reading document,
// if the document writes usually, it not ideally to use the indexes
tourSchema.index({ slug: 1 }) // add slug to indexes
tourSchema.index({ price: 1, ratingsAverage: -1 }) // add price and ratingsAverage to indexes which called COMPOUND (combine of indexes). '-' which mean descending

// create a virtual property which will be shown after user gets data from the database (not stored in the DB)
// Note: can't use virtual for query because virtual properties is not a part of the DB
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

// Virtual populate to get specific reviews base on tour ID
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // point to the tour property on the Review model
  localField: '_id' // point to the _id property on this Tour model
})

// ****** Document middleware:
// pre middleware: run before .save() and .create() methods. Can create multiple pre save hooks (or pre save middleware)
// post middleware: run after the query results has been executed and the first parameter is the document after query

// tourSchema.pre('save', function (next) {
//   this.slug = slugify(this.name, { lower: true })
//   console.log('pre-1')
//   next()
// })

// tourSchema.pre('save', function (next) {
//   console.log('pre-2')
//   next()
// })

//  this post middleware function will be executed after all of the pre middleware functions have been executed
// tourSchema.post('save', function (doc, next) {
//   console.log(doc)
//   next()
// })

// ******* Query middleware
// tourSchema.pre('find', function(){})
// the regular expression : /^find/ means thats select all the strings begin with the 'find' keyword
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } })
  next()
})

// Add populate to all find query methods
// NOTE: the populate method is executed to create a new query so the result won't show in the DB
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -changedPasswordAt'
  })
  next()
})

// tourSchema.post(/^find/, function (docs, next) {
//   next()
// })

// ******* Embedding the user document to the tour document
// NOTE: This middleware only works on the save() and create() methods so it won't work on the update() methods
// So we need to create a middleware function for update methods too but we don't want that because when the guide user update his information,
// we'll also need to check and update his information in tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromise)
//   next()
// })
// ******* Embedding the user document to the tour document

// ******* Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  // this.pipeline() is an array containing all the aggregation stages so we can add a new stage using the method of array
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }
  })
  next()
})
// ******* Aggregation middleware

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
