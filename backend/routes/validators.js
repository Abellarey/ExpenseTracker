const { validate } = require('../utils/validate');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerRules = [
  { field: 'name', label: 'Name', required: true, min: 2, max: 80 },
  {
    field: 'email',
    label: 'Email',
    required: true,
    pattern: emailPattern,
    patternMessage: 'Enter a valid email address.',
    max: 120,
  },
  { field: 'password', label: 'Password', required: true, trim: false, min: 6, max: 128 },
];

const loginRules = [
  { field: 'email', label: 'Email', required: true, pattern: emailPattern, patternMessage: 'Enter a valid email address.' },
  { field: 'password', label: 'Password', required: true, trim: false },
];

const profileRules = [
  { field: 'name', label: 'Name', required: true, min: 2, max: 80 },
  { field: 'email', label: 'Email', required: true, pattern: emailPattern, patternMessage: 'Enter a valid email address.', max: 120 },
];

const passwordRules = [
  { field: 'currentPassword', label: 'Current password', required: true, trim: false },
  { field: 'newPassword', label: 'New password', required: true, trim: false, min: 6, max: 128 },
];

const transactionRules = [
  { field: 'type', label: 'Type', required: true, enumValues: ['income', 'expense'] },
  { field: 'description', label: 'Description or source', required: true, min: 2, max: 120 },
  { field: 'amount', label: 'Amount', required: true, type: 'number', min: 0.01, max: 1000000000 },
  { field: 'category', label: 'Category', required: true, min: 1, max: 60 },
  { field: 'date', label: 'Date', required: true, type: 'date' },
  { field: 'paymentMethod', label: 'Payment method', allowEmpty: true, max: 40 },
  { field: 'notes', label: 'Notes', allowEmpty: true, max: 1000 },
];

const updateTransactionRules = transactionRules.map((rule) => ({ ...rule, required: false }));

const categoryRules = [
  { field: 'name', label: 'Category name', required: true, min: 2, max: 40 },
  { field: 'type', label: 'Category type', required: true, enumValues: ['expense', 'income'] },
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  passwordRules,
  transactionRules,
  updateTransactionRules,
  categoryRules,
  validate,
};
