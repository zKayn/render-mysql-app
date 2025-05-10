// API Base URL
const API_URL = window.location.origin; // Sử dụng origin hiện tại thay vì hardcode

// Biến cho phân trang và tìm kiếm
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let categoryFilter = '';
let itemsPerPage = 10;

// Hàm getProducts cải tiến để xử lý lỗi tốt hơn
async function getProducts() {
    try {
        console.log("Đang lấy danh sách sản phẩm...");
        
        // Thử sử dụng API search trước
        let data;
        let useSearchAPI = true;
        
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
            
            const searchResponse = await fetch(url);
            if (!searchResponse.ok) {
                throw new Error(`API search không khả dụng: ${searchResponse.status}`);
            }
            
            data = await searchResponse.json();
            
            // Cập nhật biến phân trang
            totalPages = data.totalPages || 1;
            currentPage = data.currentPage || 1;
            
            // Cập nhật UI phân trang nếu phần tử tồn tại
            if (typeof updatePaginationUI === 'function') {
                updatePaginationUI();
            }
            
            // Kiểm tra dữ liệu items
            if (!data.items) {
                throw new Error("API search không trả về items");
            }
            
            // Render sản phẩm từ data.items
            renderProducts(data.items);
            
        } catch (searchError) {
            console.log("API search không khả dụng, sử dụng API gốc:", searchError.message);
            useSearchAPI = false;
        }
        
        // Nếu API search không khả dụng, sử dụng API gốc
        if (!useSearchAPI) {
            const response = await fetch(`${API_URL}/products`);
            
            if (!response.ok) {
                throw new Error(`API products không khả dụng: ${response.status}`);
            }
            
            data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error("API products không trả về mảng");
            }
            
            renderProducts(data);
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
        productList.innerHTML = '<tr><td colspan="5">Không thể tải dữ liệu sản phẩm.</td></tr>';
    }
}

// Cập nhật hàm renderProducts để xử lý lỗi tốt hơn
function renderProducts(products) {
    productList.innerHTML = '';
    
    if (!products || !Array.isArray(products) || products.length === 0) {
        productList.innerHTML = '<tr><td colspan="5">Không có sản phẩm nào.</td></tr>';
        return;
    }
    
    products.forEach(product => {
        if (!product || typeof product !== 'object') {
            console.error("Sản phẩm không hợp lệ:", product);
            return;
        }
        
        try {
            const row = document.createElement('tr');
            
            // Kiểm tra và sử dụng định dạng hiển thị phù hợp với dữ liệu
            const hasCategoryField = typeof product.category_name !== 'undefined';
            
            row.innerHTML = `
                <td>${product.id || 'N/A'}</td>
                <td>${product.name || 'N/A'}</td>
                <td>${formatCurrency(product.price || 0)}</td>
                ${hasCategoryField ? `<td>${product.category_name || 'Chưa phân loại'}</td>` : ''}
                <td>
                    <button class="edit-btn" data-id="${product.id}">Sửa</button>
                    <button class="delete-btn" data-id="${product.id}">Xóa</button>
                    ${hasCategoryField ? `<button class="category-btn" data-id="${product.id}">Phân loại</button>` : ''}
                </td>
            `;
            productList.appendChild(row);
        } catch (error) {
            console.error("Lỗi khi render sản phẩm:", error, product);
        }
    });
    
    // Add event listeners
    try {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => editProduct(button.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => deleteProduct(button.dataset.id));
        });
        
        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => openCategoryModal(button.dataset.id));
        });
    } catch (error) {
        console.error("Lỗi khi thêm event listeners:", error);
    }
}

// Thêm hàm cập nhật UI phân trang nếu chưa tồn tại
function updatePaginationUI() {
    if (!pageInfoSpan) return;
    
    try {
        pageInfoSpan.textContent = `Trang ${currentPage} của ${totalPages}`;
        
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    } catch (error) {
        console.error("Lỗi khi cập nhật UI phân trang:", error);
    }
}

