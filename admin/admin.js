// ПОЛНОСТЬЮ АВТОМАТИЗИРОВАННАЯ АДМИНКА
class FullAutoAdmin {
    constructor() {
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
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
        
        console.log('Автоадминка готова');
    }
    
    async loadData() {
        try {
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
    
    // Автосохранение через GitHub Actions
    async autoSaveProducts() {
        const productsData = {
            products: this.products,
            last_updated: new Date().toISOString(),
            total: this.products.length
        };
        
        this.showStatus('🔄 Сохранение на GitHub...');
        
        try {
            // Пробуем отправить в GitHub Actions
            const success = await this.sendToGitHubActions(productsData);
            
            if (success) {
                this.showStatus('✅ Данные отправлены! Сайт обновится через 1-2 минуты.', 'success');
            } else {
                this.showJsonForManualCopy(productsData);
            }
        } catch (error) {
            this.showJsonForManualCopy(productsData);
        }
    }
    
    async sendToGitHubActions(data) {
        // GitHub API для триггера workflow
        const response = await fetch(`https://api.github.com/repos/wezzyytop2-crypto/gothyxan-shop/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Authorization': 'token ' + (localStorage.getItem('github_token') || '')
            },
            body: JSON.stringify({
                event_type: 'update_products',
                client_payload: {
                    products_data: JSON.stringify(data),
                    message: `Обновлено ${data.total} товаров`,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        return response.ok;
    }
    
    showJsonForManualCopy(data) {
        const jsonString = JSON.stringify(data, null, 2);
        
        this.showNotification(`
            <h3>📋 Скопируй этот JSON:</h3>
            <p>Замени содержимое файла: <code>src/data/products.json</code></p>
            <textarea 
                id="json-output" 
                style="width:100%; height:200px; background:#222; color:white; padding:10px; border:1px solid #333; margin:10px 0;"
            >${jsonString}</textarea>
            <button onclick="copyJson()" class="btn">📋 Копировать</button>
            <button onclick="this.closest('div').parentElement.remove()" class="btn">✕ Закрыть</button>
        `);
        
        window.copyJson = () => {
            const textarea = document.getElementById('json-output');
            textarea.select();
            document.execCommand('copy');
            alert('JSON скопирован!');
        };
    }
    
    showStatus(message, type = 'info') {
        const status = document.createElement('div');
        status.innerHTML = `
            <div style="
                position: fixed; bottom: 20px; left: 20px;
                background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
                color: white; padding: 10px 20px; border-radius: 5px;
                z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">
                ${message}
            </div>
        `;
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 5000);
    }
    
    showNotification(html) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #222; color: white; padding: 30px; border-radius: 10px;
                z-index: 10000; border: 1px solid #333; max-width: 600px; width: 90%;
            ">
                ${html}
            </div>
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); z-index: 9999;
            " onclick="this.parentElement.remove()"></div>
        `;
        document.body.appendChild(notification);
    }
    
    renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;
        
        container.innerHTML = this.products.map(p => `
            <div class="product-card">
                <h3>${p.name}</h3>
                <p>${p.price} € • ${p.category}</p>
            </div>
        `).join('');
    }
    
    renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;
        
        container.innerHTML = this.categories.map(c => `
            <div class="product-card">
                <h3>${c.name}</h3>
                <p>${c.slug}</p>
            </div>
        `).join('');
    }
    
    initUI() {
        this.showTab('products');
    }
    
    showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
    }
    
    bindEvents() {
        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const product = {
                    id: this.products.length + 1,
                    name: document.getElementById('product-name').value,
                    price: document.getElementById('product-price').value,
                    category: document.getElementById('product-category').value,
                    description: document.getElementById('product-description').value,
                    image: document.getElementById('product-image').value,
                    createdAt: new Date().toISOString()
                };
                
                this.products.push(product);
                await this.autoSaveProducts();
                this.renderProducts();
                form.reset();
            });
        }
    }
}

// Глобальные функции
function showTab(tabId) {
    window.adminPanel?.showTab(tabId);
}

function logout() {
    localStorage.removeItem('admin_authenticated');
    window.location.href = 'login.html';
}

// Инициализация
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new FullAutoAdmin();
    window.adminPanel = adminPanel;
});

window.showTab = showTab;
window.logout = logout;
