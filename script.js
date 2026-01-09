const tg = window.Telegram.WebApp;

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: '',
    usedPromos: [], 
    promoUsageCount: {} 
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // Safety Hide
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
            usedPromos: state.usedPromos || [],
            promoUsageCount: state.promoUsageCount || {}
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
                state.promoUsageCount = d.promoUsageCount || {};
            }
        } catch(e) {}
    },

    // --- LOGOUT LOGIC (HARD RESET) ---
    handleAuthClick: () => {
        if (state.isLoggedIn) {
            tg.showPopup({
                title: 'Log Out',
                message: 'Are you sure? This will reset your cart and promo history.',
                buttons: [
                    {id: 'logout', type: 'destructive', text: 'Log Out'},
                    {id: 'cancel', type: 'cancel'}
                ]
            }, (btnId) => {
                if (btnId === 'logout') {
                    app.logout();
                }
            });
        } else {
            app.toggleLogin();
        }
    },

    logout: () => {
        state.isLoggedIn = false;
        state.userEmail = '';
        state.cart = [];
        state.usedPromos = []; 
        state.promoUsageCount = {}; // СБРОС ПРИ ВЫХОДЕ (для тестов)
        
        app.saveState();
        app.checkLoginUI();
        app.updateCartUI();
        app.router('hub'); 
        
        tg.HapticFeedback.notificationOccurred('success');
    },

    // --- PROMO CODE LOGIC ---
    redeemCode: () => {
        const input = document.getElementById('promo-input');
        const code = input.value.trim().toUpperCase();

        if (!code) return;

        // --- DEV CHEAT CODE ---
        if (code === '/RESET') {
            state.usedPromos = [];
            state.promoUsageCount = {};
            app.saveState();
            input.value = '';
            app.showPromoMessage('♻️ DEV MODE: History Reset!', 'success');
            tg.HapticFeedback.notificationOccurred('warning');
            return;
        }
        // ----------------------

        const PROMO_CODE = '/PRM1423PP';
        const MAX_USES = 100;

        if (code === PROMO_CODE) {
            // 1. Проверка: уже использовал?
            if (state.usedPromos.includes(code)) {
                app.showPromoMessage('You already used this code!', 'error');
                tg.HapticFeedback.notificationOccurred('error');
                return;
            }

            // 2. Проверка: лимит исчерпан?
            const currentUses = state.promoUsageCount[code] || 0;
            if (currentUses >= MAX_USES) {
                app.showPromoMessage('Code expired (Limit reached)', 'error');
                return;
            }

            // SUCCESS FLOW
            state.promoUsageCount[code] = currentUses + 1;
            state.usedPromos.push(code);

            // Добавляем золотой товар
            state.cart.unshift({ 
                name: 'PRO PASS',
                price: 0,
                originalPrice: 9.99,
                isPromo: true,
                id: Date.now()
            });
            
            app.saveState();
            app.updateCartUI();
            app.renderCartItems(); 

            input.value = '';
            app.showPromoMessage(`✨ Success! (${state.promoUsageCount[code]}/${MAX_USES} claimed)`, 'success');
            
            // SUPER HAPTICS
            tg.HapticFeedback.notificationOccurred('success');
            setTimeout(() => tg.HapticFeedback.impactOccurred('heavy'), 150);
            setTimeout(() => tg.HapticFeedback.impactOccurred('heavy'), 300);

        } else {
            app.showPromoMessage('Invalid Promo Code', 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
    },

    showPromoMessage: (text, type) => {
        const msg = document.getElementById('promo-msg');
        msg.textContent = text;
        msg.className = `promo-msg ${type}`;
        msg.classList.remove('hidden');
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 4000);
    },

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
            loginBtn.innerHTML = `LOG IN <span class="id-icon">ID</span>`;
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
            document.getElementById('promo-input').value = '';
            document.getElementById('promo-msg').classList.add('hidden');
        }
        modal.classList.toggle('open');
    },

    renderCartItems: () => {
        const list = document.getElementById('cart-items');
        if (state.cart.length === 0) {
            list.innerHTML = '<div style="padding:20px 0; color:#999;">Cart is empty</div>';
        } else {
            list.innerHTML = state.cart.map((item, i) => {
                const isPromo = item.isPromo;
                const itemClass = isPromo ? 'cart-item promo-item' : 'cart-item';
                const baseStyle = isPromo ? '' : 'display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee;';

                const priceHTML = item.originalPrice 
                    ? `<span class="old-price">$${item.originalPrice}</span><span class="new-price">FREE</span><span class="promo-badge">GIFT</span>`
                    : `<span style="color:#666;">$${item.price}</span>`;

                return `
                <div class="${itemClass}" style="${baseStyle}">
                    <div style="text-align:left;">
                        <b style="font-size:14px; display:block; margin-bottom:4px;">${item.name}</b>
                        ${priceHTML}
                    </div>
                    <div onclick="app.removeFromCart(${i})" style="color:${isPromo?'#442817':'#ff3b30'}; font-weight:900; cursor:pointer; padding:5px; font-size:16px; opacity:0.7;">✕</div>
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
                // Не сбрасываем промо (чтобы нельзя было абузить)
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
            btn.innerHTML = `LOG IN <span class="id-icon">ID</span>`;
            // Цвет кнопки сбросится роутером
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
