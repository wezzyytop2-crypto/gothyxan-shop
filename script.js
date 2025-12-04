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

// ======================
// ТРЕКИНГ ПОСЕТИТЕЛЕЙ
// ======================

class VisitorTracker {
    constructor() {
        this.apiKey = 'YOUR_API_KEY'; // Получи на ipapi.co
        this.init();
    }
    
    async init() {
        await this.trackVisit();
        this.logPageView();
    }
    
    async trackVisit() {
        try {
            // Получаем IP и информацию о посетителе
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            const visitor = {
                ip: data.ip,
                country: data.country_name,
                city: data.city,
                timezone: data.timezone,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            };
            
            // Сохраняем в localStorage
            this.saveVisitor(visitor);
            
            // Отправляем на сервер (если есть)
            this.sendToServer(visitor);
            
        } catch (error) {
            console.log('Трекинг: использован fallback метод');
            this.trackWithFallback();
        }
    }
    
    trackWithFallback() {
        // Простой трекинг если API не работает
        const visitor = {
            ip: 'unknown',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            referrer: document.referrer || 'direct'
        };
        
        this.saveVisitor(visitor);
    }
    
    saveVisitor(visitor) {
        // Получаем существующих посетителей
        let visitors = JSON.parse(localStorage.getItem('gothyxan_visitors')) || [];
        
        // Добавляем нового
        visitors.push(visitor);
        
        // Сохраняем только последние 1000 записей
        if (visitors.length > 1000) {
            visitors = visitors.slice(-1000);
        }
        
        localStorage.setItem('gothyxan_visitors', JSON.stringify(visitors));
        
        // Обновляем счетчик уникальных посетителей
        this.updateUniqueVisitors();
    }
    
    updateUniqueVisitors() {
        // Простой счетчик уникальных посещений
        let visitCount = parseInt(localStorage.getItem('unique_visits')) || 0;
        const lastVisit = localStorage.getItem('last_visit_date');
        const today = new Date().toDateString();
        
        if (lastVisit !== today) {
            visitCount++;
            localStorage.setItem('unique_visits', visitCount);
            localStorage.setItem('last_visit_date', today);
        }
        
        // Обновляем в реальном времени (для админки)
        localStorage.setItem('total_visits', visitCount);
    }
    
    logPageView() {
        let pageViews = JSON.parse(localStorage.getItem('page_views')) || {};
        const page = window.location.pathname;
        
        pageViews[page] = (pageViews[page] || 0) + 1;
        localStorage.setItem('page_views', JSON.stringify(pageViews));
    }
    
    sendToServer(visitor) {
        // Здесь можно отправить данные на твой сервер
        // Например: fetch('https://твой-сервер.com/track', { method: 'POST', body: JSON.stringify(visitor) })
        console.log('Посетитель:', visitor);
    }
}

// Запускаем трекинг
const tracker = new VisitorTracker();

// ======================
// ПЕРЕВОД САЙТА (RU/EN)
// ======================

