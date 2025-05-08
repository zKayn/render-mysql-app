const logger = require('../config/logger');

// Middleware để đo thời gian xử lý request
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Khi response hoàn thành
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.performance(`${req.method} ${req.originalUrl}`, duration);
  });
  
  next();
};

module.exports = performanceMiddleware;