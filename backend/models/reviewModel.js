import mongoose from 'mongoose';
import Product from '../models/productModel.js'


const reviewSchema = new mongoose.Schema({
  review: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
  },
  {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
  }
);

reviewSchema.index({ product: 1, user: 1}, { unique: true })                 //This is to make sure that 'product' and 'user' combination must be unique in all of the collection's documents.

reviewSchema.statics.calculateRatingsAverage = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: {product: productId }
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



reviewSchema.post('save', function() {
  this.constructor.calculateRatingsAverage(this.product)
})
/*
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.p = await this.find()
  next()
})

reviewSchema.post(/^findOneAnd/, async function() {
  console.log(this.p)
  await this.p.constructor.calculateRatingsAverage(this.p.product)    // Now ideally we should have been able to define a 'static' method and then call that method on the 'post save', 'post update' and 
                                                                      // 'post delete' methods. Now it was simple for 'post save' method however because in 'query' middleware we have access to the 'query'
                                                                      // instead of the 'document, we had to follow a trick as shown by the 'Jonas' in his Natours course where we first define a 'pre query' 
                                                                      // middleware in which we just simply 'await this.find()' and attach the results to 'this.p' and call 'next()'. So simply 'awaiting the
                                                                      // query mean that we have got the same document without modifying it. Then we also define a 'post query' middleware where we would have 
                                                                      // access to the current document through 'this.p' and then we could have called the 'this.p.constructor.calculateRatingsAverage(this.p.product).
                                                                      // However for some reason we keep getting the error that 'this.p.constructor.calculateRatingsAverage' is not a function. So what we did
                                                                      // was that we kept using 'static' calculateRatingsAverage method for 'post save', but then in the 'reviewController.js' we have to define
                                                                      // another function 'calculateRatingsAverage' and then call it in the 'findByIdAndUpdate' and 'findByIdAndDelete' controller functions.
})
*/

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'product',
    select: ['title', 'price']
  }).populate({
    path: 'user',
    select: 'name'
  })
  next();
})


const Review = mongoose.model('Review', reviewSchema)

export default Review;