// API Base URL
const API_URL = 'https://render-mysql-app.onrender.com'; // Thay thế bằng URL thực tế của bạn

// DOM Elements
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productList = document.getElementById('productList');

// Get All Products
async function getProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        renderProducts(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Không thể tải dữ liệu sản phẩm.');
    }
}

// Render Products to Table
function renderProducts(products) {
    productList.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <button class="edit-btn" data-id="${product.id}">Sửa</button>
                <button class="delete-btn" data-id="${product.id}">Xóa</button>
            </td>
        `;
        productList.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editProduct(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteProduct(button.dataset.id));
    });
}

// Format Currency (VND)
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

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

// Get Product by ID
async function getProductById(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('Không thể tải thông tin sản phẩm.');
        return null;
    }
}

// Edit Product
async function editProduct(id) {
    const product = await getProductById(id);
    
    if (product) {
        // Fill form with product data
        productIdInput.value = product.id;
        nameInput.value = product.name;
        priceInput.value = product.price;
        
        // Change form state
        submitBtn.textContent = 'Cập nhật Sản phẩm';
        cancelBtn.style.display = 'inline-block';
    }
}

// Update Product
async function updateProduct(id, product) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Sản phẩm đã được cập nhật thành công!');
            resetForm();
            getProducts();
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Không thể cập nhật sản phẩm.');
    }
}

// Delete Product
async function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Sản phẩm đã bị xóa thành công!');
                getProducts();
            } else {
                alert(`Lỗi: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Không thể xóa sản phẩm.');
        }
    }
}

// Reset Form
function resetForm() {
    productForm.reset();
    productIdInput.value = '';
    submitBtn.textContent = 'Thêm Sản phẩm';
    cancelBtn.style.display = 'none';
}

// Event Listeners
productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const product = {
        name: nameInput.value,
        price: parseFloat(priceInput.value)
    };
    
    if (productIdInput.value) {
        // Update existing product
        updateProduct(productIdInput.value, product);
    } else {
        // Add new product
        addProduct(product);
    }
});

cancelBtn.addEventListener('click', resetForm);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    getProducts();
});