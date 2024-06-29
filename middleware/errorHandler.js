// middleware/errorHandler.js
exports.errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
  
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
  };
  