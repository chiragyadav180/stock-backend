const express = require('express');
const router = express.Router();
const { getStockQuote } = require('../controllers/stockController');

router.get('/:symbol', getStockQuote);

module.exports = router;
