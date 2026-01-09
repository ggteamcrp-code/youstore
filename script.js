const tg = window.Telegram.WebApp;

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: '',
    usedPromos: [],
    promoUsageCount: {},
    activeGameId: null
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        app.renderHub();
        app.initCardFX(); 

        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        app.router('hub');
    },

    initCardFX: () => {
        document.querySelectorAll('.game-card').forEach(card => {
            const bg = card.querySelector('.card-bg');
            const character = card.querySelector('.card-character');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 15;
                const rotateY = (centerX - x) / 15;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                if(bg) bg.style.transform = 'translateZ(20px)';
                if(character) character.style.transform = 'translateZ(50px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                if(bg) bg.style.transform = 'translateZ(0)';
                if(character) character.style.transform = 'translateZ(0)';
            });
        });
    },
    
    // И ЗАМЕНИТЕ ЕЕ НА ЭТОТ КОД:
renderHub: () => {
    const grid = document.getElementById('hub-grid');
    const gameCardsHTML = DB.map(game => {
        
        let characterHTML = ''; // Начинаем с пустой строки

        // Проверяем, есть ли у игры персонаж
        if (game.character) {
            // Если это путь к картинке (PNG или GIF)...
            if (game.character.includes('.png') || game.character.includes('.gif')) {
                // ...создаем тег <img>
                characterHTML = `<img src="${game.character}" class="card-character-img ${game.anim}" alt="${game.name} character">`;
            } else {
                // ...иначе (если это все еще эмодзи) оставляем старую логику
                characterHTML = `<div class="card-character ${game.anim}">${game.character}</div>`;
            }
        }

        // Особый случай для Clash Royale, который переопределяет все
        if (game.id === 'clashroyale') {
             characterHTML = `
                <div class="cr-battle-arena-pattern">
                     <div class="arena-projectiles">
                        <span class="projectile fire">🔥</span>
                        <span class="projectile swords">⚔️</span>
                    </div>
                </div>
             `;
        }
        
        return `
            <div class="game-card ${game.theme}-card" onclick="app.openGame('${game.id}', this)">
                <div class="card-bg ${game.pattern}"> 
                    ${characterHTML}
                </div>
                <div class="card-content">
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        <span class="action-text">View Offers →</span>
                    </div>
                    <div class="game-icon-box ${game.theme}-icon">${game.icon}</div>
                </div>
            </div>
        `;
    }).join('');
    grid.innerHTML = gameCardsHTML;
},
    // И ЗАМЕНИТЕ ЕЕ НА ЭТОТ НОВЫЙ КОД:
