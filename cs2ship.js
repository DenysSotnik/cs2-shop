const supabaseUrl = 'https://hbxobafjqjvsribpgthr.supabase.co';
const supabaseKey = 'sb_publishable_-W6264GvoiQmNNCLhDvmRw_0F8vkKoS';

let supabase;
let store = {
    currentUser: JSON.parse(localStorage.getItem('cs2_currentUser')) || null,
    cart: JSON.parse(localStorage.getItem('cs2_cart')) || [],
    isAdmin: JSON.parse(localStorage.getItem('cs2_isAdmin')) || false
};

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

function initSupabase() {
    if (window.supabase && !supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase initialized');
    }
}

function hashPassword(password) {
    return btoa(password);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
}

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'Не удалось определить';
    } catch (error) {
        return 'Не удалось определить';
    }
}

async function logActivity(action, details = '') {
    if (!supabase) return;
    await supabase.from('activity').insert([{
        user_id: store.currentUser ? store.currentUser.id : null,
        action,
        details,
        timestamp: new Date().toISOString()
    }]);
}

async function updateLastLogin() {
    if (!supabase || !store.currentUser) return;
    await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', store.currentUser.id);
}

function switchTab(tab) {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;

    if (store.currentUser) {
        authBtn.textContent = `Выход (${store.currentUser.name})`;
        authBtn.style.color = '#00d4ff';
    } else {
        authBtn.textContent = 'Вход';
        authBtn.style.color = '#ffffff';
    }
}

function updateAdminButton() {
    const adminBtn = document.getElementById('adminToggleBtn');
    if (!adminBtn) return;

    store.isAdmin = !!(store.currentUser && store.currentUser.email === 'admin@cs2shop.com');
    localStorage.setItem('cs2_isAdmin', JSON.stringify(store.isAdmin));
    adminBtn.style.display = store.isAdmin ? 'flex' : 'none';
}

function logout() {
    if (store.currentUser) {
        logActivity('Выход', `Выход пользователя ${store.currentUser.email}`);
    }
    store.currentUser = null;
    store.isAdmin = false;
    localStorage.removeItem('cs2_currentUser');
    localStorage.removeItem('cs2_isAdmin');
    updateAuthButton();
    updateAdminButton();
    alert('Вы вышли из системы');
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

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

function updateCartBadge() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = store.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function renderCart() {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartContent || !cartTotal) return;

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

function addToCart(productId) {
    if (!store.currentUser) {
        alert('Пожалуйста, войдите в систему');
        const modal = document.getElementById('authModal');
        if (modal) modal.style.display = 'block';
        return;
    }

    const product = products.find(p => p.id === productId);
    const cartItem = store.cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        store.cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    logActivity('Добавление в корзину', `${product.name} x1`);
    updateCartBadge();
    renderCart();
    alert(`${product.name} добавлен в корзину!`);
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
    if (!item) return;

    item.quantity = Math.max(1, quantity);
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    renderCart();
    updateCartBadge();
}

async function checkout() {
    if (!store.currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

    if (store.cart.length === 0) {
        alert('Корзина пуста');
        return;
    }

    if (!supabase) return;

    const total = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const { error } = await supabase.from('orders').insert([{
        user_id: store.currentUser.id,
        items: store.cart,
        total,
        order_date: new Date().toISOString(),
        status: 'pending'
    }]);

    if (error) {
        console.error(error);
        alert('Ошибка оформления заказа');
        return;
    }

    await logActivity('Оформление заказа', `Заказ на сумму $${total}`);
    store.cart = [];
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
    updateCartBadge();
    renderCart();
    alert(`Спасибо за заказ! Сумма: $${total}`);
}

async function renderUsersTable() {
    if (!supabase) return;
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('registered_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    tbody.innerHTML = (data || []).map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.password_plain || user.password_hash || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.address || '-'}</td>
            <td>${user.ip_address || '-'}</td>
            <td>${new Date(user.registered_at).toLocaleString('ru-RU')}</td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString('ru-RU') : 'Никогда'}</td>
            <td><span class="status-badge status-${user.status === 'active' ? 'active' : 'inactive'}">${user.status === 'active' ? 'АКТИВНЫЙ' : 'ЗАБЛОКИРОВАН'}</span></td>
        </tr>
    `).join('');
}

async function renderOrdersTable() {
    if (!supabase) return;
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    tbody.innerHTML = (data || []).map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.user_id}</td>
            <td>$${Number(order.total).toFixed(2)}</td>
            <td>${new Date(order.order_date).toLocaleString('ru-RU')}</td>
            <td><span class="status-badge status-${order.status === 'pending' ? 'pending' : 'active'}">${order.status === 'pending' ? 'ОЖИДАНИЕ' : 'ЗАВЕРШЕНО'}</span></td>
        </tr>
    `).join('');
}

async function renderActivityLog() {
    if (!supabase) return;
    const logContainer = document.getElementById('activityLog');
    if (!logContainer) return;

    const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        logContainer.innerHTML = '<p style="color: #999; text-align: center;">Нет активности</p>';
        return;
    }

    logContainer.innerHTML = data.map(log => `
        <div class="activity-item">
            <span class="activity-time">${new Date(log.timestamp).toLocaleString('ru-RU')}</span>
            <span class="activity-text"><strong>${log.user_id || 'Гость'}</strong> - ${log.action}${log.details ? ': ' + log.details : ''}</span>
        </div>
    `).join('');
}

