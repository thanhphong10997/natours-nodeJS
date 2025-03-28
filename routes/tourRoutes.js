const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController')
const reviewRouter = require('./reviewRoute')

const router = express.Router()

// if the route has a id parameter, then go to the checkId function
// router.param('id', tourController.checkId)

// create a alias for the route
router
  .route('/monthly-plan/:year')
  .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)
router.route('/tour-stats').get(tourController.getTourStats)
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

// Find the location of the tour with the given distance and coordinates
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin)
// Ex: /tours-within/500/center/-40,55/unit/mile

// Calculate the distance from a certain point to all of tours in the database
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

// POST /tours/234fad4/reviews -> create a review for the tour has an id: 234fad4
// GET /tours/234fad4/reviews  -> get all reviews of the tour has an id: 234fad4
// GET /tours/234fad4/reviews/1234fads  -> get a review which has an id: 1234fads of the tour has an id: 234fad4
// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

// Mounting the route (/:tourId/reviews) to the root router of the Review router
router.use('/:tourId/reviews', reviewRouter)

module.exports = router