openGame: (gameId, clickedCard) => {
    const game = DB.find(g => g.id === gameId);
    if (!game) return;

    tg.HapticFeedback.impactOccurred('light');

    // 1. Получаем "до" и "после" элементы
    const hubView = document.getElementById('view-hub');
    const gameView = document.getElementById('view-game');
    
    // ----- Сначала рендерим контент на новом экране, но держим его невидимым -----
    state.activeGameId = gameId;
    document.getElementById('game-title').textContent = game.name.toUpperCase();
    
    let heroHTML;
    if (game.id === 'brawlstars') {
        const particles = Array.from({ length: 50 }).map(() => `<div class="particle"></div>`).join('');
        heroHTML = `<div class="hero-card ${game.theme}-hero"><div class="shine-effect"></div><div class="particles-container">${particles}</div> <div class="bonus-tag">${game.hero.tag}</div><div class="hero-content"><div class="hero-visual">${game.hero.visual}</div><div class="hero-info"><h1>${game.hero.title}</h1><p>${game.hero.desc}</p></div></div></div>`;
    } else {
         heroHTML = `<div class="hero-card ${game.theme}-hero"><div class="shine-effect"></div><div class="bonus-tag">${game.hero.tag}</div><div class="hero-content"><div class="hero-visual">${game.hero.visual}</div><div class="hero-info"><h1>${game.hero.title}</h1><p>${game.hero.desc}</p></div></div></div>`;
    }
    const gameHeroElement = document.getElementById('game-hero');
    gameHeroElement.innerHTML = heroHTML;

    const offersHTML = game.products.map(prod => `<div class="offer-card ${game.theme}-offer"><span class="badge">${prod.badge}</span><div class="offer-visual">${prod.icon}</div><h3>${prod.name}</h3><p class="price">$${prod.price}</p><button class="buy-btn" onclick="app.addToCart(this, '${prod.name}', ${prod.price}, '${prod.icon}')">Purchase</button></div>`).join('');
    document.getElementById('game-offers').innerHTML = offersHTML;

    app.applyTheme(gameId);

    // 2. Получаем геометрию начальной и конечной точек
    const startRect = clickedCard.getBoundingClientRect();
    const targetHeroCard = gameHeroElement.querySelector('.hero-card');

    // Временно показываем, чтобы измерить
    gameView.style.display = 'block';
    const endRect = targetHeroCard.getBoundingClientRect();
    gameView.style.display = 'none';

    // 3. Создаем и настраиваем клон
    const clone = clickedCard.cloneNode(true);
    clone.classList.add('game-card-clone');
    document.body.appendChild(clone);
    
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;

    // 4. Скрываем оригинал и готовим сцену
    clickedCard.style.opacity = '0';
    hubView.classList.add('view-transitioning');

    // 5. ЗАПУСК АНИМАЦИИ (FLIP)
    requestAnimationFrame(() => {
        const scaleX = endRect.width / startRect.width;
        const scaleY = endRect.height / startRect.height;
        const translateX = endRect.left - startRect.left;
        const translateY = endRect.top - startRect.top;

        clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        clone.style.transformOrigin = 'top left';
        // Углы тоже анимируем
        clone.style.borderRadius = getComputedStyle(targetHeroCard).borderRadius;
    });

    // 6. Завершение и очистка
    setTimeout(() => {
        hubView.classList.remove('active', 'view-transitioning');
        hubView.style.display = 'none';
        
        gameView.style.display = 'block';
        gameView.classList.add('active');
        
        clone.remove();
        clickedCard.style.opacity = '1'; // Возвращаем видимость на случай возврата назад
        window.scrollTo(0,0);
    }, 500); // Должно совпадать с длительностью transition
},
    
    addToCart: (button, name, price, icon) => {
        tg.HapticFeedback.impactOccurred('medium');
        const flyingIcon = document.createElement('div');
        flyingIcon.className = 'flying-icon';
        flyingIcon.innerText = icon;
        document.body.appendChild(flyingIcon);
        const rect = button.closest('.offer-card').querySelector('.offer-visual').getBoundingClientRect();
        const cartIcon = document.getElementById('cart-btn');
        const cartRect = cartIcon.getBoundingClientRect();
        flyingIcon.style.top = `${rect.top + rect.height / 2}px`;
        flyingIcon.style.left = `${rect.left + rect.width / 2}px`;
        requestAnimationFrame(() => {
            flyingIcon.style.transform = `translate(${cartRect.left - rect.left - 10}px, ${cartRect.top - rect.top - 10}px) scale(0.2)`;
            flyingIcon.style.opacity = '0';
        });
        setTimeout(() => {
            state.cart.push({ name, price, id: Date.now() });
            app.saveState();
            app.updateCartUI();
            cartIcon.classList.remove('bump');
            void cartIcon.offsetWidth;
            cartIcon.classList.add('bump');
            flyingIcon.remove();
        }, 600);
    },

    router: (viewId) => {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });
        const targetId = viewId === 'game' ? 'view-game' : `view-${viewId}`;
        const target = document.getElementById(targetId);
        if (target) {
            target.style.display = 'block';
            requestAnimationFrame(() => target.classList.add('active'));
        }
        window.scrollTo(0,0);
        app.applyTheme(viewId === 'game' ? state.activeGameId : 'hub');
    },

    applyTheme: (context) => {
        let colors = { header: '#ffffff', navBg: 'rgba(255,255,255,0.98)', navColor: '#111', btnBg: '#000', btnColor: '#fff', bgColor: 'var(--bg-light)' };
        const game = DB.find(g => g.id === context);
        if (game) {
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
        if (context !== 'hub' && game) {
            viewGame.className = `view active ${game.theme}-bg-dynamic`;
        }
    },
    
    saveState: () => { localStorage.setItem('supercell_cart', JSON.stringify(state.cart)); localStorage.setItem('supercell_login', JSON.stringify({ isLoggedIn: state.isLoggedIn, email: state.userEmail, usedPromos: state.usedPromos || [], promoUsageCount: state.promoUsageCount || {} })); },
    loadState: () => { try { const savedCart = localStorage.getItem('supercell_cart'); const savedLogin = localStorage.getItem('supercell_login'); if (savedCart) state.cart = JSON.parse(savedCart); if (savedLogin) { const d = JSON.parse(savedLogin); state.isLoggedIn = d.isLoggedIn; state.userEmail = d.email; state.usedPromos = d.usedPromos || []; state.promoUsageCount = d.promoUsageCount || {}; } } catch(e) {} },
    handleAuthClick: () => {
    // Если пользователь уже залогинен, ничего не делаем
    if (state.isLoggedIn) return;

    tg.HapticFeedback.impactOccurred('medium');

    // 1. Получаем координаты логотипов
    const startLogo = document.querySelector('.logo-container');
    const endLogo = document.getElementById('login-btn'); // Кнопка "LOG IN"
    if (!startLogo || !endLogo) return;

    const startRect = startLogo.getBoundingClientRect();
    const endRect = endLogo.getBoundingClientRect();

    // 2. Создаем "искру"
    const spark = document.createElement('div');
    spark.className = 'connection-spark';
    document.body.appendChild(spark);

    // 3. Устанавливаем начальную позицию (центр нашего лого)
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    spark.style.transform = `translate(${startX}px, ${startY}px) scale(0)`;
    spark.style.opacity = '1';

    // 4. Запускаем анимацию полета
    requestAnimationFrame(() => {
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;
        spark.style.transform = `translate(${endX}px, ${endY}px) scale(1)`;
    });

    // 5. По завершении анимации открываем модальное окно и убираем искру
    setTimeout(() => {
        spark.style.opacity = '0';
        document.getElementById('collab-login-modal').classList.add('open');
        
        setTimeout(() => {
            spark.remove();
        }, 300); // Даем время искре исчезнуть
        
    }, 600); // Должно совпадать с transition в CSS
},

contactSupport: () => {
    // ВАЖНО: Замените 'YOUR_BOT_USERNAME' на реальное имя вашего бота
    const botUsername = 'youstorescbot';
    
    const message = "Здравствуйте! У меня возникла проблема с авторизацией через Supercell ID в вашем магазине.";

    const url = `https://t.me/${botUsername}?start=${encodeURIComponent(message)}`;
    
    tg.openTelegramLink(url);

    // Закрываем модальное окно после перехода
    document.getElementById('collab-login-modal').classList.remove('open');
},
    redeemCode: () => { const input = document.getElementById('promo-input'); const code = input.value.trim().toUpperCase(); if (!code) return; if (code === '/RESET') { state.usedPromos = []; state.promoUsageCount = {}; app.saveState(); input.value = ''; app.showPromoMessage('♻️ DEV MODE: Reset!', 'success'); return; } const PROMO_CODE = '/PRM1423PP'; const MAX_USES = 100; if (code === PROMO_CODE) { if (state.usedPromos.includes(code)) { app.showPromoMessage('Already used!', 'error'); return; } if ((state.promoUsageCount[code] || 0) >= MAX_USES) { app.showPromoMessage('Limit reached', 'error'); return; } state.promoUsageCount[code] = (state.promoUsageCount[code] || 0) + 1; state.usedPromos.push(code); state.cart.unshift({ name: 'PRO PASS', price: 0, originalPrice: 9.99, isPromo: true, id: Date.now() }); app.saveState(); app.updateCartUI(); app.renderCartItems(); input.value = ''; app.showPromoMessage('✨ Success!', 'success'); tg.HapticFeedback.notificationOccurred('success'); } else { app.showPromoMessage('Invalid Code', 'error'); } },
    showPromoMessage: (text, type) => { const msg = document.getElementById('promo-msg'); msg.textContent = text; msg.className = `promo-msg ${type}`; msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 4000); },
    removeFromCart: (index) => { tg.HapticFeedback.impactOccurred('light'); state.cart.splice(index, 1); app.saveState(); app.updateCartUI(); app.renderCartItems(); },
    updateCartUI: () => { const c = state.cart.length; const b = document.getElementById('cart-count'); b.textContent = c; if (c > 0) b.classList.remove('hidden'); else b.classList.add('hidden'); const t = state.cart.reduce((a,b)=>a+b.price,0); document.getElementById('cart-total').textContent = '$'+t.toFixed(2); },
    toggleCart: () => { const m = document.getElementById('cart-modal'); if (!m.classList.contains('open')) { app.renderCartItems(); document.getElementById('promo-input').value = ''; document.getElementById('promo-msg').classList.add('hidden'); } m.classList.toggle('open'); },
    renderCartItems: () => { const l = document.getElementById('cart-items'); if (state.cart.length === 0) { l.innerHTML = '<div style="padding:20px 0; color:#999;">Cart is empty</div>'; } else { l.innerHTML = state.cart.map((item, i) => { const isPromo = item.isPromo; const itemClass = isPromo ? 'cart-item promo-item' : 'cart-item'; const baseStyle = isPromo ? '' : 'display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;'; const priceHTML = item.originalPrice ? `<span class="old-price">$${item.originalPrice.toFixed(2)}</span><span class="new-price">FREE</span><span class="promo-badge">GIFT</span>` : `<span style="color:#666;">$${item.price.toFixed(2)}</span>`; return `<div class="${itemClass}" style="${baseStyle}"><div style="text-align:left;"><b style="font-size:14px; display:block; margin-bottom:4px;">${item.name}</b>${priceHTML}</div><div onclick="app.removeFromCart(${i})" style="color:${isPromo?'#442817':'#ff3b30'}; font-weight:900; cursor:pointer; padding:5px; font-size:16px; opacity:0.7;">✕</div></div>`; }).join(''); } },
    // И ЗАМЕНИТЕ ЕЕ НА ЭТОТ КОД:
