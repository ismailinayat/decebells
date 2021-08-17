import mongoose  from 'mongoose';
import validator  from 'validator';
import bcrypt  from 'bcryptjs';
import crypto  from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide a valid email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'The email is not valid']
  },

  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },

  address: [
    {
      streetAddress: {type: String, required: [true, 'Please provide a valid street address']},
      city: {type: String, required: [true, 'Please provide a valid city name']},
      province: {type: String, required: [true, 'Please provide a valid province name']},
      country: {type: String, required: [true, 'Please provide a valid country name'], default: 'Pakistan'},
      defaultAddress: {type: Boolean}
    }
  ],

  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = async function(JWTTimestamp) {

  if (this.passwordChangedAt) {                     // Now only those users who have changed there password will have this 'passwordChangedAt' field. So we are simply checking if the current user have changed
                                                    // his password since he signed up

    const changedTimeStamp = parseInt(              // We want to compare the time the token was created and the time when the user changed there password however the two fields have different format of time
      this.passwordChangedAt.getTime() / 1000,      // so here we are changing the time format of 'passwordChangedAt' field to make it similar to the format of 'jwt' iat timestamp.
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
