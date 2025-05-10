const { pool } = require('../config/db');

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM categories");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh mục theo ID
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute("SELECT * FROM categories WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm danh mục mới
const addCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Thiếu tên danh mục" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO categories (name, description) VALUES (?, ?)", 
      [name, description || null]
    );
    res.status(201).json({ message: "Danh mục được thêm thành công!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật danh mục
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Thiếu tên danh mục" });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?", 
      [name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({ message: "Danh mục đã được cập nhật" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra xem danh mục có sản phẩm không
    const [products] = await pool.execute("SELECT COUNT(*) as count FROM products WHERE category_id = ?", [id]);
    
    if (products[0].count > 0) {
      return res.status(400).json({ 
        message: "Không thể xóa danh mục này vì có sản phẩm liên quan. Hãy xóa hoặc di chuyển các sản phẩm trước."
      });
    }

    const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({ message: "Danh mục đã bị xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy sản phẩm theo danh mục
const getProductsByCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM products WHERE category_id = ?", 
      [id]
    );
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory
};