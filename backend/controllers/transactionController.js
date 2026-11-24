const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, isIsoDate } = require('../utils/validate');

const EDITABLE_FIELDS = ['type', 'description', 'amount', 'category', 'date', 'paymentMethod', 'notes'];

const pickFields = (source, fields) => {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
};

const findOwnedTransaction = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'That transaction id is not valid.');
  }

  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found.');
  }

  return transaction;
};

const listTransactions = asyncHandler(async (req, res) => {
  const { type, category, search, dateFrom, dateTo } = req.query;
  const filter = { userId: req.user.id };

  if (type === 'income' || type === 'expense') filter.type = type;
  if (category) filter.category = category;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ description: pattern }, { notes: pattern }, { category: pattern }, { paymentMethod: pattern }];
  }

  if (dateFrom || dateTo) {
    if (dateFrom && !isIsoDate(dateFrom)) throw new ApiError(400, 'dateFrom must use YYYY-MM-DD format.');
    if (dateTo && !isIsoDate(dateTo)) throw new ApiError(400, 'dateTo must use YYYY-MM-DD format.');
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    if (dateTo) filter.date.$lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const allowedSorts = ['date', '-date', 'amount', '-amount', 'description', '-description', 'createdAt', '-createdAt'];
  const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : '-date';

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: transactions.length,
    total,
    pagination: { page, limit, pages: Math.ceil(total / limit) },
    transactions: transactions.map((transaction) => transaction.toJSON()),
  });
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await findOwnedTransaction(req.params.id, req.user.id);
  res.json({ success: true, transaction: transaction.toJSON() });
});

const createTransaction = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body, EDITABLE_FIELDS);
  payload.userId = req.user.id;
  if (!payload.paymentMethod && payload.type !== 'income') payload.paymentMethod = 'Cash';
  if (!payload.notes) payload.notes = '';

  const transaction = await Transaction.create(payload);

  res.status(201).json({
    success: true,
    message: 'Transaction saved successfully.',
    transaction: transaction.toJSON(),
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await findOwnedTransaction(req.params.id, req.user.id);
  const payload = pickFields(req.body, EDITABLE_FIELDS);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'There is nothing to update.', [{ field: 'form', message: 'Change at least one field.' }]);
  }

  Object.assign(transaction, payload);
  await transaction.save();

  res.json({
    success: true,
    message: 'Transaction updated successfully.',
    transaction: transaction.toJSON(),
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await findOwnedTransaction(req.params.id, req.user.id);
  await transaction.deleteOne();

  res.json({ success: true, message: 'Transaction deleted successfully.' });
});

module.exports = { listTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
