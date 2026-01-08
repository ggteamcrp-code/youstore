const tg = window.Telegram.WebApp;

// App State
const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: ''
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // 1. Сначала грузим данные
        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        
        // 2. ПРИНУДИТЕЛЬНО ставим главную страницу, чтобы скрыть лишнее
        app.router('hub');
    },

    saveState: () => {
        localStorage.setItem('supercell_cart', JSON.stringify(state.cart));
        localStorage.setItem('supercell_login', JSON.stringify({
            isLoggedIn: state.isLoggedIn,
            email: state.userEmail
        }));
    },

    loadState: () => {
        try {
            const savedCart = localStorage.getItem('supercell_cart');
            const savedLogin = localStorage.getItem('supercell_login');

            if (savedCart) state.cart = JSON.parse(savedCart);
            if (savedLogin) {
                const loginData = JSON.parse(savedLogin);
                state.isLoggedIn = loginData.isLoggedIn;
                state.userEmail = loginData.email;
            }
        } catch (e) {
            console.error('Error loading state', e);
        }
    },

    router: (viewId) => {
        // Скрываем ВСЕ страницы
        const views = document.querySelectorAll('.view');
        views.forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none'; // Дублируем скрытие через JS для надежности
        });

        // Показываем нужную
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.style.display = 'block'; // Сначала дисплей
            // Небольшая задержка для анимации (CSS transition)
            requestAnimationFrame(() => {
                target.classList.add('active');
            });
        }
        
        window.scrollTo(0, 0);

        // Настройка цветов шапки
        const navbar = document.querySelector('.navbar');
        const logo = document.querySelector('.supercell-logo');
        const loginBtn = document.querySelector('.login-btn');
        const cartBadge = document.querySelector('.cart-badge');

        if (viewId === 'brawlstars') {
            tg.setHeaderColor('#4737ff');
            // Синий стиль для шапки
            navbar.style.background = 'rgba(71, 55, 255, 0.98)';
            navbar.style.color = '#fff';
            navbar.style.boxShadow = 'none';
            logo.style.color = '#fff';
            
            loginBtn.style.background = '#fff';
            loginBtn.style.color = '#000';
            
            cartBadge.style.border = '2px solid #4737ff';
        } else {
            tg.setHeaderColor('#ffffff');
            // Белый стиль для шапки (Hub)
            navbar.style.background = 'rgba(255,255,255,0.98)';
            navbar.style.color = '#111';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
            logo.style.color = '#111';
            
            if (!state.isLoggedIn) {
                loginBtn.style.background = '#000';
                loginBtn.style.color = '#fff';
            }
            cartBadge.style.border = '2px solid #fff';
        }
        
        // Если пользователь залогинен, кнопка всегда зеленая
        app.checkLoginUI(); 
    },

    addToCart: (name, price) => {
        tg.HapticFeedback.impactOccurred('medium');
        state.cart.push({ name, price, id: Date.now() });
        app.saveState();
        app.updateCartUI();
        
        // Анимация иконки
        const btn = document.querySelector('.cart-icon');
        btn.classList.remove('bump');
        void btn.offsetWidth; 
        btn.classList.add('bump');
    },

    removeFromCart: (index) => {
        tg.HapticFeedback.impactOccurred('light');
        state.cart.splice(index, 1);
        app.saveState();
        app.updateCartUI();
        app.renderCartItems();
    },

    updateCartUI: () => {
        const count = state.cart.length;
        const badge = document.getElementById('cart-count');
        
        badge.textContent = count;
        if (count > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
        
        const total = state.cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
    },

    toggleCart: () => {
        const modal = document.getElementById('cart-modal');
        if (!modal.classList.contains('open')) {
            app.renderCartItems();
        }
        modal.classList.toggle('open');
    },

    renderCartItems: () => {
        const list = document.getElementById('cart-items');
        if (state.cart.length === 0) {
            list.innerHTML = '<div style="padding: 20px 0; color: #999;">Your cart is empty 🥺</div>';
        } else {
            list.innerHTML = state.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${item.price}</span>
                    </div>
                    <div class="remove-btn" onclick="app.removeFromCart(${index})">✕</div>
                </div>
            `).join('');
        }
    },

    checkout: () => {
        if (!state.isLoggedIn) {
            app.toggleCart();
            setTimeout(() => {
                tg.showAlert('Please Log In to continue');
                app.toggleLogin();
            }, 300);
            return;
        }

        if (state.cart.length === 0) return;

        tg.showPopup({
            title: 'Confirm Purchase',
            message: `Pay $${state.cart.reduce((a,b)=>a+b.price,0).toFixed(2)} for ${state.cart.length} items?`,
            buttons: [{type: 'ok', text: 'Pay Now'}, {type: 'cancel'}]
        }, (btnId) => {
            if (btnId === 'ok') {
                state.cart = [];
                app.saveState();
                app.updateCartUI();
                app.toggleCart();
                tg.HapticFeedback.notificationOccurred('success');
                tg.showPopup({title: 'Success!', message: 'Items added to your account.'});
            }
        });
    },

    toggleLogin: () => {
        if (state.isLoggedIn) return;
        document.getElementById('login-modal').classList.toggle('open');
    },

    processLogin: () => {
        const email = document.getElementById('email-input').value;
        if (!email.includes('@')) {
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        document.querySelector('.login-step-1').classList.add('hidden');
        document.querySelector('.login-loader').classList.remove('hidden');

        setTimeout(() => {
            state.isLoggedIn = true;
            state.userEmail = email;
            app.saveState();
            
            document.getElementById('login-modal').classList.remove('open');
            app.checkLoginUI();
            
            setTimeout(() => {
                document.querySelector('.login-step-1').classList.remove('hidden');
                document.querySelector('.login-loader').classList.add('hidden');
            }, 500);

            tg.HapticFeedback.notificationOccurred('success');
        }, 1500);
    },

    checkLoginUI: () => {
        const btn = document.querySelector('.login-btn');
        if (state.isLoggedIn) {
            const name = state.userEmail.split('@')[0];
            btn.innerHTML = `👤 ${name.length > 8 ? name.slice(0,8)+'...' : name}`;
            btn.style.background = '#28ca42'; 
            btn.style.color = '#fff';
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
