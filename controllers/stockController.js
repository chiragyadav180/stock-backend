const axios = require('axios');

exports.getStockQuote = async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const { data } = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );

    res.json({
      symbol,
      currentPrice: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      prevClose: data.pc,
      change: (data.c - data.pc).toFixed(2),
      percentChange: (((data.c - data.pc) / data.pc) * 100).toFixed(2)
    });
  } catch {
    res.status(500).json({ msg: 'Failed to fetch stock data' });
  }
};
