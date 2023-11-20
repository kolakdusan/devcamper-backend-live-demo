const advancedResults = (model, populate) => async (req, res, next) => {
  let query
  const reqQuery = { ...req.query }
  const removeFields = ['select', 'sort', 'page', 'limit']
  removeFields.forEach((param) => delete reqQuery[param])
  let queryStr = JSON.stringify(reqQuery)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
  query = model.find(JSON.parse(queryStr))
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ')
    query = query.select(fields)
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ')
    query = query.sort(sortBy)
  } else {
    query = query.sort('-createdAt')
  }
  const page = +req.query.page || 1
  const limit = +req.query.limit || 25
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await model.countDocuments()
  const pagination = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  query = query.skip(startIndex).limit(limit)

  if (populate) {
    query = query.populate(populate)
  }

  const results = await query

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  }

  next()
}

module.exports = advancedResults
