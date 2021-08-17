import express from 'express';
import {getAllProducts, getOneProduct, createProduct, updateProduct, deleteProduct} from '../controllers/productController.js';
import {protect, restrictTo /*isLoggedIn*/} from '../controllers/authController.js';
import reviewRouter from './reviewRoutes.js'


const router = express.Router();

router.use('/:productId/reviews', reviewRouter)
router.route('/')
    .get(/*isLoggedIn*/ getAllProducts)
    .post(protect, restrictTo("admin"), createProduct)

router.route('/:id')
    .get(/*isLoggedIn*/ getOneProduct)
    .patch(protect, restrictTo("admin"), updateProduct)
    .delete(protect, restrictTo("admin"), deleteProduct)

export default router;