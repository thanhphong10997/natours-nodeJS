const Tour = require('../models/tourModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handleFactory')
// exports.checkId = (req, res, next, val) => {
//   // only route.param have the fourth parameter (val) is the value of the route parameter
//   const id = +req.params.id
//   if (id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     })
//   }

//   next()
// }

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price'
    })
  }

  next()
}

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = 'price,-ratingsAverage'
  req.query.fields = 'name,price,ratingsAverage,difficulty'
  next()
}

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year
  const plan = await Tour.aggregate([
    {
      // tái cấu trúc tạo ra các document cho từng startDate đc tách ra từ array startDates (tức mỗi startDate sẽ tạo ra 1 document)
      $unwind: '$startDates'
    },
    {
      // match the date in one year
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      //  group the document by month
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      // add a new field named month reference to the _id field
      $addFields: { month: '$_id' }
    },
    {
      // delete the _id field for the output (0 which mean remove the field)
      $project: { _id: 0 }
    },
    {
      // sort descending by numTourStarts
      $sort: { numTourStarts: -1 }
    }
    // {
    //   // limit the response to be 12 documents
    //   $limit: 12
    // }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  })
})

exports.getTourStats = catchAsync(async (req, res, next) => {
  // aggregate pipeline can be used to combine and calculate based on the all documents of the tour collection
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      // sort ascending based on avgPrice
      $sort: { avgPrice: 1 }
    }
    // Can use a state multiple times
    // {
    //    $match: {_id: {$ne: 'EASY'}}
    //  }
  ])

  res.status(200).json({
    status: 'success',
    data: stats
  })
})

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // console.log(req.query)
//   const queryParams = req.query
//   const features = new APIFeatures(Tour.find(), queryParams).filter().sort().limitFields().paginate()

//   // execute the query
//   const tours = await features.query

//   // Send response
//   res.status(200).json({
//     status: 'success',
//     result: tours.length,
//     data: {
//       tours
//     }
//   })
// })

exports.getAllTours = factory.getAll(Tour)

// exports.getTour = catchAsync(async (req, res, next) => {
//   const id = req.params.id

//   // Tour.findById(id) similar to Tour.findOne({_id: id})

//   const tour = await Tour.findById(id).populate('reviews') // populate the virtual review property
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   })
// })

exports.getTour = factory.getOne(Tour, { path: 'reviews' })

// To avoid using catch block in our async function, we can use another function wrap the async function
// then the wrapper function will return a anonymous function that contains the result of the async function which users call when create tour
// exports.createTour = catchAsync(async (req, res, next) => {
//   // one way to create a new tour
//   // const newTour = new Tour(req.body)
//   // newTour.save()

//   // Another way to create a new tour

//   const newTour = await Tour.create(req.body)
//   return res.status(200).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   })
// })

exports.createTour = factory.createOne(Tour)

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const id = req.params.id
//   const updatedTour = await Tour.findByIdAndUpdate(id, req.body, {
//     new: true, // return the modified document rather than the original
//     runValidators: true // Update validators validate the update operation against the model's schema
//   })

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: updatedTour
//     }
//   })
// })

// DO NOT update password with this
exports.updateTour = factory.updateOne(Tour)

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const id = req.params.id
//   await Tour.findByIdAndDelete(id)
//   res.status(204).json({
//     status: 'success',
//     data: null
//   })
// })

exports.deleteTour = factory.deleteOne(Tour)

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  // Calculate radian by distance multiply the radius of the earth (3963.2 or 6378.1) base on unit (mile or km)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude or longitude in the format lat,lng!'))
  }

  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude or longitude in the format lat,lng!'))
  }

  const distances = await Tour.aggregate([
    // $geoNear must always be the first stage
    {
      // $geoNear requires at least one of the field must be contained a geospatial index (startLocation already has a geospatial index (2sphere))
      $geoNear: {
        // near: the staring point to calculate the distance
        near: {
          type: 'Point',
          coordinates: [+lng, +lat]
        },
        // distanceField: where all the calculated distances will be stored
        distanceField: 'distance',
        distanceMultiplier: multiplier // divide by 1000 to convert into km
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})
