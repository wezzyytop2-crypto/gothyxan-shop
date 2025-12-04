// АВТОМАТИЗИРОВАННАЯ АДМИН-ПАНЕЛЬ GOTHYXAN
class AutoAdminPanel {
    constructor() {
        // Проверка авторизации
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.GITHUB_TOKEN = localStorage.getItem('github_token') || '';
        this.REPO_OWNER = 'wezzyytop2-crypto';
        this.REPO_NAME = 'gothyxan-shop';
        this.products = [];
        this.categories = [];
        
        this.init();
    }
    
    checkAuth() {
        return localStorage.getItem('admin_authenticated') === 'true';
    }
    
    async init() {
        // Загружаем настройки
        this.loadSettings();
        
        // Загружаем данные
        await this.loadProductsFromGitHub();
        await this.loadCategoriesFromGitHub();
        
        // Инициализируем UI
        this.initUI();
        this.bindEvents();
        
        console.log('Автоадминка загружена');
    }
    
    loadSettings() {
        this.settings = JSON.parse(localStorage.getItem('gothyxan_settings')) || {
            github_token: '',
            store_name: 'GOTHYXAN STORE',
            currency: '€'
        };
        
        if (!this.GITHUB_TOKEN && this.settings.github_token) {
            this.GITHUB_TOKEN = this.settings.github_token;
        }
    }
    
    async loadProductsFromGitHub() {
        try {
            const response = await fetch('../src/data/products.json');
            const data = await response.json();
            this.products = data.products || data || [];
            this.renderProducts();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.products = [];
        }
    }
    
    async loadCategoriesFromGitHub() {
        try {
            const response = await fetch('../src/data/categories.json');
            const data = await response.json();
            this.categories = data.categories || data || [];
            this.renderCategories();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.categories = [];
        }
    }
    
    // ========== СОХРАНЕНИЕ НА GITHUB ==========
    
    async saveToGitHub(filePath, content, commitMessage) {
        if (!this.GITHUB_TOKEN) {
            this.showGitHubTokenPrompt();
            return false;
        }
        
        try {
            // 1. Получаем текущий SHA файла
            const fileUrl = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents/${filePath}`;
            const fileResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            let sha = '';
            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.sha;
            }
            
            // 2. Обновляем файл
            const updateResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: sha || undefined
                })
            });
            
            if (updateResponse.ok) {
                this.showSuccess('✅ Данные успешно сохранены на GitHub!');
                return true;
            } else {
                const error = await updateResponse.json();
                this.showError('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
                return false;
            }
            
        } catch (error) {
            console.error('GitHub API ошибка:', error);
            this.showError('Ошибка соединения с GitHub');
            return false;
        }
    }
    
    async saveProducts() {
        const productsData = {
            products: this.products,
            last_updated: new Date().toISOString(),
            total: this.products.length
        };
        
        const success = await this.saveToGitHub(
            'src/data/products.json',
            JSON.stringify(productsData, null, 2),
            '🔄 Автообновление товаров через админку'
        );
        
        if (success) {
            // Обновляем сайт через 5 секунд
            setTimeout(() => {
                this.showNotification('🔄 Сайт обновляется...');
            }, 5000);
        }
    }
    
    async saveCategories() {
        const categoriesData = {
            categories: this.categories,
            last_updated: new Date().toISOString()
        };
        
        await this.saveToGitHub(
            'src/data/categories.json',
            JSON.stringify(categoriesData, null, 2),
            '🏷️ Обновление категорий через админку'
        );
    }
    
    // ========== УПРАВЛЕНИЕ ТОВАРАМИ ==========
    
    async addProduct(productData) {
        // Генерируем ID
        const newId = this.products.length > 0 
            ? Math.max(...this.products.map(p => p.id)) + 1 
            : 1;
        
        const newProduct = {
            id: newId,
            ...productData,
                createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
    };
        
    this.products.push(newProduct);
        await this.saveProducts();
        this.renderProducts();
        
        return newProduct;
    }
    
    async updateProduct(productId, updates) {
        const index = this.products.findIndex(p => p.id === productId);
        if (index === -1) return false;
        
        this.products[index] = {
            ...this.products[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await this.saveProducts();
        this.renderProducts();
        return true;
    }
    
    async deleteProduct(productId) {
        if (!confirm('Удалить этот товар?')) return false;
        
        this.products = this.products.filter(p => p.id !== productId);
        await this.saveProducts();
        this.renderProducts();
        return true;
    }
    
    // ========== UI ФУНКЦИИ ==========
    
    showGitHubTokenPrompt() {
        const token = prompt('Введите GitHub Personal Access Token:\n\n1. Зайдите на: https://github.com/settings/tokens\n2. Создайте token с доступом "repo"\n3. Вставьте сюда:');
        
        if (token && token.trim()) {
            this.GITHUB_TOKEN = token.trim();
            localStorage.setItem('github_token', token.trim());
            
            // Сохраняем в настройках
            if (!this.settings.github_token) {
                this.settings.github_token = token.trim();
                localStorage.setItem('gothyxan_settings', JSON.stringify(this.settings));
            }
            
            this.showSuccess('✅ Токен сохранен! Теперь можно сохранять данные.');
            return true;
        } else {
            this.showError('Токен обязателен для автоматического сохранения!');
            return false;
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const oldNotification = document.querySelector('.admin-notification');
        if (oldNotification) oldNotification.remove();
        
        // Создаем новое
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
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
                        <p style="color: white; font-size: 1.2em; font-weight: bold;">
                            ${product.price} ${this.settings.currency}
                        </p>
                        <p style="color: #888; font-size: 0.9em; margin-top: 5px;">
                            ID: ${product.id} • ${product.category} • ${product.inStock ? 'В наличии' : 'Нет в наличии'}
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="adminPanel.editProduct(${product.id})" class="btn" style="flex: 1; padding: 8px;">
                        ✏️ Редактировать
                    </button>
                    <button onclick="adminPanel.deleteProduct(${product.id})" class="btn btn-danger" style="flex: 1; padding: 8px;">
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
                <p style="color: #888;">${cat.slug}</p>
            </div>
        `).join('');
        }
    
