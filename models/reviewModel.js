const mongoose = require('mongoose')

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

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review
