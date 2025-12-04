cat > admin/admin.js << 'EOF'
// ПОЛНОСТЬЮ АВТОМАТИЗИРОВАННАЯ АДМИНКА
class FullAutoAdmin {
    constructor() {
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.GITHUB_TOKEN = ''; // Не храним в коде!
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
        await this.loadData();
        this.initUI();
        this.bindEvents();
        this.setupAutoSave();
        
        console.log('Полностью автоматизированная админка готова');
    }
    
    async loadData() {
        try {
            // Загружаем с сайта
            const [productsRes, catsRes] = await Promise.all([
                fetch('../src/data/products.json'),
                fetch('../src/data/categories.json')
            ]);
            
            this.products = (await productsRes.json()).products || [];
            this.categories = (await catsRes.json()).categories || [];
            
            this.renderProducts();
            this.renderCategories();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }
    
    // ========== ПОЛНАЯ АВТОМАТИЗАЦИЯ ==========
    
    async triggerGitHubUpdate(type, data, message) {
        // Используем GitHub API через repository_dispatch
        const response = await fetch(`https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'update_products',
                client_payload: {
                    type: type,
                    products_data: type === 'products' ? JSON.stringify(data) : null,
                    categories_data: type === 'categories' ? JSON.stringify(data) : null,
                    message: message,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        return response.ok;
    }
    
    async autoSaveProducts() {
        const productsData = {
            products: this.products,
            last_updated: new Date().toISOString(),
            total: this.products.length,
            auto_generated: true
        };
        
        // Показываем статус
        this.showStatus('🔄 Сохранение на GitHub...');
        
        try {
            // Вариант A: GitHub Actions (рекомендуется)
            const success = await this.triggerGitHubUpdate(
                'products',
                productsData,
                `Обновлено ${this.products.length} товаров`
            );
            
            if (success) {
                this.showStatus('✅ Данные отправлены! Сайт обновится через 1-2 минуты.', 'success');
                
                // Автоматически перезагружаем данные через 5 секунд
                setTimeout(() => {
                    this.loadData();
                }, 5000);
            } else {
                throw new Error('GitHub API error');
            }
            
        } catch (error) {
            console.log('GitHub Actions не сработал, используем fallback...');
            
            // Вариант B: Fallback - показываем JSON для ручного копирования
            this.showJsonForManualCopy(productsData);
        }
    }
    
    showJsonForManualCopy(data) {
        const jsonString = JSON.stringify(data, null, 2);
        
        this.showNotification(`
            <div style="max-height: 400px; overflow-y: auto;">
                <h4>📋 Скопируй этот JSON и замени на GitHub:</h4>
                <p><code>src/data/products.json</code></p>
                <textarea 
                    id="json-output" 
                    style="
                        width: 100%;
                        height: 200px;
                        background: #222;
                        color: white;
                        border: 1px solid #333;
                        padding: 10px;
                        font-family: monospace;
                        margin: 10px 0;
                    "
                >${jsonString}</textarea>
                <button onclick="copyJson()" class="btn">📋 Копировать JSON</button>
                <button onclick="this.parentElement.parentElement.remove()" class="btn">✕ Закрыть</button>
            </div>
        `, 'info');
        
        window.copyJson = () => {
            const textarea = document.getElementById('json-output');
            textarea.select();
            document.execCommand('copy');
            alert('JSON скопирован в буфер обмена!');
        };
    }
    
    setupAutoSave() {
        // Автосохранение при изменении данных
        let saveTimeout;
        
        const scheduleSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.autoSaveProducts();
            }, 2000); // Сохраняет через 2 секунды после изменений
        };
        
        // Отслеживаем изменения в формах
        document.addEventListener('input', (e) => {
            if (e.target.closest('#product-form')) {
                scheduleSave();
            }
        });
    }
    
    // ========== UI И РЕНДЕРИНГ ==========
    
    renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;
        
        container.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div style="display: flex; gap: 15px; align-items: start;">
                    <img src="${product.image}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0;">${product.name}</h3>
                        <p style="color: white; font-weight: bold; margin: 0 0 5px 0;">
                            ${product.price} €
                        </p>
                        <p style="color: #888; font-size: 0.9em; margin: 0;">
                            ${product.category} • ID: ${product.id}
                        </p>
                    </div>
                    <div>
                        <button onclick="admin.editProduct(${product.id})" 
                                style="background: #333; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
                            ✏️
                        </button>
                        <button onclick="admin.deleteProduct(${product.id})" 
                                style="background: #d32f2f; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
                            🗑️
                        </button>
                    </div>
                </div>
                ${product.description ? `
                    <p style="color: #aaa; margin-top: 10px; font-size: 0.9em;">
                        ${product.description}
                    </p>
                ` : ''}
            </div>
        `).join('');
    }
    
    renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;
        
        container.innerHTML = this.categories.map(cat => `
            <div class="product-card">
                <h3 style="margin: 0 0 10px 0;">${cat.name}</h3>
                <p style="color: #888; margin: 0;">/${cat.slug}</p>
            </div>
        `).join('');
    }
    
