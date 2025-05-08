const { pool } = require('../config/db');
const cloudReplication = require('../cloud/replication');

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

// Sửa đổi hàm addProduct
const addProduct = async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: "Thiếu tên hoặc giá" });
  }

  try {
    // Thêm vào database
    const [result] = await pool.execute("INSERT INTO products (name, price) VALUES (?, ?)", [name, price]);
    
    // Sao chép dữ liệu sản phẩm vào các region (cloud simulation)
    const replicationResult = await cloudReplication.replicateData(
      `product_${result.insertId}`, 
      { id: result.insertId, name, price }
    );
    
    res.status(201).json({ 
      message: "Sản phẩm được thêm thành công!", 
      id: result.insertId,
      cloudReplication: replicationResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sửa đổi hàm updateProduct
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
    
    // Sao chép dữ liệu cập nhật vào các region
    const replicationResult = await cloudReplication.replicateData(
      `product_${id}`, 
      { id: parseInt(id), name, price }
    );

    res.json({ 
      message: "Sản phẩm đã được cập nhật",
      cloudReplication: replicationResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sửa đổi hàm deleteProduct
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    // Sao chép thông tin xóa vào các region
    const replicationResult = await cloudReplication.replicateData(
      `product_${id}`, 
      { id: parseInt(id), deleted: true, deletedAt: new Date().toISOString() }
    );

    res.json({ 
      message: "Sản phẩm đã bị xóa",
      cloudReplication: replicationResult
    });
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