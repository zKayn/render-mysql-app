const { pool } = require('../config/db');

// Tìm kiếm sản phẩm
const searchProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    // Kiểm tra xem bảng categories đã tồn tại chưa
    let hasCategories = true;
    try {
      await pool.execute("SELECT 1 FROM categories LIMIT 1");
    } catch (error) {
      console.log("Bảng categories có thể chưa tồn tại:", error.message);
      hasCategories = false;
    }
    
    let query, countQuery, params = [], countParams = [];
    
    if (hasCategories) {
      // Sử dụng JOIN nếu bảng categories tồn tại
      query = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
      countQuery = "SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
    } else {
      // Sử dụng truy vấn đơn giản nếu không có bảng categories
      query = "SELECT * FROM products p WHERE 1=1";
      countQuery = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    }
    
    if (search) {
      query += " AND p.name LIKE ?";
      countQuery += " AND p.name LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    if (category && hasCategories) {
      query += " AND p.category_id = ?";
      countQuery += " AND p.category_id = ?";
      params.push(category);
      countParams.push(category);
    }
    
    query += " ORDER BY p.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    // Thực hiện truy vấn chính
    const [rows] = await pool.execute(query, params);
    
    // Lấy tổng số sản phẩm
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    
    res.json({
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      items: rows
    });
  } catch (err) {
    console.error("Lỗi tìm kiếm sản phẩm:", err);
    // Fallback để luôn trả về kết quả hợp lệ
    res.json({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      items: []
    });
  }
};

module.exports = {
  searchProducts
};