        initUI() {
            // Показываем первую вкладку
            this.showTab('products');
        
            // Обновляем превью изображения
            const imageInput = document.getElementById('product-image');
            if (imageInput) {
                imageInput.addEventListener('input', (e) => {
                    const preview = document.getElementById('image-preview');
                    if (preview) {
                        preview.src = e.target.value;
                        preview.style.display = 'block';
                        document.getElementById('preview-text').style.display = 'none';
                    }
                });
            }
        }
    
        showTab(tabId) {
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
        
            // Показываем нужную
            const tab = document.getElementById(tabId);
            if (tab) tab.classList.add('active');
        
            // Обновляем меню
            document.querySelectorAll('.admin-nav a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + tabId) {
                    link.classList.add('active');
                }
            });
        }
    
        bindEvents() {
            // Форма добавления товара
            const productForm = document.getElementById('product-form');
            if (productForm) {
                productForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                
                    const productData = {
                        name: document.getElementById('product-name').value,
                        price: parseFloat(document.getElementById('product-price').value),
                        category: document.getElementById('product-category').value,
                        description: document.getElementById('product-description').value,
                        image: document.getElementById('product-image').value,
                        sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()),
                        colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()),
                        tags: document.getElementById('product-tags').value.split(',').map(t => t.trim()),
                        inStock: true
                    };
                
                    await this.addProduct(productData);
                    productForm.reset();
                
                    // Сбрасываем превью
                    const preview = document.getElementById('image-preview');
                    if (preview) {
                        preview.style.display = 'none';
                        document.getElementById('preview-text').style.display = 'block';
                    }
                });
            }
        
            // Форма настроек
            const settingsForm = document.getElementById('settings-form');
            if (settingsForm) {
                // Заполняем форму
                document.getElementById('store-name').value = this.settings.store_name || 'GOTHYXAN STORE';
                document.getElementById('store-email').value = this.settings.store_email || 'orders@gothyxan.com';
                document.getElementById('store-phone').value = this.settings.store_phone || '+7 (999) 123-45-67';
                document.getElementById('admin-password').value = this.settings.admin_password || 'admin123';
                document.getElementById('ipapi-key').value = this.settings.ipapi_key || '';
                document.getElementById('store-currency').value = this.settings.currency || '€';
            
                settingsForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                
                    this.settings = {
                        store_name: document.getElementById('store-name').value,
                        store_email: document.getElementById('store-email').value,
                        store_phone: document.getElementById('store-phone').value,
                        admin_password: document.getElementById('admin-password').value,
                        ipapi_key: document.getElementById('ipapi-key').value,
                        currency: document.getElementById('store-currency').value,
                        github_token: this.GITHUB_TOKEN
                    };
                
                    localStorage.setItem('gothyxan_settings', JSON.stringify(this.settings));
                    localStorage.setItem('admin_password', document.getElementById('admin-password').value);
                
                    this.showSuccess('✅ Настройки сохранены!');
                });
            }
        }
    
        editProduct(productId) {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;
        
            // Заполняем форму редактирования
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-sizes').value = product.sizes?.join(', ') || '';
            document.getElementById('product-colors').value = product.colors?.join(', ') || '';
            document.getElementById('product-tags').value = product.tags?.join(', ') || '';
        
            // Показываем превью
            const preview = document.getElementById('image-preview');
            if (preview && product.image) {
                preview.src = product.image;
                preview.style.display = 'block';
                document.getElementById('preview-text').style.display = 'none';
            }
        
            // Меняем кнопку сохранения
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            const oldText = submitBtn.textContent;
            submitBtn.textContent = '💾 ОБНОВИТЬ ТОВАР';
            submitBtn.onclick = async (e) => {
                e.preventDefault();
            
                const updates = {
                    name: document.getElementById('product-name').value,
                    price: parseFloat(document.getElementById('product-price').value),
                    category: document.getElementById('product-category').value,
                    description: document.getElementById('product-description').value,
                    image: document.getElementById('product-image').value,
                    sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()),
                    colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()),
                    tags: document.getElementById('product-tags').value.split(',').map(t => t.trim())
                };
            
                await this.updateProduct(productId, updates);
            
                // Возвращаем кнопку в исходное состояние
                submitBtn.textContent = oldText;
                submitBtn.onclick = null;
            
                // Показываем вкладку с товарами
                this.showTab('products');
            };
        
            // Показываем вкладку добавления товара
            this.showTab('add-product');
        }
    }

    // Глобальные функции для HTML
    function showTab(tabId) {
        if (window.adminPanel) {
            adminPanel.showTab(tabId);
        }
    }

    function logout() {
        localStorage.removeItem('admin_authenticated');
        window.location.href = 'login.html';
    }

    function previewImage(url) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.src = url;
            preview.style.display = 'block';
            document.getElementById('preview-text').style.display = 'none';
        }
    }

    // Инициализация при загрузке
    let adminPanel;
    document.addEventListener('DOMContentLoaded', () => {
        adminPanel = new AutoAdminPanel();
        window.adminPanel = adminPanel;
    });

        // Экспортируем функции для кнопок в HTML
        window.showTab = showTab;
        window.logout = logout;
        window.previewImage = previewImage;
        EOF