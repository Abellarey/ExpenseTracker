const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerRules, loginRules, profileRules, passwordRules } = require('./validators');

const router = express.Router();

router.post('/register', validate(registerRules), authController.register);
router.post('/login', validate(loginRules), authController.login);

router.use(protect);
router.get('/me', authController.getMe);
router.put('/profile', validate(profileRules), authController.updateProfile);
router.put('/password', validate(passwordRules), authController.changePassword);

module.exports = router;
