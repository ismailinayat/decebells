import mongoose from 'mongoose';
import validator from 'validator';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A product must have a title"],
    unique: true,
  },
  price: {
    type: Number,
    required: [true, "A product must have a price"]
  },
  sku: {
    type: String
  },
  mainCategory: {
    type: String,
    required: [true, "A product must be assigned to a main category"],
    enum: ["Wireless", "Wired"]
  },
  ratingsQuantity: Number,
  ratingsAverage: Number,
  subCategory: {
    type: String,
    required: [true, "A product must be assigned to a sub category"],
    enum: ["tws", "wireless-earphones", "wireless-headphones", "wireless-speakers", "wired-earphones", "wired-headphones", "wireless-speakers"]
  },
  description: {
    type: [String],
  },
  featuresDescription: [
    {
      feature: {type: String},
      featureDescription: {type: String}
    }
  ],

  featuresSummary: [String],

  images: [String],

  createdAt: {
    type: Date,
    default: Date.now()
  }

},{
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
})

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
})

const Product = mongoose.model('Product', productSchema)

export default Product;