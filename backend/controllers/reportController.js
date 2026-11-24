const Transaction = require('../models/Transaction');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { isIsoDate } = require('../utils/validate');
const { CHART_COLORS } = require('../utils/constants');

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const getMonthKeys = (count, reference) => {
  const keys = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - offset, 1));
    keys.push(monthKey(date));
  }
  return keys;
};

const formatTransaction = (transaction) => ({
  id: transaction._id.toString(),
  type: transaction.type,
  description: transaction.description,
  amount: transaction.amount,
  category: transaction.category,
  date: new Date(transaction.date).toISOString(),
  paymentMethod: transaction.paymentMethod,
  notes: transaction.notes,
  createdAt: new Date(transaction.createdAt).toISOString(),
});

const getReferenceDate = (value) => (isIsoDate(value) ? new Date(`${value}T00:00:00.000Z`) : new Date());

const getPeriodRange = (period, reference) => {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const day = reference.getUTCDate();

  if (period === 'day') {
    return {
      start: new Date(Date.UTC(year, month, day)),
      end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999)),
    };
  }

  if (period === 'week') {
    const start = new Date(Date.UTC(year, month, day));
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    const end = new Date(start.getTime() + 6 * 86400000);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'year') {
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
    };
  }

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  };
};

const formatRangeLabel = (period, start, end) => {
  const short = (date) => date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

  if (period === 'day') return short(start);
  if (period === 'week') return `${short(start)} to ${short(end)}`;
  if (period === 'year') return `${start.getUTCFullYear()}`;
  return start.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
};

const buildCategorySummary = (expenses, totalExpense) => {
  const map = new Map();

  expenses.forEach((transaction) => {
    const current = map.get(transaction.category) || { category: transaction.category, amount: 0, count: 0 };
    current.amount += transaction.amount;
    current.count += 1;
    map.set(transaction.category, current);
  });

  return [...map.values()]
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      category: item.category,
      amount: round(item.amount),
      count: item.count,
      percentage: totalExpense > 0 ? round((item.amount / totalExpense) * 100) : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
};

const buildPaymentSummary = (expenses) => {
  const map = new Map();

  expenses.forEach((transaction) => {
    const method = transaction.paymentMethod || 'Other';
    map.set(method, (map.get(method) || 0) + transaction.amount);
  });

  return [...map.entries()].map(([method, amount]) => ({ method, amount: round(amount) }));
};

const buildTrend = (period, start, end, expenses) => {
  let buckets = [];

  if (period === 'day') {
    buckets = Array.from({ length: 24 }, (_, hour) => ({ label: `${String(hour).padStart(2, '0')}:00`, amount: 0, count: 0 }));
  } else if (period === 'week') {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start.getTime() + index * 86400000);
      return { label: date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }), amount: 0, count: 0 };
    });
  } else if (period === 'year') {
    buckets = Array.from({ length: 12 }, (_, month) => ({
      label: new Date(Date.UTC(2024, month, 1)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }),
      amount: 0,
      count: 0,
    }));
  } else {
    const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    buckets = Array.from({ length: daysInMonth }, (_, index) => ({ label: `${index + 1}`, amount: 0, count: 0 }));
  }

  expenses.forEach((transaction) => {
    const date = new Date(transaction.date);
    let index = -1;

    if (period === 'day') index = date.getUTCHours();
    if (period === 'week') index = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start.getTime()) / 86400000);
    if (period === 'month') index = date.getUTCDate() - 1;
    if (period === 'year') index = date.getUTCMonth();

    if (index >= 0 && index < buckets.length) {
      buckets[index].amount += transaction.amount;
      buckets[index].count += 1;
    }
  });

  return buckets.map((bucket) => ({ ...bucket, amount: round(bucket.amount) }));
};

const dashboard = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).lean();
  const now = new Date();
  const keys = getMonthKeys(6, now);
  const currentKey = keys[keys.length - 1];
  const previousKey = keys[keys.length - 2];
  const monthlyMap = new Map(keys.map((key) => [key, { income: 0, expense: 0 }]));
  const categoryMap = new Map();

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = monthKey(date);

    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
      incomeCount += 1;
      if (monthlyMap.has(key)) monthlyMap.get(key).income += transaction.amount;
      return;
    }

    totalExpense += transaction.amount;
    expenseCount += 1;
    if (monthlyMap.has(key)) monthlyMap.get(key).expense += transaction.amount;

    if (key === currentKey) {
      categoryMap.set(transaction.category, (categoryMap.get(transaction.category) || 0) + transaction.amount);
    }
  });

  const monthlyExpense = monthlyMap.get(currentKey).expense;
  const previousMonthExpense = monthlyMap.get(previousKey).expense;
  const categoryBreakdown = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount], index) => ({
      category,
      amount: round(amount),
      percentage: monthlyExpense > 0 ? round((amount / monthlyExpense) * 100) : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const monthlyTrend = keys.map((key) => {
    const [year, month] = key.split('-');
    const values = monthlyMap.get(key);
    return {
      month: new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }),
      key,
      income: round(values.income),
      expense: round(values.expense),
    };
  });

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map(formatTransaction);

  res.json({
    success: true,
    data: {
      totalIncome: round(totalIncome),
      totalExpense: round(totalExpense),
      balance: round(totalIncome - totalExpense),
      monthlyExpense: round(monthlyExpense),
      previousMonthExpense: round(previousMonthExpense),
      monthlyChange: previousMonthExpense > 0 ? round(((monthlyExpense - previousMonthExpense) / previousMonthExpense) * 100) : 0,
      transactionCount: transactions.length,
      incomeCount,
      expenseCount,
      recentTransactions,
      categoryBreakdown,
      monthlyTrend,
    },
  });
});

const report = asyncHandler(async (req, res) => {
  const period = ['day', 'week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';

  if (req.query.date && !isIsoDate(req.query.date)) {
    throw new ApiError(400, 'date must use YYYY-MM-DD format.');
  }

  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const reference = getReferenceDate(req.query.date);
  const { start, end } = getPeriodRange(period, reference);

  const records = await Transaction.find({ userId: req.user.id, date: { $gte: start, $lte: end } }).lean();
  const incomes = category ? [] : records.filter((transaction) => transaction.type === 'income');
  const expenses = records.filter(
    (transaction) => transaction.type === 'expense' && (!category || transaction.category === category)
  );

  const totalIncome = incomes.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const largestExpense = expenses.reduce((largest, transaction) => (!largest || transaction.amount > largest.amount ? transaction : largest), null);
  const categorySummary = buildCategorySummary(expenses, totalExpense);

  res.json({
    success: true,
    data: {
      period,
      periodLabel: formatRangeLabel(period, start, end),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      category: category || null,
      summary: {
        totalIncome: round(totalIncome),
        totalExpense: round(totalExpense),
        netBalance: round(totalIncome - totalExpense),
        transactionCount: expenses.length + incomes.length,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        averageExpense: expenses.length > 0 ? round(totalExpense / expenses.length) : 0,
        largestExpense: largestExpense ? formatTransaction(largestExpense) : null,
        topCategory: categorySummary[0] || null,
      },
      categorySummary,
      paymentSummary: buildPaymentSummary(expenses),
      trend: buildTrend(period, start, end, expenses),
    },
  });
});

module.exports = { dashboard, report };
