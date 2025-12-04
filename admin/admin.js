// Упрощенная админ-панель
console.log('Админка загружается...');

// Проверка авторизации
if (localStorage.getItem('admin_authenticated') !== 'true') {
    window.location.href = 'login.html';
}

// Функции переключения вкладок
function showTab(tabId) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем нужную вкладку
    document.getElementById(tabId).classList.add('active');
    
    // Обновляем активную ссылку в меню
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + tabId) {
            link.classList.add('active');
        }
    });
    
    // Загружаем данные для вкладки
    loadTabData(tabId);
}

function loadTabData(tabId) {
    console.log('Загрузка данных для вкладки:', tabId);
    
    if (tabId === 'products') {
        loadProducts();
    } else if (tabId === 'visitors') {
        loadVisitors();
    } else if (tabId === 'analytics') {
        loadAnalytics();
    }
}

function loadProducts() {
    fetch('../src/data/products.json')
        .then(response => response.json())
        .then(products => {
            const container = document.getElementById('products-list');
            if (!container) return;
            
            if (!products || products.length === 0) {
                container.innerHTML = '<p>Товаров нет</p>';
                return;
            }
            
            container.innerHTML = products.map(p => `
                <div class="product-card">
                    <h3>${p.name}</h3>
                    <p>${p.price} €</p>
                    <p>${p.category}</p>
                </div>
            `).join('');
        });
}

function loadVisitors() {
    const visitors = JSON.parse(localStorage.getItem('gothyxan_visitors')) || [];
    const container = document.getElementById('visitors-table');
    
    if (container) {
        const tbody = container.querySelector('tbody') || container;
        tbody.innerHTML = visitors.slice(-10).reverse().map(v => `
            <tr>
                <td>${new Date(v.timestamp).toLocaleString()}</td>
                <td>${v.ip || 'unknown'}</td>
                <td>${v.country || '-'}</td>
                <td>${v.page || '-'}</td>
            </tr>
        `).join('');
    }
}

function loadAnalytics() {
    const visitors = localStorage.getItem('unique_visits') || '0';
    const products = JSON.parse(localStorage.getItem('gothyxan_products_count')) || '0';
    
    document.getElementById('analytics-products').textContent = products;
    document.getElementById('unique-visitors').textContent = visitors;
}

function logout() {
    localStorage.removeItem('admin_authenticated');
    window.location.href = 'login.html';
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Админка инициализирована');
    
    // Показываем первую вкладку
    showTab('products');
    
    // Назначаем обработчики
    document.getElementById('product-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Товар добавлен (в реальном проекте будет сохранение)');
        this.reset();
    });
    
    // Обновляем превью изображения
    document.getElementById('product-image')?.addEventListener('input', function(e) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.src = e.target.value;
            preview.style.display = 'block';
            document.getElementById('preview-text').style.display = 'none';
        }
    });
});

// Делаем функции глобальными
window.showTab = showTab;
window.logout = logout;
window.admin = { showTab, logout };

console.log('Админка готова');
EOF