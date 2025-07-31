const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getUserTransactions } = require('../controllers/transactionController');

router.get('/', auth, getUserTransactions);

module.exports = router;
