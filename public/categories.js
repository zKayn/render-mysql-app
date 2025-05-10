// API Base URL
const API_URL = 'https://render-mysql-app.onrender.com'; // Thay thế bằng URL thực tế của bạn

// DOM Elements
const categoryForm = document.getElementById('categoryForm');
const categoryIdInput = document.getElementById('categoryId');
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const categoryList = document.getElementById('categoryList');

// Get All Categories
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        
        // Lấy số lượng sản phẩm cho mỗi danh mục
        for (let category of data) {
            const productsResponse = await fetch(`${API_URL}/categories/${category.id}/products`);
            const products = await productsResponse.json();
            category.productCount = products.length;
        }
        
        renderCategories(data);
    } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Không thể tải dữ liệu danh mục.');
    }
}

// Render Categories to Table
function renderCategories(categories) {
    categoryList.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || ''}</td>
            <td>${category.productCount || 0}</td>
            <td>
                <button class="edit-btn" data-id="${category.id}">Sửa</button>
                <button class="delete-btn" data-id="${category.id}">Xóa</button>
            </td>
        `;
        categoryList.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editCategory(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteCategory(button.dataset.id));
    });
}

// Add Category
async function addCategory(category) {
    try {
        const response = await fetch(`${API_URL}/categories/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Danh mục đã được thêm thành công!');
            resetForm();
            getCategories();
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Không thể thêm danh mục.');
    }
}

// Get Category by ID
async function getCategoryById(id) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching category:', error);
        alert('Không thể tải thông tin danh mục.');
        return null;
    }
}

// Edit Category
async function editCategory(id) {
    const category = await getCategoryById(id);
    
    if (category) {
        // Fill form with category data
        categoryIdInput.value = category.id;
        nameInput.value = category.name;
        descriptionInput.value = category.description || '';
        
        // Change form state
        submitBtn.textContent = 'Cập nhật Danh mục';
        cancelBtn.style.display = 'inline-block';
    }
}

// Update Category
async function updateCategory(id, category) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Danh mục đã được cập nhật thành công!');
            resetForm();
            getCategories();
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating category:', error);
        alert('Không thể cập nhật danh mục.');
    }
}

// Delete Category
async function deleteCategory(id) {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
        try {
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Danh mục đã bị xóa thành công!');
                getCategories();
            } else {
                alert(`Lỗi: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Không thể xóa danh mục.');
        }
    }
}

// Reset Form
function resetForm() {
    categoryForm.reset();
    categoryIdInput.value = '';
    submitBtn.textContent = 'Thêm Danh mục';
    cancelBtn.style.display = 'none';
}

// Event Listeners
categoryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const category = {
        name: nameInput.value,
        description: descriptionInput.value
    };
    
    if (categoryIdInput.value) {
        // Update existing category
        updateCategory(categoryIdInput.value, category);
    } else {
        // Add new category
        addCategory(category);
    }
});

cancelBtn.addEventListener('click', resetForm);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    getCategories();
});