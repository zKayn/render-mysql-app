// API Base URL - Sử dụng window.location.origin để tự động phát hiện URL
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;

// DOM Elements
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productList = document.getElementById('productList');
const loadingIndicator = document.createElement('div');
loadingIndicator.classList.add('loading-indicator');
loadingIndicator.innerHTML = 'Đang tải...';

// Hiển thị loading indicator
function showLoading() {
  document.body.appendChild(loadingIndicator);
}

// Ẩn loading indicator
function hideLoading() {
  if (document.body.contains(loadingIndicator)) {
    document.body.removeChild(loadingIndicator);
  }
}

// Get All Products
async function getProducts() {
  showLoading();
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    renderProducts(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    productList.innerHTML = `<tr><td colspan="4">Không thể tải dữ liệu sản phẩm. Lỗi: ${error.message}</td></tr>`;
  } finally {
    hideLoading();
  }
}

// Render Products to Table
function renderProducts(products) {
  productList.innerHTML = '';
  
  if (products.length === 0) {
    productList.innerHTML = '<tr><td colspan="4">Không có sản phẩm nào</td></tr>';
    return;
  }
  
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

// Add Product with Cloud Replication
async function addProduct(product) {
  showLoading();
  try {
    const response = await fetch(`${API_URL}/products/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể thêm sản phẩm');
    }
    
    const data = await response.json();
    
    // Hiển thị thông tin cloud replication
    let message = 'Sản phẩm đã được thêm thành công!';
    
    if (data.cloudReplication && data.cloudReplication.success) {
      message += `\n\nDữ liệu đã được sao chép đến ${data.cloudReplication.replicatedTo.length} region(s): ${data.cloudReplication.replicatedTo.join(', ')}.`;
      
      // Hiển thị thêm thông tin cloud computing
      message += '\n\nCloud Computing Info:';
      message += '\n- Data được sao chép qua nhiều regions để đảm bảo tính sẵn sàng cao';
      message += '\n- Quá trình sao chép dữ liệu được thực hiện bất đồng bộ';
      message += '\n- Dữ liệu được lưu trữ dư thừa để đảm bảo chịu lỗi';
    }
    
    alert(message);
    resetForm();
    getProducts();
  } catch (error) {
    console.error('Error adding product:', error);
    alert(`Không thể thêm sản phẩm. Lỗi: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Get Product by ID
async function getProductById(id) {
  showLoading();
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    alert(`Không thể tải thông tin sản phẩm. Lỗi: ${error.message}`);
    return null;
  } finally {
    hideLoading();
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
    
    // Scroll to form
    productForm.scrollIntoView({ behavior: 'smooth' });
  }
}

// Update Product with Cloud Replication
async function updateProduct(id, product) {
  showLoading();
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể cập nhật sản phẩm');
    }
    
    const data = await response.json();
    
    // Hiển thị thông tin cloud replication
    let message = 'Sản phẩm đã được cập nhật thành công!';
    
    if (data.cloudReplication && data.cloudReplication.success) {
      message += `\n\nDữ liệu đã được sao chép đến ${data.cloudReplication.replicatedTo.length} region(s): ${data.cloudReplication.replicatedTo.join(', ')}.`;
    }
    
    alert(message);
    resetForm();
    getProducts();
  } catch (error) {
    console.error('Error updating product:', error);
    alert(`Không thể cập nhật sản phẩm. Lỗi: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Delete Product with Cloud Replication
async function deleteProduct(id) {
  if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
    showLoading();
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể xóa sản phẩm');
      }
      
      const data = await response.json();
      
      // Hiển thị thông tin cloud replication
      let message = 'Sản phẩm đã được xóa thành công!';
      
      if (data.cloudReplication && data.cloudReplication.success) {
        message += `\n\nThông tin xóa đã được sao chép đến ${data.cloudReplication.replicatedTo.length} region(s).`;
        message += '\n\nCloud Computing Info: Xóa dữ liệu trong môi trường đám mây được thực hiện theo mô hình "eventual consistency".';
      }
      
      alert(message);
      getProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Không thể xóa sản phẩm. Lỗi: ${error.message}`);
    } finally {
      hideLoading();
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
  
  // Validate form
  if (!nameInput.value.trim()) {
    alert('Vui lòng nhập tên sản phẩm');
    nameInput.focus();
    return;
  }
  
  if (!priceInput.value || isNaN(priceInput.value) || parseFloat(priceInput.value) <= 0) {
    alert('Vui lòng nhập giá hợp lệ');
    priceInput.focus();
    return;
  }
  
  const product = {
    name: nameInput.value.trim(),
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

cancelBtn.addEventListener('click', function(e) {
  e.preventDefault();
  resetForm();
});

// Add cloud navigation
function setupCloudNavigation() {
  const header = document.querySelector('header') || document.querySelector('h1').parentElement;
  
  // Kiểm tra xem navigation đã tồn tại chưa
  if (!document.querySelector('.nav-links')) {
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.innerHTML = `
      <a href="/" class="active">Quản lý Sản phẩm</a>
      <a href="/cloud-dashboard">Cloud Dashboard</a>
      <a href="/replication">Data Replication</a>
      <a href="/loadbalancer">Load Balancer</a>
    `;
    
    header.appendChild(navLinks);
    
    // Add CSS style for nav-links if not exists
    if (!document.querySelector('style#nav-styles')) {
      const style = document.createElement('style');
      style.id = 'nav-styles';
      style.textContent = `
        .nav-links {
          display: flex;
          gap: 15px;
          margin-top: 10px;
        }
        .nav-links a {
          padding: 5px 10px;
          text-decoration: none;
          color: #555;
          border-radius: 4px;
        }
        .nav-links a.active {
          background-color: #4CAF50;
          color: white;
        }
        .loading-indicator {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          z-index: 1000;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Check server health
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('Server health status:', data);
    
    // You could display this information if needed
    return data;
  } catch (error) {
    console.error('Error checking server health:', error);
    return null;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupCloudNavigation();
  await getProducts();
  await checkServerHealth();
});

// Auto-refresh data every 60 seconds to show real-time cloud updates
setInterval(getProducts, 60000);