    showStatus(message, type = 'info') {
        // Удаляем старый статус
        const oldStatus = document.getElementById('auto-save-status');
        if (oldStatus) oldStatus.remove();
        
        // Создаем новый
        const status = document.createElement('div');
        status.id = 'auto-save-status';
        status.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                animation: slideInUp 0.3s ease;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(status);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (status.parentElement) {
                status.style.animation = 'slideInUp 0.3s ease reverse';
                setTimeout(() => status.remove(), 300);
            }
        }, 5000);
    }
    
        showNotification(html, type = 'info') {
            const notification = document.createElement('div');
            notification.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #222;
                color: white;
                padding: 30px;
                border-radius: 10px;
                z-index: 10000;
                border: 1px solid #333;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            ">
                ${html}
            </div>
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
            " onclick="this.parentElement.remove()"></div>
        `;
        
            document.body.appendChild(notification);
        }
    
        initUI() {
            this.showTab('products');
        
            // Превью изображений
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
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
        
            document.getElementById(tabId)?.classList.add('active');
            document.querySelector(`.admin-nav a[href="#${tabId}"]`)?.classList.add('active');
        }
    
        bindEvents() {
            // Форма товара
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
                        sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
                        colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(Boolean),
                        tags: document.getElementById('product-tags').value.split(',').map(t => t.trim()).filter(Boolean),
                        inStock: true,
                        createdAt: new Date().toISOString(),
                        id: this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1
                    };
                
                    this.products.push(productData);
                    await this.autoSaveProducts();
                    this.renderProducts();
                
                    // Сбрасываем форму но оставляем превью
                    productForm.reset();
                    const preview = document.getElementById('image-preview');
                    if (preview) {
                        preview.style.display = 'none';
                        document.getElementById('preview-text').style.display = 'block';
                    }
                });
            }
        
            // Настройки
            const settingsForm = document.getElementById('settings-form');
            if (settingsForm) {
                settingsForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                
                    const settings = {
                        store_name: document.getElementById('store-name').value,
                        store_email: document.getElementById('store-email').value,
                        store_phone: document.getElementById('store-phone').value,
                        admin_password: document.getElementById('admin-password').value,
                        currency: document.getElementById('store-currency').value
                    };
                
                    localStorage.setItem('gothyxan_settings', JSON.stringify(settings));
                    localStorage.setItem('admin_password', document.getElementById('admin-password').value);
                
                    this.showStatus('✅ Настройки сохранены!', 'success');
                });
            }
        }
    
        editProduct(productId) {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;
        
            // Заполняем форму
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-sizes').value = product.sizes?.join(', ') || '';
            document.getElementById('product-colors').value = product.colors?.join(', ') || '';
            document.getElementById('product-tags').value = product.tags?.join(', ') || '';
        
            // Превью
            const preview = document.getElementById('image-preview');
            if (preview && product.image) {
                preview.src = product.image;
                preview.style.display = 'block';
                document.getElementById('preview-text').style.display = 'none';
            }
        
            // Меняем кнопку
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            const oldText = submitBtn.textContent;
            submitBtn.textContent = '💾 ОБНОВИТЬ ТОВАР';
        
            // Временно меняем обработчик
            const originalSubmit = submitBtn.onclick;
            submitBtn.onclick = async (e) => {
                e.preventDefault();
            
                const updatedProduct = {
                    ...product,
                        name: document.getElementById('product-name').value,
                    price: parseFloat(document.getElementById('product-price').value),
                category: document.getElementById('product-category').value,
                description: document.getElementById('product-description').value,
                image: document.getElementById('product-image').value,
                sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
                colors: document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(Boolean),
                tags: document.getElementById('product-tags').value.split(',').map(t => t.trim()).filter(Boolean),
                updatedAt: new Date().toISOString()
            };
            
            const index = this.products.findIndex(p => p.id === productId);
            this.products[index] = updatedProduct;
            
            await this.autoSaveProducts();
            this.renderProducts();
            
            // Возвращаем кнопку
            submitBtn.textContent = oldText;
            submitBtn.onclick = originalSubmit;
            this.showTab('products');
        };
        
        this.showTab('add-product');
    }
    
    async deleteProduct(productId) {
        if (!confirm('Удалить этот товар?')) return;
        
        this.products = this.products.filter(p => p.id !== productId);
        await this.autoSaveProducts();
        this.renderProducts();
    }
}

// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========

function showTab(tabId) {
    window.admin?.showTab(tabId);
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========

let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new FullAutoAdmin();
    window.admin = admin;
});

// Экспорт для HTML
window.showTab = showTab;
window.logout = logout;
window.previewImage = previewImage;

// Стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
EOF