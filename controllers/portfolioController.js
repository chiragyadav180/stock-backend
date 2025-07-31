const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');

// BUY STOCK
exports.buyStock = async (req, res) => {
  const userId = req.userId;
  const { symbol, quantity } = req.body;

  try {
    const { data } = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );
    const price = data.c;

    const user = await User.findById(userId);
    const stock = user.portfolio.find((s) => s.symbol === symbol);

    if (stock) {
      const totalCost = stock.quantity * stock.avgPrice + quantity * price;
      const newQuantity = stock.quantity + quantity;
      stock.quantity = newQuantity;
      stock.avgPrice = totalCost / newQuantity;
    } else {
      user.portfolio.push({ symbol, quantity, avgPrice: price });
    }

    await user.save();
    await Transaction.create({ userId, symbol, quantity, price, type: 'buy' });

    res.json({ msg: 'Stock bought successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Buy failed' });
  }
};

// SELL STOCK
exports.sellStock = async (req, res) => {
  const userId = req.userId;
  const { symbol, quantity } = req.body;

  try {
    const { data } = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );
    const price = data.c;

    const user = await User.findById(userId);
    const stock = user.portfolio.find((s) => s.symbol === symbol);

    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({ msg: 'Not enough quantity' });
    }

    stock.quantity -= quantity;
    if (stock.quantity === 0) {
      user.portfolio = user.portfolio.filter((s) => s.symbol !== symbol);
    }

    await user.save();
    await Transaction.create({ userId, symbol, quantity, price, type: 'sell' });

    res.json({ msg: 'Stock sold successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Sell failed' });
  }
};

// VIEW PROFILE SUMMARY
exports.getProfileSummary = async (req, res) => {
  const userId = req.userId;
  
  console.log('ViewPortfolio called with userId:', userId); // Debug log

  try {
    const user = await User.findById(userId);
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) {
      console.log('User not found for ID:', userId); // Debug log
      return res.status(404).json({ 
        msg: 'User not found',
        userId: userId,
        error: 'The user ID from your token does not exist in the database'
      });
    }

    console.log('User portfolio:', user.portfolio); // Debug log

    const portfolio = [];
    let totalInvestedValue = 0;
    let totalCurrentValue = 0;

    // If portfolio is empty, return empty portfolio
    if (!user.portfolio || user.portfolio.length === 0) {
      return res.json({
        portfolio: [],
        summary: {
          totalInvestedValue: 0,
          totalCurrentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0
        },
        message: 'Portfolio is empty. Buy some stocks to see your portfolio!'
      });
    }

    // Get current prices for all stocks in portfolio
    for (const stock of user.portfolio) {
      try {
        const { data } = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${process.env.FINNHUB_API_KEY}`
        );
        
        const currentPrice = data.c;
        const investedValue = stock.quantity * stock.avgPrice;
        const currentValue = stock.quantity * currentPrice;
        const profitLoss = currentValue - investedValue;
        const profitLossPercentage = (profitLoss / investedValue) * 100;

        portfolio.push({
          symbol: stock.symbol,
          quantity: stock.quantity,
          avgPrice: stock.avgPrice,
          currentPrice: currentPrice,
          investedValue: investedValue,
          currentValue: currentValue,
          profitLoss: profitLoss,
          profitLossPercentage: profitLossPercentage
        });

        totalInvestedValue += investedValue;
        totalCurrentValue += currentValue;
      } catch (error) {
        console.error(`Error fetching price for ${stock.symbol}:`, error);
        // If we can't get current price, use average price as fallback
        const investedValue = stock.quantity * stock.avgPrice;
        portfolio.push({
          symbol: stock.symbol,
          quantity: stock.quantity,
          avgPrice: stock.avgPrice,
          currentPrice: stock.avgPrice,
          investedValue: investedValue,
          currentValue: investedValue,
          profitLoss: 0,
          profitLossPercentage: 0
        });
        totalInvestedValue += investedValue;
        totalCurrentValue += investedValue;
      }
    }

    const totalProfitLoss = totalCurrentValue - totalInvestedValue;
    const totalProfitLossPercentage = totalInvestedValue > 0 ? (totalProfitLoss / totalInvestedValue) * 100 : 0;

    res.json({
      portfolio: portfolio,
      summary: {
        totalInvestedValue: totalInvestedValue,
        totalCurrentValue: totalCurrentValue,
        totalProfitLoss: totalProfitLoss,
        totalProfitLossPercentage: totalProfitLossPercentage
      }
    });
  } catch (err) {
    console.error('Error in viewPortfolio:', err);
    res.status(500).json({ 
      msg: 'Failed to fetch portfolio',
      error: err.message 
    });
  }
};