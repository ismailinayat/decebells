import User  from './../models/userModel.js';
import catchAsync  from './../utils/catchAsync.js';
import AppError  from './../utils/appError.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

const createUser = catchAsync(async (req, res) => {
  const newUser = await User.create({
    //.create is a shortcut for saving one or more documents to the database. MyModel.create(docs) does new MyModel(doc).save() for every doc in docs. Triggers the save() hook.
    name: req.body.name,
    email: req.body.email,
    gender: req.body.gender,
    address: req.body.address,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    dateOfBirth: req.body.dateOfBirth
  });
  newUser.password = undefined;                     // We are simply removing the password from the 'newUser' document which we will send back to the user when they signup. So it is risky that we send the
                                                    // password in the returned document. And because password will be already saved in the database because we are using the 'create' method above so we will 
                                                    // simply set the password field to 'undefined'.
  res.status(500).json({
    status: 'success',
    data: {
      newUser
    }
  });
});

const getUser = catchAsync(async(req, res) => {
  const user = await User.findById(req.params.id)
  res.status(500).json({
    status: 'success',
    data: {
      user
    }
  });
});

const updateUser = catchAsync(async(req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    })
  res.status(500).json({
    status: 'success',
    data: {
      updatedUser
    }
  });
});

const deleteUser = catchAsync(async(req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id)
  res.status(500).json({
    status: 'success',
    data: {
      deletedUser
    }
  });
});

const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for updating password. If you want to update your password please go to '/update-my-password' route",
        401
      )
    );
  }
  const filteredFields = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredFields,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser
    }
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export {getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe}
