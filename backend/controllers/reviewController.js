import Review from '../models/reviewModel.js';
import catchAsync from '../utils/catchAsync.js';
import appError from '../utils/appError.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';

const calculateRatingsAverage = async function(productId) {
  console.log(productId)
  const idToSearch = mongoose.Types.ObjectId(productId)             // We can't use the 'id' as it is in the '$match' stage of mongoose aggregating pipeline. We need to convert it into mongoose ObjectId first.
  const stats = await Review.aggregate([
    
    {
      $match: {product: idToSearch }
    },
    {
      $group: {
        _id: '$product',
        nRating: {$sum: 1},
        avgRating: {$avg: '$rating'}
      }
    }
  ]);

  if (stats.length> 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 0
    })
  }
}

const createReview = catchAsync(async (req, res, next) => {

  if (!req.body.product) req.body.product = req.params.productId
  if (!req.body.user) req.body.user = req.user.id

  const review = await Review.create(req.body)

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  })
})

const getOneReview = catchAsync(async (req, res, next) => {

  const review = await Review.findOne({_id: req.params.id})
  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  })
})

const getProductReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({product: req.params.id});

  if(!reviews.length) {
    return next(new appError('There are no reviews for this product', 404))
  }

  res.status(200).json({
    status: 'success',
    TotalReviews: reviews.length,
    data: {
      reviews
    }
  })
})

const getUserReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({user: req.params.id});

  if(!reviews.length) {
    return next(new appError('This user haven\'t reviewed any product', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      reviews
    }
  })
})

const updateReview = catchAsync(async (req, res, next) => {
  const filter = {                                            // We want to make sure that only the user who has created the review can update it. So we have created a 'filter' object so that 'findOneAndUpdate'
    product: req.params.productId,                            // returns the review of the current logged in user only and for the product of which's id is passed by the user as a parameter in the url.
    user: req.user.id
  }
  
  const oldReview = await Review.findOneAndUpdate(filter, req.body)
  if(!oldReview) {
    return next(new appError('Review not found', 404))
  }
  const updatedReview = await Review.findOne(filter)          // Because in response we want to show the updated Review instead of old review. So we first update the old review and then did another query
                                                              // to get the updated review using the 'filter' that we defind above.


  calculateRatingsAverage(req.params.productId)

  res.status(200).json({
    status: 'success',
    data: {
      updatedReview
    }
  })
})

const deleteReview = catchAsync(async (req, res, next) => {
  
  const filter = {
    product: req.params.productId,
    user: req.user.id
  }
  const deletedReview = await Review.findOneAndDelete(filter)

 
  if(!deletedReview) {
    return next(new appError('Review not found', 404))
  }


  calculateRatingsAverage(req.params.productId)

  res.status(200).json({
    status: 'success',
    data: {
      deletedReview
    }
  })
})




export {createReview, getProductReviews, getUserReviews, updateReview, deleteReview, getOneReview};