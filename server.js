const express = require("express");
const cors = require("cors");
require('dotenv').config();
const path = require('path');
const { testConnection } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ static files từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Kiểm tra kết nối database
testConnection();

// Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/search', searchRoutes);

// Route mặc định
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Máy chủ chạy trên cổng ${PORT}`);
});