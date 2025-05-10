const { pool } = require('../config/db');

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm sản phẩm mới
const addProduct = async (req, res) => {
  try {
    console.log("Dữ liệu nhận được:", req.body);
    const { name, price } = req.body;
    
    if (!name) {
      console.log("Thiếu tên sản phẩm");
      return res.status(400).json({ message: "Thiếu tên sản phẩm" });
    }
    
    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      console.log("Giá sản phẩm không hợp lệ:", price);
      return res.status(400).json({ message: "Giá sản phẩm không hợp lệ" });
    }

    // Chuyển đổi price thành số thực
    const priceValue = parseFloat(price);
    
    console.log("Đang thêm sản phẩm:", { name, price: priceValue });

    const [result] = await pool.execute(
      "INSERT INTO products (name, price) VALUES (?, ?)", 
      [name, priceValue]
    );
    
    console.log("Sản phẩm đã được thêm:", result);
    
    res.status(201).json({ 
      message: "Sản phẩm được thêm thành công!", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    res.status(500).json({ 
      error: "Không thể thêm sản phẩm", 
      details: err.message 
    });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Thiếu tên hoặc giá" });
  }

  try {
    const [result] = await pool.execute("UPDATE products SET name = ?, price = ? WHERE id = ?", [name, price, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({ message: "Sản phẩm đã được cập nhật" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({ message: "Sản phẩm đã bị xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
};