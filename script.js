// Shop functionality with localStorage
let products = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'default';
let currentPage = 1;
const itemsPerPage = 4;
const CART_STORAGE_KEY = 'simpleShopCart';

// DOM elements
const productsContainer = document.querySelector('.products');
const cartContainer = document.querySelector('.cart');
const cartToggle = document.querySelector('#cart-toggle');
const cartElement = document.querySelector('.cart-container');
const totalElement = document.querySelector('.total');
const checkoutBtn = document.querySelector('#checkout-btn');

// Cart management with localStorage
function getCartFromStorage() {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
}

function saveCartToStorage(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('./shop.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        products = await response.json();

        // Validate products array
        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('Invalid products data');
        }

        filteredProducts = products;
        createCategoryFilter();
        displayProducts();
        updateProductCount();
        console.log(`Successfully loaded ${products.length} products`);
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <h3>Error loading products</h3>
                <p>Please check your internet connection and try refreshing the page.</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Create category filter and search
function createCategoryFilter() {
    const container = document.querySelector('.container');

    // Remove existing filter if it exists
    const existingFilter = container.querySelector('.filter-section');
    if (existingFilter) {
        existingFilter.remove();
    }

    // Get unique categories
    const categories = ['all', ...new Set(products.map(product => product.category))];

    // Create filter section container
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';

    // Create search bar and sort dropdown
    const searchHTML = `
        <div class="search-sort-container">
            <div class="search-container">
                <input type="text" id="product-search" placeholder="Search products..." onkeyup="searchProducts()">
                <i class="fa-solid fa-search search-icon"></i>
            </div>
            <div class="sort-container">
                <select id="sort-select" onchange="sortProducts(this.value)">
                    <option value="default">Sort by</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                </select>
                <i class="fa-solid fa-sort sort-icon"></i>
            </div>
        </div>
    `;

    // Create filter buttons
    const filterHTML = categories.map(category => `
        <button class="filter-btn ${category === currentCategory ? 'active' : ''}" 
                onclick="filterByCategory('${category}')">
            ${category === 'all' ? 'All Products' : category}
        </button>
    `).join('');

    filterSection.innerHTML = `
        ${searchHTML}
        <div class="category-filter">
            ${filterHTML}
            <div class="product-count"></div>
        </div>
    `;

    // Insert filter before products container
    container.insertBefore(filterSection, productsContainer);
}

// Search products functionality
function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryProducts = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);

    if (searchTerm === '') {
        filteredProducts = categoryProducts;
    } else {
        filteredProducts = categoryProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Reset pagination when search changes
    resetPagination();

    // Apply current sorting after search
    applySorting();
    displayProducts();
    updateProductCount();
}

// Sort products functionality
function sortProducts(sortValue) {
    currentSort = sortValue;

    // Reset pagination when sorting changes
    resetPagination();

    applySorting();
    displayProducts();
    updateProductCount();
}

// Apply sorting to filtered products
function applySorting() {
    switch (currentSort) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'default':
        default:
            // Sort by original order (by id)
            filteredProducts.sort((a, b) => a.id - b.id);
            break;
    }
}

// Pagination utility functions
function getTotalPages() {
    return Math.ceil(filteredProducts.length / itemsPerPage);
}

function getCurrentPageItems() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayProducts();
        updatePaginationControls();
        updateProductCount();
        // Scroll to top of products section
        document.querySelector('.products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToPrevPage() {
    goToPage(currentPage - 1);
}

function goToNextPage() {
    goToPage(currentPage + 1);
}

function resetPagination() {
    currentPage = 1;
}

// Filter products by category
function filterByCategory(category) {
    currentCategory = category;

    // Clear search when changing category
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.value = '';
    }

    if (category === 'all') {
        filteredProducts = [...products]; // Create a copy
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }

    // Reset pagination when category filter changes
    resetPagination();

    // Apply current sorting
    applySorting();

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="filterByCategory('${category}')"]`).classList.add('active');

    displayProducts();
    updateProductCount();
}

// Display products in the shop
function displayProducts() {
    // Add shop title
    const container = document.querySelector('.container');
    if (!container.querySelector('.shop-title')) {
        const title = document.createElement('h2');
        title.className = 'shop-title';
        title.textContent = 'Our Products';
        container.insertBefore(title, container.firstChild);
    }

    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">No products found in this category.</p>';
        updatePaginationControls();
        return;
    }

    // Get only the current page items
    const currentPageProducts = getCurrentPageItems();

    productsContainer.innerHTML = currentPageProducts.map(product => `
        <div class="product-card" data-category="${product.category}">
            <img src="${product.image || 'https://via.placeholder.com/240x240/cccccc/ffffff?text=No+Image'}" 
                 alt="${product.name}" 
                 class="product-image" 
                 onerror="handleImageError(this)"
                 loading="lazy">
            <div class="product-category">${product.category}</div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        </div>
    `).join('');

    // Update pagination controls after displaying products
    updatePaginationControls();
}

// Update pagination controls
function updatePaginationControls() {
    const container = document.querySelector('.container');
    let paginationContainer = container.querySelector('.pagination-container');

    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        container.appendChild(paginationContainer);
    }

    const totalPages = getTotalPages();

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    paginationContainer.innerHTML = `
        <div class="pagination-controls">
            <button class="pagination-btn prev-btn ${prevDisabled}" onclick="goToPrevPage()" ${prevDisabled}>
                <i class="fa-solid fa-chevron-left"></i> Previous
            </button>
            <div class="page-info">
                Page ${currentPage} of ${totalPages}
            </div>
            <button class="pagination-btn next-btn ${nextDisabled}" onclick="goToNextPage()" ${nextDisabled}>
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

