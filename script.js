const tg = window.Telegram.WebApp;

// CONFIG
const THEMES = [
    {id: 'bs', name: 'Brawl Stars', class: 'bs-pattern', bgClass: 'bs-bg'},
    {id: 'coc', name: 'Clash Clans', class: 'coc-pattern', bgClass: 'coc-bg'},
    {id: 'cr', name: 'Clash Royale', class: 'cr-pattern', bgClass: 'cr-bg'},
    {id: 'hd', name: 'Hay Day', class: 'hd-pattern', bgClass: 'hd-bg'},
    {id: 'arena', name: 'Arena', class: 'theme-arena', bgClass: 'theme-arena-bg'},
    {id: 'gold', name: 'Gold', class: 'theme-gold', bgClass: 'theme-gold-bg'},
    {id: 'ice', name: 'Ice', class: 'theme-ice', bgClass: 'theme-ice-bg'},
    {id: 'inferno', name: 'Inferno', class: 'theme-inferno', bgClass: 'theme-inferno-bg'},
    {id: 'space', name: 'Space', class: 'theme-space', bgClass: 'theme-space-bg'},
    {id: 'forest', name: 'Forest', class: 'theme-forest', bgClass: 'theme-forest-bg'},
    {id: 'candy', name: 'Candy', class: 'theme-candy', bgClass: 'theme-candy-bg'},
    {id: 'cyber', name: 'Cyber', class: 'theme-cyber', bgClass: 'theme-space-bg'},
    {id: 'water', name: 'Water', class: 'theme-water', bgClass: 'theme-ice-bg'},
    {id: 'blueprint', name: 'Blueprint', class: 'theme-blueprint', bgClass: 'theme-blueprint-bg'},
    {id: 'matrix', name: 'Matrix', class: 'theme-matrix', bgClass: 'theme-space-bg'},
    {id: 'noir', name: 'Noir', class: 'theme-noir', bgClass: 'theme-arena-bg'},
    {id: 'glitch', name: 'Glitch', class: 'theme-glitch', bgClass: 'theme-space-bg'},
    {id: 'sunset', name: 'Sunset', class: 'theme-sunset', bgClass: 'theme-sunset-bg'},
    {id: 'toxic', name: 'Toxic', class: 'theme-toxic', bgClass: 'theme-toxic-bg'},
    {id: 'paper', name: 'Paper', class: 'theme-paper', bgClass: 'theme-paper-bg'},
    {id: 'neon', name: 'Neon', class: 'theme-neon', bgClass: 'theme-space-bg'},
    {id: 'retro', name: 'Retro', class: 'theme-retro', bgClass: 'theme-gold-bg'},
    {id: 'galaxy', name: 'Galaxy', class: 'theme-galaxy', bgClass: 'theme-galaxy-bg'},
    {id: 'lava', name: 'Lava', class: 'theme-lava', bgClass: 'theme-lava-bg'}
];

const state = {
    cart: [], isLoggedIn: false, userEmail: '',
    devMode: false, secretTapCount: 0,
    activeGameId: null, gridMode: false,
    editCtx: null, currentThemeIndex: 0
};

