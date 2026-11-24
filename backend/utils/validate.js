const ApiError = require('./apiError');

const getValue = (object, path) => path.split('.').reduce((value, key) => (value == null ? value : value[key]), object);

const setValue = (object, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((accumulator, key) => {
    if (!accumulator[key]) accumulator[key] = {};
    return accumulator[key];
  }, object);
  target[last] = value;
};

const validate = (rules) => (req, _res, next) => {
  const errors = [];

  rules.forEach((rule) => {
    let value = getValue(req.body, rule.field);
    const empty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

    if (rule.required && empty) {
      errors.push({ field: rule.field, message: `${rule.label} is required.` });
      return;
    }

    if (rule.allowEmpty && typeof value === 'string' && value.trim() === '') {
      setValue(req.body, rule.field, '');
      return;
    }

    if (empty) {
      return;
    }

    if (typeof value === 'string' && rule.trim !== false) {
      value = value.trim();
      setValue(req.body, rule.field, value);
    }

    if (rule.type === 'number') {
      value = Number(value);
      if (Number.isNaN(value)) {
        errors.push({ field: rule.field, message: `${rule.label} must be a number.` });
        return;
      }
      setValue(req.body, rule.field, value);
    }

    if (rule.type === 'date') {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        errors.push({ field: rule.field, message: `${rule.label} must be a valid date.` });
        return;
      }
      value = parsed;
      setValue(req.body, rule.field, parsed.toISOString());
    }

    if (rule.type === 'number' && rule.min !== undefined && value < rule.min) {
      errors.push({ field: rule.field, message: `${rule.label} must be at least ${rule.min}.` });
    }

    if (rule.type === 'number' && rule.max !== undefined && value > rule.max) {
      errors.push({ field: rule.field, message: `${rule.label} cannot be more than ${rule.max}.` });
    }

    if (typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push({ field: rule.field, message: `${rule.label} must be at least ${rule.min} characters.` });
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push({ field: rule.field, message: `${rule.label} cannot be more than ${rule.max} characters.` });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({ field: rule.field, message: rule.patternMessage || `${rule.label} is not valid.` });
      }
    }

    if (rule.enumValues && !rule.enumValues.includes(value)) {
      errors.push({ field: rule.field, message: `${rule.label} must be one of: ${rule.enumValues.join(', ')}.` });
    }

    if (rule.custom) {
      const customError = rule.custom(value, req);
      if (customError) {
        errors.push({ field: rule.field, message: customError });
      }
    }
  });

  if (errors.length > 0) {
    return next(new ApiError(400, 'Please correct the highlighted fields.', errors));
  }

  return next();
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());

module.exports = { validate, escapeRegex, isIsoDate };
