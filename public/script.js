// API Base URL
const API_URL = 'https://render-mysql-app.onrender.com';

// Biến mới cho tìm kiếm và phân trang
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let categoryFilter = '';
let itemsPerPage = 10;

// DOM Elements
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productList = document.getElementById('productList');
const searchInput = document.getElementById('searchInput');
const categoryFilterSelect = document.getElementById('categoryFilter');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfoSpan = document.getElementById('pageInfo');
const itemsPerPageSelect = document.getElementById('itemsPerPage');

// Get All Products với tìm kiếm và phân trang
async function getProducts() {
    try {
        const url = new URL(`${API_URL}/search`);
        url.searchParams.append('page', currentPage);
        url.searchParams.append('limit', itemsPerPage);
        
        if (searchQuery) {
            url.searchParams.append('search', searchQuery);
        }
        
        if (categoryFilter) {
            url.searchParams.append('category', categoryFilter);
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Cập nhật biến
        totalPages = data.totalPages;
        currentPage = data.currentPage;
        
        // Cập nhật UI phân trang
        updatePaginationUI();
        
        // Render sản phẩm
        renderProducts(data.items);
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Không thể tải dữ liệu sản phẩm.');
    }
}

// Cập nhật UI phân trang
function updatePaginationUI() {
    pageInfoSpan.textContent = `Trang ${currentPage} của ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Cập nhật hàm renderProducts để hiển thị danh mục
function renderProducts(products) {
    productList.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.category_name || 'Chưa phân loại'}</td>
            <td>
                <button class="edit-btn" data-id="${product.id}">Sửa</button>
                <button class="delete-btn" data-id="${product.id}">Xóa</button>
                <button class="category-btn" data-id="${product.id}">Phân loại</button>
            </td>
        `;
        productList.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editProduct(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteProduct(button.dataset.id));
    });
    
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => openCategoryModal(button.dataset.id));
    });
}

// Lấy tất cả danh mục để hiển thị trong dropdown
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        // Cập nhật dropdown 
        categoryFilterSelect.innerHTML = '<option value="">Tất cả danh mục</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Mở modal phân loại sản phẩm
async function openCategoryModal(productId) {
    try {
        // Lấy chi tiết sản phẩm
        const product = await getProductById(productId);
        
        // Lấy danh sách danh mục
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        // Tạo HTML cho danh sách danh mục
        let categoryOptionsHtml = categories.map(category => 
            `<option value="${category.id}" ${product.category_id == category.id ? 'selected' : ''}>${category.name}</option>`
        ).join('');
        
        // Hiển thị confirm dialog
        const selectedCategory = prompt(
            `Chọn danh mục cho sản phẩm "${product.name}":\n` +
            `Nhập ID danh mục (${categories.map(c => c.id + ': ' + c.name).join(', ')})`
        );
        
        if (selectedCategory !== null) {
            await updateProductCategory(productId, selectedCategory);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Đã xảy ra lỗi');
    }
}

// Cập nhật danh mục cho sản phẩm
async function updateProductCategory(productId, categoryId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}/category`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category_id: categoryId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Đã cập nhật danh mục cho sản phẩm!');
            getProducts();
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating product category:', error);
        alert('Không thể cập nhật danh mục cho sản phẩm.');
    }
}

// Event Listeners mới
searchBtn.addEventListener('click', () => {
    searchQuery = searchInput.value.trim();
    categoryFilter = categoryFilterSelect.value;
    currentPage = 1;
    getProducts();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchQuery = searchInput.value.trim();
        categoryFilter = categoryFilterSelect.value;
        currentPage = 1;
        getProducts();
    }
});

categoryFilterSelect.addEventListener('change', () => {
    categoryFilter = categoryFilterSelect.value;
    currentPage = 1;
    getProducts();
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        getProducts();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        getProducts();
    }
});

itemsPerPageSelect.addEventListener('change', () => {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    currentPage = 1;
    getProducts();
});

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

// Add Product
async function addProduct(product) {
    try {
        const response = await fetch(`${API_URL}/products/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Sản phẩm đã được thêm thành công!');
            resetForm();
            getProducts();
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Không thể thêm sản phẩm.');
    }
}

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
    getCategories();
});