async function renderAdminPanel() {
    await renderOrdersTable();
    await renderUsersTable();
    await renderActivityLog();
}

async function exportToCSV() {
    if (!supabase) return;

    const { data: users } = await supabase.from('users').select('*');

    if (!users || users.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    let csv = 'ID,Имя,Email,Пароль,Телефон,Адрес,IP,Дата регистрации,Последний вход,Статус\n';

    users.forEach(user => {
        csv += `${user.id},"${user.name}","${user.email}","${user.password_plain || user.password_hash || ''}","${user.phone || ''}","${user.address || ''}","${user.ip_address || ''}","${new Date(user.registered_at).toLocaleString('ru-RU')}","${user.last_login ? new Date(user.last_login).toLocaleString('ru-RU') : 'Никогда'}","${user.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();

    renderProducts();
    renderCart();
    updateCartBadge();
    updateAuthButton();
    updateAdminButton();

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

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabase) {
            alert('Ошибка подключения');
            return;
        }

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const phone = document.getElementById('signupPhone').value.trim();
        const address = document.getElementById('signupAddress').value.trim();

        if (!name || name.length < 2) {
            alert('Имя должно быть минимум 2 символа');
            return;
        }

        if (!validateEmail(email)) {
            alert('Введите корректный email');
            return;
        }

        if (!phone) {
            alert('Введите телефон');
            return;
        }

        if (!address) {
            alert('Введите адрес проживания');
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
            alert('Пароль слишком слабый');
            return;
        }

        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (existing && existing.length > 0) {
            alert('Этот email уже зарегистрирован');
            return;
        }

        const userIp = await getUserIP();

        const { error } = await supabase.from('users').insert([{
            name,
            email,
            password_hash: hashPassword(password),
            password_plain: password,
            phone,
            address,
            ip_address: userIp,
            status: 'active',
            registered_at: new Date().toISOString(),
            last_login: null
        }]);

        if (error) {
            console.error(error);
            alert('Ошибка регистрации');
            return;
        }

        await logActivity('Регистрация', `Новый пользователь: ${email}`);
        alert('Регистрация успешна! Теперь войдите в систему');
        switchTab('login');
        document.getElementById('signupForm').reset();
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabase) {
            alert('Ошибка подключения');
            return;
        }

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error || !data || data.length === 0) {
            alert('Неверный email или пароль');
            await logActivity('Ошибка входа', `Попытка входа на ${email}`);
            return;
        }

        const user = data[0];
        const passwordMatches = user.password_hash === hashPassword(password) || user.password_plain === password;

        if (!passwordMatches) {
            alert('Неверный email или пароль');
            await logActivity('Ошибка входа', `Попытка входа на ${email}`);
            return;
        }

        store.currentUser = { id: user.id, name: user.name, email: user.email };
        localStorage.setItem('cs2_currentUser', JSON.stringify(store.currentUser));
        updateAuthButton();
        updateAdminButton();
        closeAuthModal();
        await updateLastLogin();
        await logActivity('Вход', `Вход пользователя ${email}`);

        alert(`Добро пожаловать, ${user.name}!`);
        document.getElementById('loginForm').reset();
    });

    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (store.currentUser) {
                logout();
            } else {
                const modal = document.getElementById('authModal');
                if (modal) modal.style.display = 'block';
                document.getElementById('loginTab').classList.add('active');
                document.getElementById('signupTab').classList.remove('active');
            }
        });
    }

    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAuthModal);
    }

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('authModal');
        if (e.target === modal) closeAuthModal();
    });

    const adminToggleBtn = document.getElementById('adminToggleBtn');
    if (adminToggleBtn) {
        adminToggleBtn.addEventListener('click', async () => {
            const panel = document.getElementById('adminPanel');
            if (!panel) return;
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                await renderAdminPanel();
            }
        });
    }

    const closeAdminBtn = document.getElementById('closeAdmin');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            const panel = document.getElementById('adminPanel');
            if (panel) panel.classList.remove('active');
        });
    }

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab + 'Tab');
            if (target) target.classList.add('active');
        });
    });
});

window.addEventListener('beforeunload', () => {
    localStorage.setItem('cs2_cart', JSON.stringify(store.cart));
});
