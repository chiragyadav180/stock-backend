const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { buyStock, sellStock, getProfileSummary } = require('../controllers/portfolioController');



router.post('/buy', auth, buyStock);
router.post('/sell', auth, sellStock);

// Add this line for the profile summary route
router.get('/profile/summary', auth, getProfileSummary);

module.exports = router;
