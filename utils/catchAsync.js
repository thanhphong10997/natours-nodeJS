const catchAsync = asyncFn => {
  return (req, res, next) => {
    asyncFn(req, res, next).catch(err => next(err))

    // simple way: chỉ cần truyền 1 function vào hàm catch(next) thì hàm đó sẽ tự động được gọi lại với đối số mà hàm callback nhận được (err)
    // asyncFn(req, res, next).catch(next)
  }
}

module.exports = catchAsync