// Thêm hàm openCategoryModal nếu chưa tồn tại
async function openCategoryModal(productId) {
    try {
        // Lấy chi tiết sản phẩm
        const product = await getProductById(productId);
        
        // Lấy danh sách danh mục
        const response = await fetch(`${API_URL}/categories`);
        
        if (!response.ok) {
            throw new Error(`Không thể lấy danh mục: ${response.status}`);
        }
        
        const categories = await response.json();
        
        if (!Array.isArray(categories)) {
            throw new Error("API categories không trả về mảng");
        }
        
        if (categories.length === 0) {
            alert("Chưa có danh mục nào. Hãy thêm danh mục trước!");
            return;
        }
        
        // Hiển thị prompt cho người dùng chọn
        const categoryOptions = categories.map(c => `${c.id}: ${c.name}`).join('\n');
        const selectedCategory = prompt(
            `Chọn danh mục cho sản phẩm "${product.name}":\n` +
            `Nhập ID danh mục:\n${categoryOptions}`,
            product.category_id || ''
        );
        
        if (selectedCategory === null) return; // Người dùng hủy
        
        // Kiểm tra ID danh mục hợp lệ
        const categoryId = parseInt(selectedCategory);
        if (isNaN(categoryId)) {
            alert("ID danh mục không hợp lệ!");
            return;
        }
        
        // Thực hiện cập nhật
        await updateProductCategory(productId, categoryId);
        
    } catch (error) {
        console.error("Lỗi khi mở modal danh mục:", error);
        alert("Đã xảy ra lỗi khi cập nhật danh mục");
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
            alert(`Lỗi: ${data.message || 'Không thể cập nhật danh mục'}`);
        }
    } catch (error) {
        console.error("Lỗi cập nhật danh mục sản phẩm:", error);
        alert("Không thể cập nhật danh mục cho sản phẩm");
    }
}

// Function khởi tạo để kiểm tra các phần tử UI có tồn tại
function initializeUI() {
    // Kiểm tra và khởi tạo các phần tử tìm kiếm và phân trang
    try {
        // Search elements
        if (document.getElementById('searchInput') && document.getElementById('searchBtn')) {
            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');
            
            searchBtn.addEventListener('click', () => {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                getProducts();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = searchInput.value.trim();
                    currentPage = 1;
                    getProducts();
                }
            });
        }
        
        // Category filter
        if (document.getElementById('categoryFilter')) {
            const categoryFilterSelect = document.getElementById('categoryFilter');
            
            // Lấy danh sách danh mục
            fetch(`${API_URL}/categories`)
                .then(response => response.json())
                .then(categories => {
                    categoryFilterSelect.innerHTML = '<option value="">Tất cả danh mục</option>';
                    
                    if (Array.isArray(categories)) {
                        categories.forEach(category => {
                            const option = document.createElement('option');
                            option.value = category.id;
                            option.textContent = category.name;
                            categoryFilterSelect.appendChild(option);
                        });
                    }
                })
                .catch(error => console.error("Lỗi lấy danh mục:", error));
            
            categoryFilterSelect.addEventListener('change', () => {
                categoryFilter = categoryFilterSelect.value;
                currentPage = 1;
                getProducts();
            });
        }
        
        // Pagination elements
        if (document.getElementById('prevPage') && document.getElementById('nextPage') && document.getElementById('pageInfo')) {
            window.prevPageBtn = document.getElementById('prevPage');
            window.nextPageBtn = document.getElementById('nextPage');
            window.pageInfoSpan = document.getElementById('pageInfo');
            
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
        }
        
        // Items per page
        if (document.getElementById('itemsPerPage')) {
            const itemsPerPageSelect = document.getElementById('itemsPerPage');
            
            itemsPerPageSelect.addEventListener('change', () => {
                itemsPerPage = parseInt(itemsPerPageSelect.value);
                currentPage = 1;
                getProducts();
            });
        }
    } catch (error) {
        console.error("Lỗi khởi tạo UI:", error);
    }
}

// Cập nhật phần khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    getProducts();
    initializeUI();
});