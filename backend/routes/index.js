const express = require('express');
const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');
const categoryRoutes = require('./categories');
const reportRoutes = require('./reports');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

// mongodb+srv://<ExpenseTracker>:<expense12345>@cluster0.2jdgkzw.mongodb.net/
