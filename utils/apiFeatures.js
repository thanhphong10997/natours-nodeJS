class APIFeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  // Filtering
  filter() {
    const queryObject = { ...this.queryString }
    const excludedFields = ['page', 'limit', 'sort', 'fields']
    excludedFields.forEach(el => delete queryObject[el])

    // Advanced filtering - add $ sign before the operator
    let queryStr = JSON.stringify(queryObject)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)
    this.query = this.query.find(JSON.parse(queryStr))

    return this
  }

  // Sorting
  sort() {
    if (this.queryString.sort) {
      const formatSort = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(formatSort)
    } else {
      // - sign which mean sort the data by descending
      this.query = this.query.sort('-createdAt')
    }

    return this
  }

  // Field limiting
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')

      // only return the fields including in the query params
      // if you put the sign - before the field, then the fields excluding  the filed have a - sign will be returned
      // -> EX: query.select("-price") -> The price field will be hidden
      this.query = this.query.select(fields)
    } else {
      // hide the __v field for default
      this.query = this.query.select('-__v')
    }

    return this
  }

  // Pagination
  paginate() {
    const page = +this.queryString.page || 1
    const limit = +this.queryString.limit || 100
    const skip = (page - 1) * limit
    this.query = this.query.skip(skip).limit(limit)

    return this
  }
}

module.exports = APIFeatures