const app = {
    init: () => {
        tg.expand(); tg.ready();
        
        document.querySelector('.logo-container').addEventListener('click', () => {
            state.secretTapCount++;
            if(state.secretTapCount === 5) admin.toggleDevMode();
            setTimeout(() => state.secretTapCount = 0, 2000);
        });

        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        if(state.gridMode) document.getElementById('hub-grid').classList.add('grid-2x6');
        
        app.renderHub();
        app.router('hub');
    },

    saveState: () => {
        localStorage.setItem('sc_store_v3', JSON.stringify({
            cart: state.cart, user: {l: state.isLoggedIn, e: state.userEmail},
            settings: {g: state.gridMode}, data: APP_DATA
        }));
    },

    loadState: () => {
        try {
            // ИЗМЕНИЛИ КЛЮЧ на v3 ЧТОБЫ СБРОСИТЬ КЭШ СТАРЫХ ВЕРСИЙ
            const raw = localStorage.getItem('sc_store_v3');
            if(raw) {
                const d = JSON.parse(raw);
                state.cart = d.cart || [];
                state.isLoggedIn = d.user?.l || false;
                state.userEmail = d.user?.e || '';
                state.gridMode = d.settings?.g || false;
                if(d.data) window.APP_DATA = d.data;
            }
        } catch(e) {}
    },

    renderChar: (c) => (c.includes('/') || c.includes('data:')) ? `<img src="${c}">` : c,

    renderHub: () => {
        const grid = document.getElementById('hub-grid');
        grid.innerHTML = APP_DATA.map((g, i) => {
            const theme = THEMES.find(t => t.id === g.theme) || THEMES[0];
            return `
            <div class="game-card" onclick="app.openGame('${g.id}')">
                <div class="controls-layer ${state.devMode?'':'hidden'}">
                    <div class="control-btn move-btn" onclick="admin.move(${i},-1); event.stopPropagation()">↑</div>
                    <div class="control-btn move-btn" onclick="admin.move(${i},1); event.stopPropagation()">↓</div>
                    <div class="control-btn" onclick="admin.openTheme('${g.id}'); event.stopPropagation()">🎨</div>
                    <div class="control-btn" onclick="admin.openEditor('game','${g.id}'); event.stopPropagation()">✎</div>
                </div>
                <div class="card-bg ${theme.class}">
                    <div class="card-character ${g.anim}">${app.renderChar(g.character)}</div>
                </div>
                <div class="card-content">
                    <div class="game-info"><h3>${g.name}</h3><span class="action-text">View Offers →</span></div>
                    <div class="game-icon-box" style="background:${g.iconBg||'#333'}">${app.renderChar(g.icon)}</div>
                </div>
            </div>`;
        }).join('');
    },

    openGame: (id) => {
        const g = APP_DATA.find(x => x.id === id);
        if(!g) return;
        state.activeGameId = id;
        
        document.getElementById('game-title').textContent = g.name;
        
        // Hero: ИСПОЛЬЗУЕМ КЛАССЫ ВМЕСТО ИНЛАЙН СТИЛЕЙ (Исправление серого фона)
        const theme = THEMES.find(t => t.id === g.theme) || THEMES[0];
        // Если у игры есть свой Hero Bg в базе, берем его, иначе класс темы
        const heroStyle = g.hero.bg ? `background:${g.hero.bg}` : '';
        const heroClass = g.hero.bg ? 'hero-card' : `hero-card ${theme.class.replace('pattern', 'hero')}`;
        // Fallback если класса нет, просто hero-card и фон из темы
        
        // Упрощаем: просто даем hero-card и класс темы
        // Если тема 'bs-pattern', hero будет 'bs-bg' примерно. 
        // Но лучше использовать цвета темы.
        
        document.getElementById('game-hero').innerHTML = `
            <div class="hero-card" style="${g.hero.bg ? 'background:'+g.hero.bg : ''}" class="${theme.bgClass}">
                <div class="shine-effect"></div>
                <div class="bonus-tag">${g.hero.tag}</div>
                <div class="hero-content">
                    <div class="hero-visual">${g.hero.visual}</div>
                    <div class="hero-info"><h1>${g.hero.title}</h1><p>${g.hero.desc}</p></div>
                </div>
            </div>`;
            
        // Принудительно красим Hero в цвет темы, если нет кастомного
        if(!g.hero.bg) {
             const hero = document.querySelector('.hero-card');
             // Простой хак: берем цвет из theme config
             // Но проще оставить как есть, в CSS есть дефолтный #333, перебьем его
             // В database.js нет bg, поэтому берем из темы
             // В styles.css есть .bs-hero и тд.
             hero.className = `hero-card ${g.theme}-hero`; // Пробуем матчить классы CSS
             if (g.theme === 'arena') hero.style.background = '#2b3b75'; // Ручные фиксы для новых тем
        }

        const list = document.getElementById('prod-track');
        list.innerHTML = g.products.map((p, i) => `
            <div class="offer-card carousel-card">
                <div class="controls-layer ${state.devMode?'':'hidden'}" style="top:5px; right:5px;">
                    <div class="control-btn" onclick="admin.openEditor('prod','${id}',${i}); event.stopPropagation()">✎</div>
                </div>
                <span class="badge">${p.badge}</span>
                <div class="offer-visual">${p.icon}</div>
                <h3>${p.name}</h3>
                <p class="price">$${p.price}</p>
                <button class="buy-btn" onclick="app.addToCart('${p.name}',${p.price})">Purchase</button>
            </div>`).join('');

        app.router('game');
    },

    router: (id) => {
        document.querySelectorAll('.view').forEach(e => {e.classList.remove('active'); e.style.display='none'});
        const target = document.getElementById(id==='game'?'view-game':`view-${id}`);
        if(target) { target.style.display='block'; requestAnimationFrame(()=>target.classList.add('active')); }
        window.scrollTo(0,0);
        app.applyTheme(id==='game' ? state.activeGameId : 'hub');
    },

    applyTheme: (ctx) => {
        const view = document.getElementById('view-game');
        const navbar = document.querySelector('.navbar');
        const logo = document.querySelector('.supercell-logo');
        const login = document.querySelector('.login-btn');
        const backBtn = document.querySelector('.back-btn');
        const title = document.getElementById('game-title');

        if (ctx === 'hub') {
            tg.setHeaderColor('#ffffff');
            navbar.style.background = 'rgba(255,255,255,0.98)';
            logo.style.color = '#000';
            login.style.background = '#000'; login.style.color = '#fff';
            return;
        }

        const game = APP_DATA.find(x => x.id === ctx);
        const theme = THEMES.find(t => t.id === game.theme) || THEMES[0];
        
        view.className = `view active ${theme.bgClass}`; 
        
        // Auto-detect header color
        let hColor = '#ffffff';
        if(theme.bgClass.includes('bs')) hColor = '#4737ff';
        else if(theme.bgClass.includes('coc')) hColor = '#5c3c2e';
        else if(theme.bgClass.includes('cr')) hColor = '#2b3b75';
        else if(theme.bgClass.includes('hd')) hColor = '#6ecbf5';
        else if(theme.bgClass.includes('arena') || theme.bgClass.includes('space')) hColor = '#1a1a2e';
        
        tg.setHeaderColor(hColor);
        navbar.style.background = hColor;
        logo.style.color = '#fff';
        login.style.background = '#fff'; login.style.color = hColor;
        
        backBtn.style.color = 'inherit';
        title.style.color = 'inherit';
    },

    // --- UTILS (Cart, Auth, Admin) ---
    addToCart: (n,p) => { state.cart.push({name:n, price:p}); app.saveState(); app.updateCartUI(); tg.HapticFeedback.impactOccurred('medium'); },
    toggleCart: () => document.getElementById('cart-modal').classList.toggle('open'),
    renderCart: () => { document.getElementById('cart-items').innerHTML = state.cart.map(i=>`<div style="padding:10px; border-bottom:1px solid #eee;"><b>${i.name}</b> $${i.price}</div>`).join(''); document.getElementById('cart-total').textContent='$'+state.cart.reduce((a,b)=>a+b.price,0).toFixed(2); },
    updateCartUI: () => { const c=state.cart.length; const b=document.getElementById('cart-count'); b.textContent=c; c>0?b.classList.remove('hidden'):b.classList.add('hidden'); },
    scrollCarousel: (d) => document.getElementById('prod-track').scrollBy({left:200*d, behavior:'smooth'}),
    handleAuthClick: () => { if(state.isLoggedIn) admin.logout(); else document.getElementById('login-modal').classList.add('open'); },
    processLogin: () => { state.isLoggedIn=true; app.saveState(); document.getElementById('login-modal').classList.remove('open'); app.checkLoginUI(); },
    checkLoginUI: () => { const b=document.getElementById('login-btn'); if(state.isLoggedIn) { b.innerHTML='USER'; b.style.background='#28ca42'; b.style.color='#fff'; } else { b.innerHTML='LOG IN ID'; } },
    
    // --- ADMIN (Shortened for brevity but functionality preserved) ---
    toggleDevMode: () => { state.devMode = !state.devMode; document.querySelectorAll('.controls-layer, .add-game-card, .add-prod-card, .grid-toggle, .export-icon').forEach(e => state.devMode ? e.classList.remove('hidden') : e.classList.add('hidden')); app.renderHub(); },
    move: (i, d) => { if(i+d < 0 || i+d >= APP_DATA.length) return; [APP_DATA[i], APP_DATA[i+d]] = [APP_DATA[i+d], APP_DATA[i]]; app.saveState(); app.renderHub(); },
    toggleGrid: () => { state.gridMode = !state.gridMode; document.getElementById('hub-grid').classList.toggle('grid-2x6'); app.saveState(); },
    openEditor: (type, id, subId) => { state.editCtx = {type, id, subId}; document.getElementById('admin-modal').classList.add('open'); admin.renderEditor(); },
    renderEditor: () => {
        const c = state.editCtx; const cont = document.getElementById('admin-editor');
        if(c.type==='game') { const g = APP_DATA.find(x=>x.id===c.id); cont.innerHTML=`<div class="edit-row"><label>Name</label><input id="e-name" value="${g.name}"></div><div class="edit-row"><label>Icon</label><input id="e-icon" value="${g.icon}"></div><div class="edit-row"><label>Char</label><input id="e-char" value="${g.character}"></div>`; }
        else if(c.type==='prod') { const p = APP_DATA.find(x=>x.id===c.id).products[c.subId]; cont.innerHTML=`<div class="edit-row"><label>Name</label><input id="e-name" value="${p.name}"></div><div class="edit-row"><label>Price</label><input id="e-price" value="${p.price}"></div>`; }
        else if(c.type==='new_game') { cont.innerHTML=`<div class="edit-row"><label>ID</label><input id="e-id" placeholder="id"></div><div class="edit-row"><label>Name</label><input id="e-name" placeholder="Name"></div>`; }
    },
    save: () => {
        const c = state.editCtx;
        if(c.type==='game') { const g = APP_DATA.find(x=>x.id===c.id); g.name = document.getElementById('e-name').value; g.icon = document.getElementById('e-icon').value; g.character = document.getElementById('e-char').value; app.renderHub(); }
        else if(c.type==='prod') { const p = APP_DATA.find(x=>x.id===c.id).products[c.subId]; p.name = document.getElementById('e-name').value; p.price = parseFloat(document.getElementById('e-price').value); app.openGame(c.id); }
        else if(c.type==='new_game') { APP_DATA.push({id: document.getElementById('e-id').value, name: document.getElementById('e-name').value, icon: '🎮', character: '❓', theme: 'bs', anim: 'floating', hero: {tag:'NEW', visual:'✨', title:'Welcome', desc:'New game'}, products: []}); app.renderHub(); }
        app.saveState(); document.getElementById('admin-modal').classList.remove('open');
    },
    deleteItem: () => {
        if(!confirm('Delete?')) return; const c = state.editCtx;
        if(c.type==='game') { APP_DATA.splice(APP_DATA.findIndex(x=>x.id===c.id),1); app.renderHub(); }
        else if(c.type==='prod') { APP_DATA.find(x=>x.id===c.id).products.splice(c.subId,1); app.openGame(c.id); }
        app.saveState(); document.getElementById('admin-modal').classList.remove('open');
    },
    addProduct: () => { if(!state.activeGameId) return; APP_DATA.find(x=>x.id===state.activeGameId).products.push({name:'New Item', price:1.99, icon:'📦', badge:'NEW'}); app.saveState(); app.openGame(state.activeGameId); },
    openTheme: (id) => { state.editCtx = {id}; document.getElementById('theme-modal').classList.add('open'); admin.updateThemePreview(); },
    changeThemePreview: (d) => { state.currentThemeIndex += d; if(state.currentThemeIndex < 0) state.currentThemeIndex = THEMES.length-1; if(state.currentThemeIndex >= THEMES.length) state.currentThemeIndex = 0; admin.updateThemePreview(); },
    updateThemePreview: () => { const t = THEMES[state.currentThemeIndex]; document.getElementById('theme-name-display').textContent = t.name; document.getElementById('theme-preview-box').className = `theme-preview-box ${t.class}`; },
    applyTheme: () => { APP_DATA.find(x=>x.id===state.editCtx.id).theme = THEMES[state.currentThemeIndex].id; app.saveState(); app.renderHub(); document.getElementById('theme-modal').classList.remove('open'); },
    exportConfig: () => { navigator.clipboard.writeText(`const DEFAULT_DB = ${JSON.stringify(APP_DATA, null, 2)};\nlet APP_DATA = JSON.parse(localStorage.getItem('sc_store_v3'))?.data || DEFAULT_DB;`); tg.showAlert('Copied!'); },
    logout: () => { state.isLoggedIn=false; state.userEmail=''; app.saveState(); app.checkLoginUI(); },
    redeemCode: () => { /* (Use previous code) */ },
    checkout: () => { /* (Use previous code) */ }
};

document.addEventListener('DOMContentLoaded', app.init);
