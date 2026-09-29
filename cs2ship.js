// ===== ТОВАРЫ =====
const products = [
    { id: 1, name: 'AWP Dragon Lore', price: 2500, description: 'Легендарный скин для снайперской винтовки', emoji: '🎯' },
    { id: 2, name: 'M4A1-S Knight', price: 1800, description: 'Элегантный дизайн для штурмовой винтовки', emoji: '⚔️' },
    { id: 3, name: 'AK-47 Phantom Disruptor', price: 2200, description: 'Мощный скин для легендарного автомата', emoji: '💥' },
    { id: 4, name: 'Desert Eagle Hypnotic', price: 900, description: 'Завораживающий дизайн пистолета', emoji: '🔫' },
    { id: 5, name: 'Knife Karambit Doppler', price: 5000, description: 'Редкий нож с эффектом Doppler', emoji: '🗡️' },
    { id: 6, name: 'Sticker Holo Krakow', price: 150, description: 'Голографическая наклейка чемпиона', emoji: '✨' },
    { id: 7, name: 'USP-S Neo-Noir', price: 1200, description: 'Стильный пистолет спецназа', emoji: '🎭' },
    { id: 8, name: 'AWP Containment Breach', price: 1500, description: 'Эксклюзивный скин для снайперски винтовки', emoji: '🔒' }
];

// ===== ХРАНИЛИЩЕ ДАННЫХ =====
const store = {
    users: JSON.parse(localStorage.getItem('cs2_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('cs2_currentUser')) || null,
    cart: JSON.parse(localStorage.getItem('cs2_cart')) || [],
    orders: JSON.parse(localStorage.getItem('cs2_orders')) || [],
    activityLog: JSON.parse(localStorage.getItem('cs2_activity')) || [],
    isAdmin: JSON.parse(localStorage.getItem('cs2_isAdmin')) || false
};

console.log('Store initialized:', store);
console.log('Is Admin:', store.isAdmin);

// ===== ФУНКЦИИ ЛОГИРОВАНИЯ =====
function logActivity(action, details = '') {
    const timestamp = new Date().toLocaleString('ru-RU');
    const log = {
        timestamp,
        user: store.currentUser?.email || 'Гость',
        action,
        details,
        ip: 'xx.xx.xx.xx'
    };
    store.activityLog.push(log);
    localStorage.setItem('cs2_activity', JSON.stringify(store.activityLog));
    console.log('Activity logged:', log);
}

// ===== ФУНКЦИИ РЕГИСТРАЦИИ И ВХОДА =====
function switchTab(tab) {
    event.preventDefault();
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    return strength;
}

document.getElementById('signupPassword').addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    const strengthBar = document.getElementById('passwordStrength');
    strengthBar.classList.remove('weak', 'medium', 'strong');
    
    if (strength === 1) strengthBar.classList.add('weak');
    else if (strength === 2) strengthBar.classList.add('medium');
    else if (strength >= 3) strengthBar.classList.add('strong');
});

