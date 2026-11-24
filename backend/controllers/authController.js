const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const seedDefaultCategories = require('../utils/seedCategories');

const signToken = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const buildResponse = (user) => ({
  token: signToken(user._id.toString()),
  user: user.toJSON(),
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    throw new ApiError(409, 'An account with that email already exists.', [{ field: 'email', message: 'Email is already registered.' }]);
  }

  const user = await User.create({ name, email: email.toLowerCase(), password });
  await seedDefaultCategories(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Welcome!',
    ...buildResponse(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.', [{ field: 'password', message: 'Check your email and password.' }]);
  }

  res.json({
    success: true,
    message: `Welcome back, ${user.name.split(' ')[0]}.`,
    ...buildResponse(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Your account no longer exists. Please log in again.');

  res.json({ success: true, user: user.toJSON() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Your account no longer exists. Please log in again.');

  const duplicate = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
  if (duplicate) {
    throw new ApiError(409, 'That email is already used by another account.', [{ field: 'email', message: 'Email is already in use.' }]);
  }

  user.name = name;
  user.email = email.toLowerCase();
  await user.save();

  res.json({ success: true, message: 'Profile updated successfully.', user: user.toJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new ApiError(401, 'Your account no longer exists. Please log in again.');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Your current password is incorrect.', [{ field: 'currentPassword', message: 'Incorrect password.' }]);
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