checkout: () => {
    // Если пользователь не залогинен...
    if (!state.isLoggedIn) {
        // ...закрываем корзину...
        app.toggleCart(); 
        // ...и через мгновение запускаем нашу новую, красивую анимацию логина.
        setTimeout(() => {
            tg.showAlert('Please Log In first');
            app.handleAuthClick(); // <-- ГЛАВНОЕ ИЗМЕНЕНИЕ: вызываем правильную функцию
        }, 300);
        return; 
    } 

    if (state.cart.length === 0) return; 

    const amount = state.cart.reduce((a,b)=>a+b.price,0).toFixed(2); 
    tg.showPopup({ 
        title: 'Purchase', 
        message: `Pay $${amount}?`, 
        buttons: [{type:'ok', text:'Pay'}, {type:'cancel'}] 
    }, (id) => { 
        if (id === 'ok') { 
            state.cart = []; 
            app.saveState(); 
            app.updateCartUI(); 
            app.toggleCart(); 
            tg.HapticFeedback.notificationOccurred('success'); 
        } 
    }); 
},
    _LEGACY_toggleLogin: () => { if(state.isLoggedIn) return; document.getElementById('login-modal').classList.toggle('open'); },
    processLogin: () => { const e = document.getElementById('email-input').value; if(!e.includes('@')) return; document.querySelector('.login-step-1').classList.add('hidden'); document.querySelector('.login-loader').classList.remove('hidden'); setTimeout(() => { state.isLoggedIn = true; state.userEmail = e; app.saveState(); document.getElementById('login-modal').classList.remove('open'); app.checkLoginUI(); setTimeout(() => { document.querySelector('.login-step-1').classList.remove('hidden'); document.querySelector('.login-loader').classList.add('hidden'); }, 500); }, 1500); },
    checkLoginUI: () => { const btn = document.querySelector('.login-btn'); if(state.isLoggedIn) { const name = state.userEmail.split('@')[0]; btn.innerHTML = `👤 ${name.slice(0,8)}`; btn.style.background = '#28ca42'; btn.style.color = '#fff'; } else { btn.innerHTML = `LOG IN <span class="id-icon">ID</span>`; } }
};

document.addEventListener('DOMContentLoaded', app.init);
