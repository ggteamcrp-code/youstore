const tg = window.Telegram.WebApp;

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: '',
    usedPromos: [],
    promoUsageCount: {},
    activeGameId: null // Запоминаем, в какой игре мы сейчас
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // 1. РЕНДЕРИМ ХАБ ИЗ БАЗЫ ДАННЫХ
        app.renderHub();

        // 2. Стандартная инициализация
        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        app.router('hub');
    },

    // --- NEW: RENDER ENGINE ---
    renderHub: () => {
        const grid = document.getElementById('hub-grid');
        grid.innerHTML = DB.map(game => `
            <div class="game-card ${game.theme}-card" onclick="app.openGame('${game.id}')">
                <div class="card-bg ${game.theme}-pattern">
                    <div class="card-character ${game.anim}">${game.character}</div>
                </div>
                <div class="card-content">
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        <span class="action-text">View Offers →</span>
                    </div>
                    <div class="game-icon-box ${game.theme}-icon">${game.icon}</div>
                </div>
            </div>
        `).join('');
    },

    openGame: (gameId) => {
        const game = DB.find(g => g.id === gameId);
        if (!game) return;

        state.activeGameId = gameId;

        // 1. Заполняем заголовок
        document.getElementById('game-title').textContent = game.name.toUpperCase();
        
        // 2. Заполняем Героя
        const heroHTML = `
            <div class="hero-card ${game.theme}-hero">
                <div class="shine-effect"></div>
                <div class="bonus-tag">${game.hero.tag}</div>
                <div class="hero-content">
                    <div class="hero-visual">${game.hero.visual}</div>
                    <div class="hero-info">
                        <h1>${game.hero.title}</h1>
                        <p>${game.hero.desc}</p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('game-hero').innerHTML = heroHTML;

        // 3. Заполняем Товары
        const offersHTML = game.products.map(prod => `
            <div class="offer-card ${game.theme}-offer">
                <span class="badge">${prod.badge}</span>
                <div class="offer-visual">${prod.icon}</div>
                <h3>${prod.name}</h3>
                <p class="price">$${prod.price}</p>
                <button class="buy-btn" onclick="app.addToCart('${prod.name}', ${prod.price})">Purchase</button>
            </div>
        `).join('');
        document.getElementById('game-offers').innerHTML = offersHTML;

        // 4. Переходим на универсальную страницу игры
        app.router('game');
    },

    router: (viewId) => {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });

        // Если открываем игру, ID вьюхи всегда 'view-game', но стили зависят от state.activeGameId
        const targetId = viewId === 'game' ? 'view-game' : `view-${viewId}`;
        const target = document.getElementById(targetId);
        
        if (target) {
            target.style.display = 'block';
            requestAnimationFrame(() => target.classList.add('active'));
        }
        window.scrollTo(0,0);

        // Styling based on Game
        app.applyTheme(viewId === 'game' ? state.activeGameId : 'hub');
    },

    applyTheme: (context) => {
        // Defaults
        let colors = {
            header: '#ffffff', navBg: 'rgba(255,255,255,0.98)', 
            navColor: '#111', btnBg: '#000', btnColor: '#fff',
            bg: 'none', bgColor: 'var(--bg-light)'
        };

        // Находим настройки темы в DB
        const game = DB.find(g => g.id === context);
        
        if (game) {
            // Маппинг цветов (можно тоже вынести в DB, но пока так проще)
            if (game.theme === 'bs') colors = { header: '#4737ff', navBg: 'rgba(71, 55, 255, 0.98)', navColor: '#fff', btnBg: '#fff', btnColor: '#000', bgColor: '#4737ff' };
            if (game.theme === 'coc') colors = { header: '#5c3c2e', navBg: 'rgba(92, 60, 46, 0.98)', navColor: '#fff', btnBg: '#fff', btnColor: '#442817', bgColor: '#5c3c2e' };
            if (game.theme === 'cr') colors = { header: '#2b3b75', navBg: 'rgba(43, 59, 117, 0.98)', navColor: '#fff', btnBg: '#fff', btnColor: '#2b3b75', bgColor: '#2b3b75' };
            if (game.theme === 'hd') colors = { header: '#6ecbf5', navBg: 'rgba(110, 203, 245, 0.98)', navColor: '#2a5a00', btnBg: '#2a5a00', btnColor: '#fff', bgColor: '#6ecbf5' };
        }

        const navbar = document.querySelector('.navbar');
        const loginBtn = document.querySelector('.login-btn');
        const logo = document.querySelector('.supercell-logo');
        const viewGame = document.getElementById('view-game');

        tg.setHeaderColor(colors.header);
        navbar.style.background = colors.navBg;
        navbar.style.color = colors.navColor;
        logo.style.color = colors.navColor;

        if (!state.isLoggedIn) {
            loginBtn.style.background = colors.btnBg;
            loginBtn.style.color = colors.btnColor;
        } else {
            app.checkLoginUI();
        }

        // Применяем фон для страницы игры динамически
        if (context !== 'hub' && game) {
            viewGame.className = `view active ${game.theme}-bg-dynamic`;
        }
    },

    // --- ОСТАЛЬНОЙ КОД БЕЗ ИЗМЕНЕНИЙ (saveState, loadState, redeemCode и т.д.) ---
    saveState: () => {
        localStorage.setItem('supercell_cart', JSON.stringify(state.cart));
        localStorage.setItem('supercell_login', JSON.stringify({
            isLoggedIn: state.isLoggedIn, email: state.userEmail, usedPromos: state.usedPromos || [], promoUsageCount: state.promoUsageCount || {}
        }));
    },
    loadState: () => {
        try {
            const savedCart = localStorage.getItem('supercell_cart');
            const savedLogin = localStorage.getItem('supercell_login');
            if (savedCart) state.cart = JSON.parse(savedCart);
            if (savedLogin) { const d = JSON.parse(savedLogin); state.isLoggedIn = d.isLoggedIn; state.userEmail = d.email; state.usedPromos = d.usedPromos || []; state.promoUsageCount = d.promoUsageCount || {}; }
        } catch(e) {}
    },
    handleAuthClick: () => {
        if (state.isLoggedIn) {
            tg.showPopup({ title: 'Log Out', message: 'Are you sure?', buttons: [{id: 'logout', type: 'destructive', text: 'Log Out'}, {id: 'cancel', type: 'cancel'}] }, (btnId) => { if (btnId === 'logout') app.logout(); });
        } else { app.toggleLogin(); }
    },
    logout: () => {
        state.isLoggedIn = false; state.userEmail = ''; state.cart = []; state.usedPromos = []; state.promoUsageCount = {};
        app.saveState(); app.checkLoginUI(); app.updateCartUI(); app.router('hub'); tg.HapticFeedback.notificationOccurred('success');
    },
    redeemCode: () => {
        const input = document.getElementById('promo-input');
        const code = input.value.trim().toUpperCase();
        if (!code) return;
        if (code === '/RESET') { state.usedPromos = []; state.promoUsageCount = {}; app.saveState(); input.value = ''; app.showPromoMessage('♻️ DEV MODE: Reset!', 'success'); return; }
        const PROMO_CODE = '/PRM1423PP'; const MAX_USES = 100;
        if (code === PROMO_CODE) {
            if (state.usedPromos.includes(code)) { app.showPromoMessage('Already used!', 'error'); return; }
            if ((state.promoUsageCount[code] || 0) >= MAX_USES) { app.showPromoMessage('Limit reached', 'error'); return; }
            state.promoUsageCount[code] = (state.promoUsageCount[code] || 0) + 1;
            state.usedPromos.push(code);
            state.cart.unshift({ name: 'PRO PASS', price: 0, originalPrice: 9.99, isPromo: true, id: Date.now() });
            app.saveState(); app.updateCartUI(); app.renderCartItems(); input.value = '';
            app.showPromoMessage('✨ Success!', 'success');
            tg.HapticFeedback.notificationOccurred('success');
        } else { app.showPromoMessage('Invalid Code', 'error'); }
    },
    showPromoMessage: (text, type) => { const msg = document.getElementById('promo-msg'); msg.textContent = text; msg.className = `promo-msg ${type}`; msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 4000); },
    addToCart: (name, price) => { tg.HapticFeedback.impactOccurred('medium'); state.cart.push({ name, price, id: Date.now() }); app.saveState(); app.updateCartUI(); const btn = document.querySelector('.cart-icon'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); },
    removeFromCart: (index) => { tg.HapticFeedback.impactOccurred('light'); state.cart.splice(index, 1); app.saveState(); app.updateCartUI(); app.renderCartItems(); },
    updateCartUI: () => { const c = state.cart.length; const b = document.getElementById('cart-count'); b.textContent = c; if (c > 0) b.classList.remove('hidden'); else b.classList.add('hidden'); const t = state.cart.reduce((a,b)=>a+b.price,0); document.getElementById('cart-total').textContent = '$'+t.toFixed(2); },
    toggleCart: () => { const m = document.getElementById('cart-modal'); if (!m.classList.contains('open')) { app.renderCartItems(); document.getElementById('promo-input').value = ''; document.getElementById('promo-msg').classList.add('hidden'); } m.classList.toggle('open'); },
    renderCartItems: () => { const l = document.getElementById('cart-items'); if (state.cart.length === 0) { l.innerHTML = '<div style="padding:20px 0; color:#999;">Cart is empty</div>'; } else { l.innerHTML = state.cart.map((item, i) => { const isPromo = item.isPromo; const itemClass = isPromo ? 'cart-item promo-item' : 'cart-item'; const baseStyle = isPromo ? '' : 'display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee;'; const priceHTML = item.originalPrice ? `<span class="old-price">$${item.originalPrice}</span><span class="new-price">FREE</span><span class="promo-badge">GIFT</span>` : `<span style="color:#666;">$${item.price}</span>`; return `<div class="${itemClass}" style="${baseStyle}"><div style="text-align:left;"><b style="font-size:14px; display:block; margin-bottom:4px;">${item.name}</b>${priceHTML}</div><div onclick="app.removeFromCart(${i})" style="color:${isPromo?'#442817':'#ff3b30'}; font-weight:900; cursor:pointer; padding:5px; font-size:16px; opacity:0.7;">✕</div></div>` }).join(''); } },
    checkout: () => { if (!state.isLoggedIn) { app.toggleCart(); setTimeout(() => { tg.showAlert('Please Log In first'); app.toggleLogin(); }, 300); return; } if (state.cart.length === 0) return; const amount = state.cart.reduce((a,b)=>a+b.price,0).toFixed(2); tg.showPopup({ title: 'Purchase', message: `Pay $${amount}?`, buttons: [{type:'ok', text:'Pay'}, {type:'cancel'}] }, (id) => { if (id === 'ok') { state.cart = []; app.saveState(); app.updateCartUI(); app.toggleCart(); tg.HapticFeedback.notificationOccurred('success'); } }); },
    toggleLogin: () => { if(state.isLoggedIn) return; document.getElementById('login-modal').classList.toggle('open'); },
    processLogin: () => { const e = document.getElementById('email-input').value; if(!e.includes('@')) return; document.querySelector('.login-step-1').classList.add('hidden'); document.querySelector('.login-loader').classList.remove('hidden'); setTimeout(() => { state.isLoggedIn = true; state.userEmail = e; app.saveState(); document.getElementById('login-modal').classList.remove('open'); app.checkLoginUI(); setTimeout(() => { document.querySelector('.login-step-1').classList.remove('hidden'); document.querySelector('.login-loader').classList.add('hidden'); }, 500); }, 1500); },
    checkLoginUI: () => { const btn = document.querySelector('.login-btn'); if(state.isLoggedIn) { const name = state.userEmail.split('@')[0]; btn.innerHTML = `👤 ${name.slice(0,8)}`; btn.style.background = '#28ca42'; btn.style.color = '#fff'; } else { btn.innerHTML = `LOG IN <span class="id-icon">ID</span>`; } }
};

document.addEventListener('DOMContentLoaded', app.init);
