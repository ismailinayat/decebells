import jwt  from 'jsonwebtoken';
import cookie from 'cookie';
import {promisify} from 'util';                        // util is a node module and out of it we are extracting the 'promisify' function which is used to work with promises.
import crypto  from 'crypto';
import User  from './../models/userModel.js';
import catchAsync  from './../utils/catchAsync.js';
import AppError  from './../utils/appError.js';
import sendEmail  from './../utils/email.js';

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie(
          "jwt", token, {
          //httpOnly: true,
          //sameSite: 'None',
          //secure: true,
          maxAge: 60 * 60 *60*60,
    })

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const signup = catchAsync(async (req, res, next) => {
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

  createAndSendToken(newUser, 200, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password'); // Because we have set 'select' to false in 'userSchema' therefore we have to specifically select 'password' here.

  if (!user || !(await user.correctPassword(password, user.password))) {
    // This correctPassword is an instance method defined in userModel on 'userSchema'. Because instance methods are avaiable on all the documents onto which they are defined and because we have defined
    // 'correctPassword' onto the 'userSchema' and also the 'user' is the document of the 'userSchema', we can apply 'correctPassword' onto the 'user' document like this.
    return next(new AppError('Incorrect email or password', 401));
  }

  createAndSendToken(user, 200, res);
});

const logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  res.status(200).json({status: 'success'})
}

const protect = catchAsync(async (req, res, next) => {

  // 1) Check if the token was sent along with the request

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token)
    return next(
      new AppError(
        'You are not logged in! Please login to access the requested page.',
        401
      )
    );

  // 2) Verify that the token is valid and to which user it belongs to. Now originally we used the 'promisify' from the 'util' package that comes built in with 'node', in order to use async await to deal with
  //    jwt.verify(), however it was giving an error message. So I had to convert it to the 'callback' method.

  const decoded = jwt.verify(token, process.env.JWT_SECRET, function (err,decoded) {

    if (err) {
      return next(new AppError('Your token is not valid. Please send the correct token to access the requested page'))
    }
    return decoded
  });       //jwt.verify will return an object containing user id, iat and exp, and we have saved these in the 'decoded' object and returned it. 


  // 3) Check if the user to which this token belongs to still exists in the database

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token has deleted his account! Signup again to get the access to the requested route.',
        401
      )
    );
  }

  // 4) Check if the user to which this token belongs has changed his password

  const passwordChanged = await freshUser.passwordChangedAfter(decoded.iat);

  if (passwordChanged) {
    return next(
      new AppError(
        'You have recently changed your password. Please sign in again with the new password to access the route',
        401
      )
    );
  }
  req.user = freshUser;
  next();
});

const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const freshUser = await User.findById(decoded.id);


      if (!freshUser) {

        res.status(200).json({
          data: {
            message: "No user found for the provided token."
          }
        })
      }

      const passwordChanged = await freshUser.passwordChangedAfter(decoded.iat);


      if (passwordChanged) {
        res.status(200).json({
          data: {
            message: "User has changed his password."
          }
        })
      }

      res.status(200).json({
        status: 'success',
  
        data: {
          freshUser
        }
      });
      
    } catch (err) {
      return new AppError('Something went wrong while checking if the user is logged in or not.')
    }
  }
  else {
    res.status(200).json({
      data: {
        message: "No valid cookie found"
      }
    })
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have the permission to perform this action', 403)
      );
    }
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('No user found with the provided email address!', 404)
    );
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/password-reset/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  const options = {
    email: user.email,
    subject: 'Your password reset token (valid for 10 minutes)',
    message
  };

  try {
    await sendEmail(options);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

const resetPassword = async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });

  if (!user) {
    return next(new AppError('Token is invalid or Expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  if (!(user.password === user.passwordConfirm)) {
    return next(new AppError('password and passwordConfirm do not match', 401));
  }
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  user.save();

  createAndSendToken(user, 200, res);
};

const updatePassword = catchAsync(async (req, res, next) => {
  if (
    !(req.body.currentPassword && req.body.password && req.body.passwordConfirm)
  ) {
    return next(
      new AppError(
        'Please provide your current password, new password and confirm new password',
        401
      )
    );
  }
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is not correct.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendToken(user, 200, res);
});

const getMe = catchAsync(async (req, res, next) => {
  const myData = await User.findById(req.user.id)
  res.status(200).json({
    status: 'success',
    data: {
      myData
    }
  })
})

export { signup, login, logout, protect, isLoggedIn, restrictTo, forgotPassword, resetPassword, updatePassword, getMe}