const mongoose = require('mongoose')
const Tour = require('../models/tourModel')

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    // parent references
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
    // parent references
  },
  {
    // add virtual properties for output in Object format or in JSON format
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // })

  this.populate({
    path: 'user',
    select: 'name photo'
  })
  next()
})

// Create a static function to calculate average ratings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 'this' point to the Review model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        numberRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ])
  // console.log(stats)

  if (stats.length > 0) {
    // Save the calculated result to the Tour model
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numberRating,
      ratingsAverage: stats[0].avgRating
    })
  } else {
    // default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

// Should use the post middleware instead of pre middleware because the pre middleware will be executed before the document is saved to DB,
// so it's no document to aggregate
reviewSchema.post('save', function (doc, next) {
  // 'this' point to the Review document
  // Review.calcAverageRatings(this.tour) => this is not working because Review model is not created yet

  // Solution: Use this.constructor which means point to the Review model
  this.constructor.calcAverageRatings(this.tour)
  next()
})

// Calculate the numberRating and avgRatings when a document is updated or deleted
reviewSchema.post(/^findOneAnd/, function (doc, next) {
  doc.constructor.calcAverageRatings(doc.tour)
  next()
})

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review
