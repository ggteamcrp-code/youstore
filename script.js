const tg = window.Telegram.WebApp;

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: '',
    usedPromos: [] // Защита от повторного ввода
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // Hide all views initially
        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        
        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        
        app.router('hub');
    },

    saveState: () => {
        localStorage.setItem('supercell_cart', JSON.stringify(state.cart));
        localStorage.setItem('supercell_login', JSON.stringify({
            isLoggedIn: state.isLoggedIn,
            email: state.userEmail,
            usedPromos: state.usedPromos || []
        }));
    },

    loadState: () => {
        try {
            const savedCart = localStorage.getItem('supercell_cart');
            const savedLogin = localStorage.getItem('supercell_login');
            if (savedCart) state.cart = JSON.parse(savedCart);
            if (savedLogin) {
                const d = JSON.parse(savedLogin);
                state.isLoggedIn = d.isLoggedIn;
                state.userEmail = d.email;
                state.usedPromos = d.usedPromos || [];
            }
        } catch(e) {}
    },

    // --- LOGOUT LOGIC ---
    handleAuthClick: () => {
        if (state.isLoggedIn) {
            // Если уже залогинен -> Предлагаем выйти
            tg.showPopup({
                title: 'Log Out?',
                message: 'Your cart will be cleared. Are you sure?',
                buttons: [{type: 'destructive', text: 'Log Out'}, {type: 'cancel'}]
            }, (id) => {
                if (id === 'destructive') {
                    app.logout();
                }
            });
        } else {
            // Если не залогинен -> Открываем окно входа
            app.toggleLogin();
        }
    },

    logout: () => {
        state.isLoggedIn = false;
        state.userEmail = '';
        state.cart = []; // Очищаем корзину как в ТЗ
        state.usedPromos = [];
        app.saveState();
        app.checkLoginUI();
        app.updateCartUI();
        tg.HapticFeedback.notificationOccurred('success');
    },

    // --- PROMO CODE LOGIC ---
    redeemCode: () => {
        const input = document.getElementById('promo-input');
        const msg = document.getElementById('promo-msg');
        const code = input.value.trim().toUpperCase();

        if (!code) return;

        // Код из ТЗ: /PRM1423PP
        if (code === '/PRM1423PP') {
            if (state.usedPromos.includes(code)) {
                msg.textContent = 'Code already used!';
                msg.className = 'promo-msg error';
                msg.classList.remove('hidden');
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            // Добавляем PRO PASS за 0
            state.cart.push({
                name: 'PRO PASS',
                price: 0,
                originalPrice: 9.99, // Старая цена
                isPromo: true,
                id: Date.now()
            });
            
            state.usedPromos.push(code);
            app.saveState();
            app.updateCartUI();
            app.renderCartItems(); // Обновляем список сразу

            input.value = '';
            msg.textContent = 'Promo Applied! Free Item Added.';
            msg.className = 'promo-msg success';
            msg.classList.remove('hidden');
            tg.HapticFeedback.notificationOccurred('success');
            
            // Эффект конфетти (вибрация)
            setTimeout(() => tg.HapticFeedback.impactOccurred('heavy'), 100);

        } else {
            msg.textContent = 'Invalid Code';
            msg.className = 'promo-msg error';
            msg.classList.remove('hidden');
            tg.HapticFeedback.notificationOccurred('error');
        }
    },

    // Остальная логика без изменений (router, addToCart, checkout...)
    router: (viewId) => {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.style.display = 'block';
            requestAnimationFrame(() => target.classList.add('active'));
        }
        window.scrollTo(0,0);

        const navbar = document.querySelector('.navbar');
        const loginBtn = document.querySelector('.login-btn');
        const logo = document.querySelector('.supercell-logo');

        let headerColor = '#ffffff';
        let navBg = 'rgba(255,255,255,0.98)';
        let navColor = '#111';
        let btnBg = '#000';
        let btnColor = '#fff';

        switch(viewId) {
            case 'brawlstars':
                headerColor = '#4737ff'; navBg = 'rgba(71, 55, 255, 0.98)'; navColor = '#fff'; btnBg = '#fff'; btnColor = '#000'; break;
            case 'clashofclans':
                headerColor = '#5c3c2e'; navBg = 'rgba(92, 60, 46, 0.98)'; navColor = '#fff'; btnBg = '#fff'; btnColor = '#442817'; break;
            case 'clashroyale':
                headerColor = '#2b3b75'; navBg = 'rgba(43, 59, 117, 0.98)'; navColor = '#fff'; btnBg = '#fff'; btnColor = '#2b3b75'; break;
            case 'hayday':
                headerColor = '#6ecbf5'; navBg = 'rgba(110, 203, 245, 0.98)'; navColor = '#2a5a00'; btnBg = '#2a5a00'; btnColor = '#fff'; break;
        }

        tg.setHeaderColor(headerColor);
        navbar.style.background = navBg;
        navbar.style.color = navColor;
        logo.style.color = navColor;
        
        if (!state.isLoggedIn) {
            loginBtn.style.background = btnBg;
            loginBtn.style.color = btnColor;
        } else {
             app.checkLoginUI();
        }
    },

    addToCart: (name, price) => {
        tg.HapticFeedback.impactOccurred('medium');
        state.cart.push({ name, price, id: Date.now() });
        app.saveState();
        app.updateCartUI();
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
        
        const total = state.cart.reduce((a,b)=>a+b.price,0);
        document.getElementById('cart-total').textContent = '$'+total.toFixed(2);
    },

    toggleCart: () => {
        const modal = document.getElementById('cart-modal');
        if (!modal.classList.contains('open')) {
            app.renderCartItems();
            // Сброс сообщения промокода
            document.getElementById('promo-msg').classList.add('hidden');
            document.getElementById('promo-input').value = '';
        }
        modal.classList.toggle('open');
    },

    renderCartItems: () => {
        const list = document.getElementById('cart-items');
        if (state.cart.length === 0) {
            list.innerHTML = '<div style="padding:20px 0; color:#999;">Cart is empty</div>';
        } else {
            list.innerHTML = state.cart.map((item, i) => {
                // Если есть старая цена, рисуем её
                const priceHTML = item.originalPrice 
                    ? `<span class="old-price">$${item.originalPrice}</span> <span class="new-price">$0.00</span> <span class="promo-badge">GIFT</span>`
                    : `<span>$${item.price}</span>`;
                
                // Класс для подсветки промо-товара
                const itemClass = item.isPromo ? 'cart-item promo-item' : 'cart-item';
                
                // Обычный стиль для элемента
                const style = item.isPromo 
                    ? '' // Стили заданы в CSS классе
                    : 'display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;';

                return `
                <div class="${itemClass}" style="${style}">
                    <div style="text-align:left;">
                        <b style="font-size:14px;">${item.name}</b><br>
                        <span style="color:#666; font-size:13px;">${priceHTML}</span>
                    </div>
                    <div onclick="app.removeFromCart(${i})" style="color:red; font-weight:bold; cursor:pointer; padding:5px;">✕</div>
                </div>
            `}).join('');
        }
    },

    checkout: () => {
        if (!state.isLoggedIn) {
            app.toggleCart();
            setTimeout(() => {
                tg.showAlert('Please Log In first');
                app.toggleLogin();
            }, 300);
            return;
        }
        if (state.cart.length === 0) return;
        
        const amount = state.cart.reduce((a,b)=>a+b.price,0).toFixed(2);
        tg.showPopup({
            title: 'Purchase',
            message: `Pay $${amount} for ${state.cart.length} items?`,
            buttons: [{type:'ok', text:'Pay'}, {type:'cancel'}]
        }, (id) => {
            if (id === 'ok') {
                state.cart = [];
                state.usedPromos = []; // Опционально сбрасываем использованные коды после покупки
                app.saveState();
                app.updateCartUI();
                app.toggleCart();
                tg.HapticFeedback.notificationOccurred('success');
            }
        });
    },

    toggleLogin: () => {
        if(state.isLoggedIn) return;
        document.getElementById('login-modal').classList.toggle('open');
    },

    processLogin: () => {
        const email = document.getElementById('email-input').value;
        if(!email.includes('@')) {
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
        if(state.isLoggedIn) {
            const name = state.userEmail.split('@')[0];
            btn.innerHTML = `👤 ${name.slice(0,8)}`;
            btn.style.background = '#28ca42';
            btn.style.color = '#fff';
        } else {
            // Если вышли - возвращаем стандартный вид
            btn.innerHTML = `LOG IN <span class="id-icon">ID</span>`;
            // Цвет кнопки сбросится роутером
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