// Update product count display
function updateProductCount() {
    const container = document.querySelector('.container');
    let countElement = container.querySelector('.product-count');

    if (!countElement) {
        countElement = document.createElement('div');
        countElement.className = 'product-count';
        const filterContainer = container.querySelector('.category-filter');
        if (filterContainer) {
            filterContainer.appendChild(countElement);
        }
    }

    const totalFiltered = filteredProducts.length;
    const totalProducts = products.length;

    if (totalFiltered === 0) {
        countElement.textContent = 'No products found';
        return;
    }

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalFiltered);

    if (currentCategory === 'all') {
        countElement.textContent = `Showing ${startItem}-${endItem} of ${totalFiltered} products`;
    } else {
        countElement.textContent = `Showing ${startItem}-${endItem} of ${totalFiltered} products in ${currentCategory}`;
    }
}

// Add product to cart with localStorage
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = getCartFromStorage();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    // Save to localStorage
    saveCartToStorage(cart);
    updateCartDisplay();
    updateCartButton();

    // Show brief feedback
    showAddToCartFeedback();
    console.log('Item added to cart and saved to localStorage');
}

// Remove item from cart with localStorage
function removeFromCart(productId) {
    let cart = getCartFromStorage();
    cart = cart.filter(item => item.id !== productId);

    // Save updated cart to localStorage
    saveCartToStorage(cart);
    updateCartDisplay();
    updateCartButton();
    console.log('Item removed from cart and localStorage updated');
}

// Update cart display from localStorage
function updateCartDisplay() {
    const cart = getCartFromStorage();

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        totalElement.innerHTML = '';
        return;
    }

    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
}

// Update cart button text from localStorage
function updateCartButton() {
    const cart = getCartFromStorage();
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartToggle.textContent = itemCount > 0 ? `Cart (${itemCount})` : 'Cart';
}

// Toggle cart visibility
function toggleCart() {
    cartElement.classList.toggle('active');
}

// Show add to cart feedback
function showAddToCartFeedback() {
    // Simple feedback - could be enhanced with animations
    const originalText = cartToggle.textContent;
    cartToggle.style.backgroundColor = '#4caf50';
    setTimeout(() => {
        cartToggle.style.backgroundColor = '#f5b6d7';
    }, 200);
}

// Checkout functionality with localStorage
function checkout() {
    const cart = getCartFromStorage();

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`Thank you for your purchase! Total: $${total.toFixed(2)}\n\nThis is a demo - no actual payment processed.`);

    // Clear cart from localStorage after checkout
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartDisplay();
    updateCartButton();
    toggleCart();
    console.log('Cart cleared from localStorage after checkout');
}

// Event listeners with localStorage initialization
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // Load cart from localStorage on page load
    updateCartDisplay();
    updateCartButton();
    console.log('Cart loaded from localStorage on page load');

    cartToggle.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', checkout);

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cartElement.contains(e.target) && e.target !== cartToggle) {
            cartElement.classList.remove('active');
        }
    });
});

// Handle image loading errors
function handleImageError(img) {
    if (img.src !== 'https://via.placeholder.com/240x240/cccccc/ffffff?text=Image+Not+Found') {
        img.src = 'https://via.placeholder.com/240x240/cccccc/ffffff?text=Image+Not+Found';
        console.warn('Image failed to load:', img.alt);
    }
}

// Improve filter error handling
function safeFilterByCategory(category) {
    try {
        filterByCategory(category);
    } catch (error) {
        console.error('Error filtering products:', error);
        // Fallback to showing all products
        currentCategory = 'all';
        filteredProducts = products;
        displayProducts();
        updateProductCount();
    }
}

// Test localStorage functionality
function testLocalStorage() {
    console.log('Current cart in localStorage:', getCartFromStorage());
}