cat > script.js << 'EOF'
// Основной скрипт магазина GOTHYXAN
class GothyxanStore {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('gothyxan_cart')) || [];
        this.products = [];
        this.categories = [];
        this.init();
    }
    
    async init() {
        // Загружаем данные
        await this.loadProducts();
        await this.loadCategories();
        
        // Инициализируем корзину
        this.updateCartCount();
        
        // Загружаем контент на страницу
        this.loadPageContent();
        
        // Инициализируем события
        this.bindEvents();
        
        // Считаем посетителя
        this.countVisitor();
        
        console.log('GOTHYXAN Store загружен');
    }
    
    countVisitor() {
        let visitors = parseInt(localStorage.getItem('site_visitors')) || 0;
        visitors++;
        localStorage.setItem('site_visitors', visitors);
    }
    
    async loadProducts() {
        try {
            const response = await fetch('./src/data/products.json');
            const data = await response.json();
            this.products = data.products || data;
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.products = [];
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('./src/data/categories.json');
            const data = await response.json();
            this.categories = data.categories || data;
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.categories = [];
        }
    }
    
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(el => {
            el.textContent = totalItems;
        });
        localStorage.setItem('gothyxan_cart', JSON.stringify(this.cart));
    }
    
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('Товар не найден');
            return;
        }
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: product.image,
                size: null,
                color: null
            });
        }
        
        this.updateCartCount();
        this.showNotification(`"${product.name}" добавлен в корзину`);
    }
    
    removeFromCart(index) {
        if (index >= 0 && index < this.cart.length) {
            const itemName = this.cart[index].name;
            this.cart.splice(index, 1);
            this.updateCartCount();
            this.showNotification(`"${itemName}" удален из корзины`);
        }
    }
    
    updateQuantity(index, newQuantity) {
        if (newQuantity < 1) {
            this.removeFromCart(index);
            return;
        }
        
        this.cart[index].quantity = newQuantity;
        this.updateCartCount();
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    showNotification(message, type = 'success') {
        // Удаляем предыдущие уведомления
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    loadPageContent() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        if (page === 'index.html' || page === '') {
            this.renderCategories();
            this.renderFeaturedProducts();
        }
    }
    
    renderCategories() {
        const container = document.getElementById('categories-container');
        if (!container || this.categories.length === 0) return;
        
        const html = this.categories.map(category => `
            <div class="category-card" onclick="window.location.href='./${category.slug}.html'">
                <img src="${category.image || 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${category.name}" class="category-image">
                <div class="category-overlay">
                    <h3 class="category-name">${category.name}</h3>
                    <p>Смотреть коллекцию →</p>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    renderFeaturedProducts() {
        const container = document.getElementById('featured-products');
        if (!container || this.products.length === 0) return;
        
        // Берем первые 6 товаров как featured
        const featured = this.products.slice(0, 6);
        
        const html = featured.map(product => `
            <div class="product-card">
                <img src="${product.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price} €</p>
                    <button class="btn-add-to-cart" data-id="${product.id}">
                        ДОБАВИТЬ В КОРЗИНУ
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    bindEvents() {
        // Делегирование событий для кнопок "В корзину"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-to-cart')) {
                const productId = parseInt(e.target.dataset.id);
                this.addToCart(productId);
            }
        });
        
        // Мобильное меню
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
            
            // Закрываем меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.header') && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                }
            });
        }
        
        // Закрываем меню при ресайзе
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && mainNav) {
                mainNav.classList.remove('active');
            }
        });
    }
}

// Запускаем магазин
const store = new GothyxanStore();
window.store = store;
EOF
