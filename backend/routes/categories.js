const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { validate, categoryRules } = require('./validators');

const router = express.Router();

router.use(protect);

router.get('/', categoryController.listCategories);
router.post('/', validate(categoryRules), categoryController.createCategory);
router.put('/:id', validate(categoryRules), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