document.getElementById('signupConfirmPassword').addEventListener('input', function() {
    const match = document.getElementById('signupPassword').value === this.value;
    const matchSpan = document.getElementById('passwordMatch');
    matchSpan.classList.remove('match', 'mismatch');
    matchSpan.textContent = match ? '✓ Пароли совпадают' : '✗ Пароли не совпадают';
    matchSpan.classList.add(match ? 'match' : 'mismatch');
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (!name || name.length < 2) {
        alert('Имя должно быть минимум 2 символа');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Введите корректный email');
        return;
    }
    
    if (password.length < 8) {
        alert('Пароль должен быть минимум 8 символов');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }
    
    if (checkPasswordStrength(password) < 2) {
        alert('Пароль слишком слабый. Используйте буквы, цифры и спецсимволы');
        return;
    }
    
    if (store.users.find(u => u.email === email)) {
        alert('Этот email уже зарегистрирован');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashPassword(password),
        registeredAt: new Date().toLocaleString('ru-RU'),
        status: 'active'
    };
    
    store.users.push(newUser);
    localStorage.setItem('cs2_users', JSON.stringify(store.users));
    
    logActivity('Регистрация', `Новый пользователь: ${email}`);
    
    alert('Регистрация успешна! Теперь войдите в систему');
    switchTab('login');
    this.reset();
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const user = store.users.find(u => u.email === email && u.password === hashPassword(password));
    
    if (!user) {
        alert('Неверный email или пароль');
        logActivity('Ошибка входа', `Попытка входа на ${email}`);
        return;
    }
    
    store.currentUser = { id: user.id, name: user.name, email: user.email };
    store.isAdmin = email === 'admin@cs2shop.com';
    localStorage.setItem('cs2_currentUser', JSON.stringify(store.currentUser));
    localStorage.setItem('cs2_isAdmin', JSON.stringify(store.isAdmin));
    
    logActivity('Вход', `Вход пользователя ${email}`);
    
    closeAuthModal();
    updateAuthButton();
    updateAdminButton();
    alert(`Добро пожаловать, ${user.name}!`);
    this.reset();
});

function hashPassword(password) {
    return btoa(password);
}

// ===== МОДАЛЬНОЕ ОКНО =====
const modal = document.getElementById('authModal');
const authBtn = document.getElementById('auth-btn');
const closeBtn = document.querySelector('.close');

authBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (store.currentUser) {
        logout();
    } else {
        modal.style.display = 'block';
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
    }
});

closeBtn.addEventListener('click', closeAuthModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
});

function closeAuthModal() {
    modal.style.display = 'none';
}

function updateAuthButton() {
    if (store.currentUser) {
        authBtn.textContent = `Выход (${store.currentUser.name})`;
        authBtn.style.color = '#00d4ff';
    } else {
        authBtn.textContent = 'Вход';
        authBtn.style.color = '#ffffff';
    }
}

function logout() {
    logActivity('Выход', `Выход пользователя ${store.currentUser.email}`);
    store.currentUser = null;
    store.isAdmin = false;
    localStorage.removeItem('cs2_currentUser');
    localStorage.removeItem('cs2_isAdmin');
    updateAuthButton();
    updateAdminButton();
    alert('Вы вышли из системы');
}

// ===== ТОВАРЫ =====
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">${product.emoji}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">$${product.price}</div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${product.id})">В корзину</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    if (!store.currentUser) {
        alert('Пожалуйста, войдите в систему');
        modal.style.display = 'block';
        return;
    }
    
    const product = products.find(p => p.id === productId);
    const cartItem = store.cart.find(item => item.id === productId);
    
    if (cartItem) {
        cartItem.quantity++;
    } else {
        store.cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    logActivity('Добавление в корзину', `${product.name} x1`);
    updateCartBadge();
    alert(`${product.name} добавлен в корзину!`);
}

function updateCartBadge() {
    document.getElementById('cart-count').textContent = store.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function removeFromCart(productId) {
    store.cart = store.cart.filter(item => item.id !== productId);
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    logActivity('Удаление из корзины', `Товар ID: ${productId}`);
    renderCart();
    updateCartBadge();
}

function updateCartQuantity(productId, quantity) {
    const item = store.cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
        renderCart();
        updateCartBadge();
    }
}

