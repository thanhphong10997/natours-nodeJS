const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController')

const router = express.Router()

// if the route has a id parameter, then go to the checkId function
// router.param('id', tourController.checkId)

// create a alias for the route
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)
router.route('/tour-stats').get(tourController.getTourStats)
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/').get(authController.protect, tourController.getAllTours).post(tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

// POST /tours/234fad4/reviews -> create a review for the tour has an id: 234fad4
// GET /tours/234fad4/reviews  -> get all reviews of the tour has an id: 234fad4
// GET /tours/234fad4/reviews/1234fads  -> get a review which has an id: 1234fads of the tour has an id: 234fad4
router
  .route('/:tourId/reviews')
  .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

module.exports = router
