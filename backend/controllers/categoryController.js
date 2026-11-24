const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const seedDefaultCategories = require('../utils/seedCategories');

const getOwnedCategory = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'That category id is not valid.');
  }

  const category = await Category.findOne({ _id: id, userId });
  if (!category) throw new ApiError(404, 'Category not found.');
  return category;
};

const listCategories = asyncHandler(async (req, res) => {
  await seedDefaultCategories(req.user.id);

  const filter = { userId: req.user.id };
  if (req.query.type === 'expense' || req.query.type === 'income') {
    filter.type = req.query.type;
  }

  const categories = await Category.find(filter).sort({ type: 1, name: 1 });

  res.json({
    success: true,
    count: categories.length,
    categories: categories.map((category) => category.toJSON()),
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    userId: req.user.id,
    name: req.body.name,
    type: req.body.type,
    isDefault: false,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    category: category.toJSON(),
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await getOwnedCategory(req.params.id, req.user.id);
  if (category.isDefault) {
    throw new ApiError(400, 'Predefined categories cannot be edited. Add a custom category instead.');
  }
  const oldName = category.name;
  const oldType = category.type;

  category.name = req.body.name;
  category.type = req.body.type;
  await category.save();

  if (oldName !== category.name || oldType !== category.type) {
    await Transaction.updateMany(
      { userId: req.user.id, category: oldName, type: oldType },
      { $set: { category: category.name } }
    );
  }

  res.json({
    success: true,
    message: 'Category updated successfully.',
    category: category.toJSON(),
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await getOwnedCategory(req.params.id, req.user.id);
  if (category.isDefault) {
    throw new ApiError(400, 'Predefined categories cannot be deleted.');
  }
  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted successfully.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
