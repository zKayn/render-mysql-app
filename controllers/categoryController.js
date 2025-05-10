const { pool } = require('../config/db');

// Kiểm tra bảng categories tồn tại
const checkCategoriesTable = async () => {
  try {
    await pool.execute("SELECT 1 FROM categories LIMIT 1");
    return true;
  } catch (error) {
    console.log("Bảng categories chưa tồn tại:", error.message);
    return false;
  }
};

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
  try {
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      return res.json([]); // Trả về mảng rỗng nếu bảng chưa tồn tại
    }
    
    const [rows] = await pool.execute("SELECT * FROM categories");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh mục:", err);
    res.json([]); // Trả về mảng rỗng nếu có lỗi
  }
};

// Lấy danh mục theo ID
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    
    const [rows] = await pool.execute("SELECT * FROM categories WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Lỗi lấy danh mục theo ID:", err);
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
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      // Tạo bảng categories nếu chưa tồn tại
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT
        )
      `);
      
      // Kiểm tra xem cột category_id đã tồn tại trong bảng products chưa
      try {
        await pool.execute("SELECT category_id FROM products LIMIT 1");
      } catch (columnError) {
        // Thêm cột category_id nếu chưa tồn tại
        await pool.execute("ALTER TABLE products ADD COLUMN category_id INT");
        // Thêm khóa ngoại nếu có thể
        try {
          await pool.execute("ALTER TABLE products ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id)");
        } catch (fkError) {
          console.log("Không thể thêm khóa ngoại:", fkError.message);
        }
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO categories (name, description) VALUES (?, ?)", 
      [name, description || null]
    );
    res.status(201).json({ message: "Danh mục được thêm thành công!", id: result.insertId });
  } catch (err) {
    console.error("Lỗi thêm danh mục:", err);
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
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    
    const [result] = await pool.execute(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?", 
      [name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.json({ message: "Danh mục đã được cập nhật" });
  } catch (err) {
    console.error("Lỗi cập nhật danh mục:", err);
    res.status(500).json({ error: err.message });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    
    // Kiểm tra khóa ngoại
    let hasProducts = false;
    try {
      const [products] = await pool.execute("SELECT COUNT(*) as count FROM products WHERE category_id = ?", [id]);
      hasProducts = products[0].count > 0;
    } catch (error) {
      // Có thể trường category_id không tồn tại, bỏ qua
      console.log("Không thể kiểm tra sản phẩm liên quan:", error.message);
    }
    
    if (hasProducts) {
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
    console.error("Lỗi xóa danh mục:", err);
    res.status(500).json({ error: err.message });
  }
};

// Lấy sản phẩm theo danh mục
const getProductsByCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Kiểm tra xem bảng categories tồn tại chưa
    if (!(await checkCategoriesTable())) {
      return res.json([]);
    }
    
    // Kiểm tra cột category_id
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM products WHERE category_id = ?", 
        [id]
      );
      res.json(rows);
    } catch (error) {
      console.log("Trường category_id có thể không tồn tại:", error.message);
      res.json([]);
    }
  } catch (err) {
    console.error("Lỗi lấy sản phẩm theo danh mục:", err);
    res.json([]);
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