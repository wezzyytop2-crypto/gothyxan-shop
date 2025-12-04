// Основной скрипт магазина
class GothyxanStore {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('gothyxan_cart')) || [];
        this.products = [];
        this.init();
    }
    
    async init() {
        // Загружаем товары
        await this.loadProducts();
        
        // Инициализируем корзину
        this.updateCartCount();
        
        // Загружаем контент на страницу
        this.loadPageContent();
        
        // Инициализируем события
        this.bindEvents();
    }
    
    async loadProducts() {
        try {
            const response = await fetch('src/data/products.json');
            this.products = await response.json();
            console.log('Товары загружены:', this.products.length);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }
    
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
        localStorage.setItem('gothyxan_cart', JSON.stringify(this.cart));
    }
    
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: product.image
            });
        }
        
        this.updateCartCount();
        this.showNotification('Товар добавлен в корзину');
    }
    
        showNotification(message) {
            // Создаем уведомление
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            color: black;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
            document.body.appendChild(notification);
        
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    
        loadPageContent() {
            const app = document.getElementById('app');
            if (!app) return;
        
            // Определяем текущую страницу
            const path = window.location.pathname;
        
            // Загружаем соответствующий контент
            if (path.includes('shop') || path === '/') {
                this.renderProductGrid();
            }
            // Добавьте другие условия для разных страниц
        }
    
        renderProductGrid() {
            const app = document.getElementById('app');
            if (!app || this.products.length === 0) return;
        
            const html = `
            <section class="products-section">
                <div class="container">
                    <h2 class="section-title">НОВАЯ КОЛЛЕКЦИЯ</h2>
                    <div class="products-grid">
                        ${this.products.map(product => `
                            <div class="product-card">
                                <div class="product-image">
                                    <img src="src/assets/images/${product.image}" alt="${product.name}">
                                </div>
                                <div class="product-info">
                                    <h3 class="product-name">${product.name}</h3>
                                    <p class="product-price">${product.price} ₽</p>
                                    <button class="btn btn-add-to-cart" data-id="${product.id}">
                                        В КОРЗИНУ
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
        
            app.innerHTML = html;
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
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    const nav = document.querySelector('.main-nav');
                    nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
                });
            }
        }
    }

    // Запускаем магазин при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        window.store = new GothyxanStore();
    });