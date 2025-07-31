const Transaction = require('../models/Transaction');

exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch {
    res.status(500).json({ msg: 'Failed to fetch transactions' });
  }
};
