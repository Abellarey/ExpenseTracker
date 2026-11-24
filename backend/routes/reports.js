const express = require('express');
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/dashboard', reportController.dashboard);
router.get('/', reportController.report);

module.exports = router;
