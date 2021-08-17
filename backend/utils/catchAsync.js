const catchAsync = fn => {
  return (req, res, next) => {                             // So catch async will return this outer function. Now what this outer function does is simply return the inner function. Now the inner function
      fn(req, res, next).catch(err => next(err));          // will not get executed right away. Instead it will sit there.
  };
};

export default catchAsync;