function renderCart() {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    
    if (store.cart.length === 0) {
        cartContent.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        cartTotal.innerHTML = '';
        return;
    }
    
    const total = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartContent.innerHTML = `
        <div class="cart-items">
            ${store.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price}</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">Удалить</button>
                </div>
            `).join('')}
        </div>
    `;
    
    cartTotal.innerHTML = `
        <div class="total-amount">Итого: $${total}</div>
        <button class="checkout-btn" onclick="checkout()">Оформить заказ</button>
    `;
}

function checkout() {
    if (!store.currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }
    
    if (store.cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    
    const total = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = {
        id: Date.now(),
        userId: store.currentUser.id,
        userName: store.currentUser.name,
        userEmail: store.currentUser.email,
        items: [...store.cart],
        total,
        date: new Date().toLocaleString('ru-RU'),
        status: 'pending'
    };
    
    store.orders.push(order);
    localStorage.setItem('cs2_orders', JSON.stringify(store.orders));
    
    logActivity('Оформление заказа', `Заказ #${order.id} на сумму $${total}`);
    
    store.cart = [];
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    updateCartBadge();
    renderCart();
    
    alert(`Спасибо за заказ! Номер заказа: #${order.id}\nСумма: $${total}`);
}

// ===== АДМИН ПАНЕЛЬ =====
function updateAdminButton() {
    const adminBtn = document.getElementById('adminToggleBtn');
    console.log('Updating admin button. IsAdmin:', store.isAdmin);
    
    if (store.isAdmin) {
        adminBtn.style.display = 'flex';
        console.log('Admin button shown');
    } else {
        adminBtn.style.display = 'none';
        console.log('Admin button hidden');
    }
}

document.getElementById('adminToggleBtn').addEventListener('click', () => {
    console.log('Admin button clicked');
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('active');
    console.log('Admin panel active:', panel.classList.contains('active'));
    if (panel.classList.contains('active')) {
        renderAdminPanel();
    }
});

document.getElementById('closeAdmin').addEventListener('click', () => {
    document.getElementById('adminPanel').classList.remove('active');
});

// Переключение табов в админ панели
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Tab clicked:', btn.dataset.tab);
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    });
});

function renderAdminPanel() {
    console.log('Rendering admin panel');
    renderUsersTable();
    renderOrdersTable();
    renderActivityLog();
}

function renderUsersTable() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = store.users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.registeredAt}</td>
            <td><span class="status-badge status-${user.status}">${user.status === 'active' ? 'АКТИВНЫЙ' : 'ЗАБЛОКИРОВАН'}</span></td>
        </tr>
    `).join('');
}

function renderOrdersTable() {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = store.orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.userName}</td>
            <td>$${order.total}</td>
            <td>${order.date}</td>
            <td><span class="status-badge status-${order.status === 'pending' ? 'pending' : 'active'}">${order.status === 'pending' ? 'ОЖИДАНИЕ' : 'ЗАВЕРШЕНО'}</span></td>
        </tr>
    `).join('');
}

function renderActivityLog() {
    const logContainer = document.getElementById('activityLog');
    if (store.activityLog.length === 0) {
        logContainer.innerHTML = '<p style="color: #999; text-align: center;">Нет активности</p>';
        return;
    }
    logContainer.innerHTML = store.activityLog.slice().reverse().slice(0, 50).map(log => `
        <div class="activity-item">
            <span class="activity-time">${log.timestamp}</span>
            <span class="activity-text"><strong>${log.user}</strong> - ${log.action}${log.details ? ': ' + log.details : ''}</span>
        </div>
    `).join('');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded - Initializing app');
    
    renderProducts();
    renderCart();
    updateCartBadge();
    updateAuthButton();
    updateAdminButton();
    
    // Создать тестового админа при первой загрузке
    if (!store.users.find(u => u.email === 'admin@cs2shop.com')) {
        console.log('Creating admin user');
        store.users.push({
            id: 999,
            name: 'Администратор',
            email: 'admin@cs2shop.com',
            password: hashPassword('Admin123!@'),
            registeredAt: new Date().toLocaleString('ru-RU'),
            status: 'active'
        });
        localStorage.setItem('cs2_users', JSON.stringify(store.users));
        logActivity('Инициализация', 'Админ аккаунт создан');
    }
    
    console.log('App initialized');
});

window.addEventListener('beforeunload', () => {
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
});
