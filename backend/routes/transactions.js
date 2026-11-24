const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate, transactionRules, updateTransactionRules } = require('./validators');

const router = express.Router();

router.use(protect);

router.get('/', transactionController.listTransactions);
router.get('/:id', transactionController.getTransaction);
router.post('/', validate(transactionRules), transactionController.createTransaction);
router.put('/:id', validate(updateTransactionRules), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
