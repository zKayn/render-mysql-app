const express = require("express");
const cors = require("cors");
require('dotenv').config();
const path = require('path');
const { testConnection } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const cloudRoutes = require('./routes/cloudRoutes');
const performanceMiddleware = require('./middleware/performance');
const { updateMetrics } = require('./controllers/cloudController');
const logger = require('./config/logger');
const loadBalancer = require('./cloud/loadBalancer');
const cloudReplication = require('./cloud/replication');
const cloudScaler = require('./cloud/scaler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(performanceMiddleware);

// Cloud monitoring middleware
app.use((req, res, next) => {
  updateMetrics(req, res);
  next();
});

// Load balancing middleware
app.use((req, res, next) => {
  // Không áp dụng load balancing cho các request đến /cloud/loadbalancer để tránh vòng lặp vô hạn
  if (!req.originalUrl.startsWith('/cloud/loadbalancer')) {
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // Tạo load ngẫu nhiên từ 1-10 dựa trên độ phức tạp của route
    const load = req.method === 'GET' ? 1 : 5;
    loadBalancer.handleRequest(requestId, load);
    
    // Auto-scaling simulation - record request for scaling decisions
    cloudScaler.recordRequest();
  }
  next();
});

// Phục vụ static files từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Kiểm tra kết nối database
testConnection()
  .then(success => {
    if (success) {
      logger.info('Database connection successful', { service: 'mysql' });
      
      // Mô phỏng cloud replication - sao chép cấu hình kết nối
      cloudReplication.replicateData('database_config', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        connected: true,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('Database connection failed', { service: 'mysql' });
    }
  });

// Routes
app.use('/products', productRoutes);
app.use('/cloud', cloudRoutes);

// Route mặc định
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route cho cloud dashboard
app.get("/cloud-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cloud-dashboard.html'));
});

// Route cho data replication visualization
app.get("/replication", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'replication.html'));
});

// Route cho load balancer visualization
app.get("/loadbalancer", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loadbalancer.html'));
});

// Health check endpoint cho cloud monitoring
app.get("/health", (req, res) => {
  // Kiểm tra trạng thái DB
  testConnection()
    .then(dbConnected => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbConnected ? 'healthy' : 'unhealthy',
          api: 'healthy',
          instances: cloudScaler.getStatus().currentInstances
        },
        uptime: process.uptime()
      });
    });
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  logger.error('Application error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Đã xảy ra lỗi!', 
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    requestId: req.requestId
  });
});

// Middleware handle 404 errors
app.use((req, res) => {
  logger.warning('Route not found', { path: req.originalUrl });
  res.status(404).json({ error: 'Không tìm thấy trang yêu cầu' });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    render: process.env.RENDER === 'true'
  });
  console.log(`Máy chủ chạy trên cổng ${PORT}`);
});

// Graceful shutdown - hỗ trợ Cloud native
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});