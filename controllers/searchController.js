const { pool } = require('../config/db');

// Tìm kiếm sản phẩm
const searchProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    let query = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
    
    const params = [];
    const countParams = [];
    
    if (search) {
      query += " AND p.name LIKE ?";
      countQuery += " AND p.name LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    if (category) {
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
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  searchProducts
};