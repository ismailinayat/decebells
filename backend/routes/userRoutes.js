import express  from 'express';
import {getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe}  from './../controllers/userController.js';
import {signup, login, logout, protect, restrictTo, isLoggedIn, forgotPassword, resetPassword, updatePassword, getMe}  from './../controllers/authController.js';

const router = express.Router();

router.get('/isLoggedIn', isLoggedIn)
router.get('/logout', logout);

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/password-reset/:token', resetPassword);

router.use(protect);

router.get('/me', getMe);
router.patch('/update-my-password',updatePassword);
router.patch('/update-me', updateMe);
router.patch('/delete-me', deleteMe);

// Below are the admin routes.

router.use(restrictTo('admin'));

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

export default router;