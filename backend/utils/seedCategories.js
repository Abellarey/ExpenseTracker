const Category = require('../models/Category');
const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } = require('./constants');

const seedDefaultCategories = async (userId) => {
  const defaults = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ name, type: 'expense' })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({ name, type: 'income' })),
  ];

  await Promise.all(
    defaults.map(({ name, type }) =>
      Category.updateOne(
        { userId, name, type },
        { $setOnInsert: { userId, name, type, isDefault: true } },
        { upsert: true }
      ).catch((error) => {
        if (error.code !== 11000) throw error;
      })
    )
  );
};

module.exports = seedDefaultCategories;
