// Админ-панель GOTHYXAN Store
class AdminPanel {
    constructor() {
        // Проверка авторизации
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.products = [];
        this.categories = [];
        this.visitors = [];
        this.orders = [];
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    checkAuth() {
        return localStorage.getItem('admin_authenticated') === 'true';
    }
    
    loadSettings() {
        return JSON.parse(localStorage.getItem('gothyxan_settings')) || {
            storeName: 'GOTHYXAN STORE',
            storeEmail: 'orders@gothyxan.com',
            storePhone: '+7 (999) 123-45-67',
            adminPassword: 'admin123',
            ipapiKey: '',
            currency: '€',
            defaultLanguage: 'ru'
        };
    }
    
    async init() {
        // Загружаем данные
        await this.loadProducts();
        await this.loadCategories();
        await this.loadVisitors();
        await this.loadOrders();
        
        // Отображаем данные
        this.showTab('products');
        this.renderProducts();
        this.renderCategories();
        this.renderVisitors();
        this.renderOrders();
        this.updateAnalytics();
        this.loadSettingsToForm();
        
        // Назначаем обработчики
        this.bindEvents();
        
        console.log('Админ-панель загружена');
    }
    
    async loadProducts() {
        try {
            const response = await fetch('../src/data/products.json');
            const data = await response.json();
            this.products = data.products || data || [];
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.products = [];
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch('../src/data/categories.json');
            const data = await response.json();
            this.categories = data.categories || data || [];
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.categories = [];
        }
    }
    
    loadVisitors() {
        this.visitors = JSON.parse(localStorage.getItem('gothyxan_visitors')) || [];
    }
    
    loadOrders() {
        this.orders = JSON.parse(localStorage.getItem('gothyxan_orders')) || [];
    }
    
    // ========== РЕНДЕРИНГ ==========
    
    renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;
        
        if (this.products.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Товаров пока нет</p>';
            return;
        }
        
        container.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <img src="${product.image || 'https://via.placeholder.com/100'}" 
                         style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px;">
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 5px;">${product.name}</h3>
                        <p style="color: white; font-size: 1.2em; font-weight: bold;">${product.price} ${this.settings.currency}</p>
                        <p style="color: #888; font-size: 0.9em; margin-top: 5px;">ID: ${product.id} • ${product.category}</p>
                    </div>
                </div>
                
                <div class="category-tags">
                    ${product.sizes ? product.sizes.map(size => 
                        `<span class="category-tag">${size}</span>`
                    ).join('') : ''}
                    
                    ${product.tags ? product.tags.map(tag => 
                        `<span class="category-tag" style="background: #444;">${tag}</span>`
                    ).join('') : ''}
                </div>
                
                <p style="color: #aaa; margin-top: 10px; font-size: 0.9em; line-height: 1.4;">
                    ${product.description?.substring(0, 100)}${product.description?.length > 100 ? '...' : ''}
                </p>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="admin.editProduct(${product.id})" class="btn" style="flex: 1; padding: 8px;">
                        ✏️ Редактировать
                    </button>
                    <button onclick="admin.deleteProduct(${product.id})" class="btn btn-danger" style="flex: 1; padding: 8px;">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;
        
        container.innerHTML = this.categories.map(cat => `
            <div class="product-card">
                <h3>${cat.name}</h3>
                <p style="color: #888; margin: 5px 0;">Slug: ${cat.slug}</p>
                <div style="margin-top: 15px;">
                    <button onclick="admin.editCategory('${cat.id}')" class="btn" style="padding: 5px 10px; font-size: 0.9em;">
                        Редактировать
                    </button>
                    <button onclick="admin.deleteCategory('${cat.id}')" class="btn btn-danger" style="padding: 5px 10px; font-size: 0.9em; margin-left: 10px;">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderVisitors() {
        // Обновляем статистику
        const uniqueVisitors = localStorage.getItem('unique_visits') || '0';
        const totalViews = Object.values(JSON.parse(localStorage.getItem('page_views')) || {}).reduce((a, b) => a + b, 0);
        
        document.getElementById('unique-visitors').textContent = uniqueVisitors;
        document.getElementById('total-views').textContent = totalViews;
        
        // Считаем просмотры за сегодня
        const today = new Date().toDateString();
        const todayVisitors = this.visitors.filter(v => {
            const visitDate = new Date(v.timestamp).toDateString();
            return visitDate === today;
        }).length;
        
        document.getElementById('today-views').textContent = todayVisitors;
        
        // Считаем уникальные страны
        const countries = [...new Set(this.visitors.map(v => v.country).filter(Boolean))];
        document.getElementById('countries-count').textContent = countries.length;
        
        // Рендерим таблицу
        const table = document.getElementById('visitors-table');
        if (table) {
            const tbody = table.querySelector('tbody');
            const recentVisitors = this.visitors.slice(-20).reverse(); // Последние 20
            
            tbody.innerHTML = recentVisitors.map(visitor => `
                <tr>
                    <td>${new Date(visitor.timestamp).toLocaleString()}</td>
                    <td><code>${visitor.ip}</code></td>
                    <td>${visitor.country || 'Неизвестно'}</td>
                    <td>${visitor.city || '-'}</td>
                    <td>${visitor.page}</td>
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                        title="${visitor.userAgent}">
                        ${visitor.userAgent?.substring(0, 30)}...
                    </td>
                </tr>
            `).join('');
        }
    }
    
    renderOrders() {
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        if (this.orders.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Заказов пока нет</p>';
            return;
        }
        
        container.innerHTML = this.orders.map(order => `
            <div class="order-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="display: inline-block;">Заказ #${order.id}</h3>
                        <span class="order-status status-${order.status || 'new'}">
                            ${this.getStatusText(order.status)}
                        </span>
                    </div>
                    <div style="font-size: 1.2em; font-weight: bold;">
                        ${order.total} ${this.settings.currency}
                    </div>
                </div>
                
                <p><strong>Клиент:</strong> ${order.customer?.name || 'Не указано'} • ${order.customer?.phone || 'Не указано'}</p>
                <p><strong>Товары:</strong> ${order.items?.length || 0} шт.</p>
                <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <select onchange="admin.updateOrderStatus(${order.id}, this.value)" 
                            style="background: #333; color: white; padding: 5px; border: none; border-radius: 3px;">
                        <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новый</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                    </select>
                    
                    <button onclick="admin.viewOrderDetails(${order.id})" class="btn" style="padding: 5px 10px;">
                        📋 Детали
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getStatusText(status) {
        const statuses = {
            'new': 'Новый',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || 'Новый';
    }
    
    updateAnalytics() {
        // Всего товаров
        document.getElementById('analytics-products').textContent = this.products.length;
        
        // Всего заказов
        document.getElementById('analytics-orders').textContent = this.orders.length;
        
        // Выручка
        const revenue = this.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById('analytics-revenue').textContent = `${revenue} ${this.settings.currency}`;
        
        // Конверсия (примерная)
        const uniqueVisits = parseInt(localStorage.getItem('unique_visits')) || 1;
        const conversionRate = ((this.orders.length / uniqueVisits) * 100).toFixed(1);
        document.getElementById('analytics-conversion').textContent = `${conversionRate}%`;
        
        // Популярные товары
        this.renderPopularProducts();
    }
    
    renderPopularProducts() {
        // Здесь можно добавить логику подсчета популярных товаров
        const container = document.getElementById('popular-products');
        if (!container) return;
        
        // Просто показываем первые 4 товара
        const popular = this.products.slice(0, 4);
        
        container.innerHTML = popular.map(product => `
            <div class="product-card">
                <img src="${product.image}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                <h4>${product.name}</h4>
                <p style="color: white; font-weight: bold;">${product.price} ${this.settings.currency}</p>
            </div>
        `).join('');
    }
    
    // ========== УПРАВЛЕНИЕ ТОВАРАМИ =