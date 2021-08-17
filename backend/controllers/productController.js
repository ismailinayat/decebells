import Product  from './../models/productModel.js';
import catchAsync  from './../utils/catchAsync.js';
import AppError  from './../utils/appError.js';
import APIfeatures from './../utils/apiFeatures.js';



const getAllProducts = catchAsync(async (req, res, next) => {

  const features = await new APIfeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
  const products = await features.query;

  res.status(200).json({
    status: "success",
    Total: products.length,
    data: {
      products
    }
  })
})

const createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body)

  res.status(200).json({
    status: "success",
    data: {
      product: newProduct
    }
  })
})

const getOneProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('reviews')
  if (!product) {
    return next(new AppError('Product not found', 404))
  }

  res.status(200).json({
    status: "success",
    data: {
      product
    }
  })
})

const updateProduct = catchAsync(async (req, res, next) => {
  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!updatedProduct) {
    return next(new AppError("No product found with the requested id.", 404))
  }

  res.status(200).json({
    status: "success",
    data: {
      updatedProduct
    }
  })
})

const deleteProduct = catchAsync(async (req, res, next) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id)
  
  if (!deletedProduct) {
    return next(new AppError("No product found withe the requestd id.", 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      deletedProduct
    }
  })
})

export {getAllProducts, createProduct, getOneProduct, updateProduct, deleteProduct};