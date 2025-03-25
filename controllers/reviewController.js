const Review = require('../models/reviewModel')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync')

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {}

  if (req.params.tourId) {
    // Solution 1: filter.tour = req.params.tourId
    filter = { tour: req.params.tourId } // Solution 2
  }

  const reviews = await Review.find(filter)

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  })
})

exports.createReview = catchAsync(async (req, res, next) => {
  // const review = await Review.create({
  //   review: req.body.review,
  //   rating: req.body.rating,
  //   tour: req.body.tour,
  //   user: req.body.user
  // })

  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user._id

  const newReview = await Review.create(req.body)

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  })
})