class SiteTranslator {
    constructor() {
        this.currentLang = localStorage.getItem('site_language') || 'ru';
        this.translations = {
            ru: {
                // Навигация
                'home': 'ГЛАВНАЯ',
                'women': 'ЖЕНЩИНАМ',
                'men': 'МУЖЧИНАМ', 
                'outerwear': 'ВЕРХНЯЯ ОДЕЖДА',
                'omen': 'OMEN',
                'new-collection': 'НОВАЯ КОЛЛЕКЦИЯ',
                'about': 'О НАС',
                'cart': 'КОРЗИНА',
                
                // Герой секция
                'new-collection-title': 'НОВАЯ КОЛЛЕКЦИЯ',
                'out-now': 'УЖЕ В ПРОДАЖЕ',
                'shop-now': 'КУПИТЬ СЕЙЧАС',
                
                // Категории
                'shop-by-category': 'КАТЕГОРИИ ТОВАРОВ',
                'view-collection': 'СМОТРЕТЬ КОЛЛЕКЦИЮ →',
                
                // Товары
                'featured-products': 'ПОПУЛЯРНЫЕ ТОВАРЫ',
                'add-to-cart': 'ДОБАВИТЬ В КОРЗИНУ',
                'price': '€',
                
                // Корзина
                'cart-empty': 'КОРЗИНА ПУСТА',
                'add-items': 'Добавьте товары из каталога',
                'go-to-shop': 'ПЕРЕЙТИ В МАГАЗИН',
                'total': 'ИТОГО',
                'checkout': 'ОФОРМИТЬ ЗАКАЗ',
                'remove': 'УДАЛИТЬ',
                'quantity': 'КОЛ-ВО',
                
                // Футер
                'official-store': 'ОФИЦИАЛЬНЫЙ МАГАЗИН',
                'premium-streetwear': 'Уличная одежда премиум-класса',
                'information': 'ИНФОРМАЦИЯ',
                'delivery-payment': 'Доставка и оплата',
                'contacts': 'Контакты',
                'privacy-policy': 'Политика конфиденциальности',
                'copyright': 'Все права защищены',
                'admin-panel': 'Админ-панель'
            },
            en: {
                // Navigation
                'home': 'HOME',
                'women': 'WOMEN',
                'men': 'MEN',
                'outerwear': 'OUTERWEAR',
                'omen': 'OMEN',
                'new-collection': 'NEW COLLECTION',
                'about': 'ABOUT',
                'cart': 'CART',
                
                // Hero section
                'new-collection-title': 'NEW COLLECTION',
                'out-now': 'OUT NOW',
                'shop-now': 'SHOP NOW',
                
                // Categories
                'shop-by-category': 'SHOP BY CATEGORY',
                'view-collection': 'VIEW COLLECTION →',
                
                // Products
                'featured-products': 'FEATURED PRODUCTS',
                'add-to-cart': 'ADD TO CART',
                'price': '€',
                
                // Cart
                'cart-empty': 'CART IS EMPTY',
                'add-items': 'Add items from catalog',
                'go-to-shop': 'GO TO SHOP',
                'total': 'TOTAL',
                'checkout': 'CHECKOUT',
                'remove': 'REMOVE',
                'quantity': 'QTY',
                
                // Footer
                'official-store': 'OFFICIAL STORE',
                'premium-streetwear': 'Premium streetwear',
                'information': 'INFORMATION',
                'delivery-payment': 'Delivery & Payment',
                'contacts': 'Contacts',
                'privacy-policy': 'Privacy Policy',
                'copyright': 'All rights reserved',
                'admin-panel': 'Admin Panel'
            }
        };
        
        this.init();
    }
    
    init() {
        this.applyLanguage(this.currentLang);
        this.addLanguageSwitcher();
    }
    
    applyLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('site_language', lang);
        
        // Обновляем все элементы с data-translate атрибутом
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (this.translations[lang] && this.translations[lang][key]) {
                element.textContent = this.translations[lang][key];
            }
        });
        
        // Обновляем атрибут lang у html
        document.documentElement.lang = lang;
        
        // Обновляем кнопку перевода
        const switcher = document.querySelector('.lang-switcher');
        if (switcher) {
            switcher.textContent = lang === 'ru' ? 'EN' : 'RU';
        }
    }
    
    addLanguageSwitcher() {
        // Создаем кнопку перевода если её нет
        if (!document.querySelector('.lang-switcher')) {
            const switcher = document.createElement('button');
            switcher.className = 'lang-switcher';
            switcher.textContent = this.currentLang === 'ru' ? 'EN' : 'RU';
            switcher.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                color: black;
                border: none;
                padding: 10px 15px;
                border-radius: 50%;
                cursor: pointer;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            
            switcher.onclick = () => {
                const newLang = this.currentLang === 'ru' ? 'en' : 'ru';
                this.applyLanguage(newLang);
            };
            
            document.body.appendChild(switcher);
        }
    }
    
    translate(key) {
        return this.translations[this.currentLang][key] || key;
    }
}

// Запускаем переводчик
const translator = new SiteTranslator();
