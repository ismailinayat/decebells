import express from 'express';
import {getProductReviews, getUserReviews, createReview, updateReview, deleteReview, getOneReview} from '../controllers/reviewController.js';
import {protect, restrictTo} from '../controllers/authController.js';
const router = express.Router({mergeParams: true});

router.route('/')
  .post(protect, restrictTo('user'), createReview)
  .patch(protect, restrictTo('user'), updateReview)
  .delete(protect, restrictTo('user'), deleteReview)

router.route('/:id')
  .get(getOneReview)
router.route('/tour/:id')
  .get(getProductReviews)

  router.route('/user/:id')
  .get(getUserReviews)



export default router;