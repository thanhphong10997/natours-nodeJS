const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const APIFeatures = require('../utils/apiFeatures')

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id
    const doc = await Model.findByIdAndDelete(id)
    if (!doc) return next(new AppError('No document found with that ID', 404))

    res.status(204).json({
      status: 'success',
      data: null
    })
  })

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true, // return the modified document rather than the original
      runValidators: true // Update validators validate the update operation against the model's schema
    })
    if (!doc) return next(new AppError('No document found with that ID', 404))
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    return res.status(200).json({
      status: 'success',
      data: {
        data: newDoc
      }
    })
  })

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const id = req.params.id
    // Tour.findById(id) similar to Tour.findOne({_id: id})
    let query = Model.findById(id)
    if (popOptions) query = query.populate(popOptions) // populate the virtual property
    const doc = await query
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // console.log(req.query)

    // To allow for nested GET reviews on tour (hack)
    let filter = {}
    if (req.params.tourId) {
      // Solution 1: filter.tour = req.params.tourId
      filter = { tour: req.params.tourId } // Solution 2
    }

    const queryParams = req.query
    const features = new APIFeatures(Model.find(filter), queryParams).filter().sort().limitFields().paginate()

    // execute the query
    const doc = await features.query

    // Send response
    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        data: doc
      }
    })
  })
