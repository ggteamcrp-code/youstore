const tg = window.Telegram.WebApp;

// THEMES REGISTRY
const THEMES = [
    {id: 'bs', name: 'Brawl Stars', class: 'bs-pattern'},
    {id: 'coc', name: 'Clash Clans', class: 'coc-pattern'},
    {id: 'cr', name: 'Clash Royale', class: 'cr-pattern'},
    {id: 'hd', name: 'Hay Day', class: 'hd-pattern'},
    {id: 'arena', name: 'CR Arena', class: 'theme-arena'},
    {id: 'inferno', name: 'Inferno', class: 'theme-inferno'},
    {id: 'cyber', name: 'Cyberpunk', class: 'theme-cyber'},
    {id: 'forest', name: 'Forest', class: 'theme-forest'},
    {id: 'gold', name: 'Gold Vault', class: 'theme-gold'},
    {id: 'ice', name: 'Ice Age', class: 'theme-ice'},
    {id: 'space', name: 'Space', class: 'theme-space'},
    {id: 'candy', name: 'Candy', class: 'theme-candy'},
    {id: 'blueprint', name: 'Blueprint', class: 'theme-blueprint'},
    {id: 'matrix', name: 'Matrix', class: 'theme-matrix'},
    {id: 'water', name: 'Underwater', class: 'theme-water'},
    {id: 'noir', name: 'Noir', class: 'theme-noir'},
    {id: 'glitch', name: 'Glitch', class: 'theme-glitch'},
    {id: 'sunset', name: 'Sunset', class: 'theme-sunset'},
    {id: 'toxic', name: 'Toxic', class: 'theme-toxic'},
    {id: 'galaxy', name: 'Galaxy', class: 'theme-galaxy'}
];

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: '',
    devMode: false,
    secretTapCount: 0,
    activeGameId: null,
    gridMode: false, // 1col vs 2col
    editingThemeGameId: null, // Какую игру красим
    currentThemeIndex: 0 // Для листалки тем
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // 5 Taps Secret
        document.querySelector('.logo-container').addEventListener('click', () => {
            state.secretTapCount++;
            if(state.secretTapCount === 5) admin.toggleDevMode();
            setTimeout(() => state.secretTapCount = 0, 2000);
        });

        app.loadState();
        app.updateCartUI();
        app.checkLoginUI();
        
        // Apply Grid Settings
        if(state.gridMode) document.getElementById('hub-grid').classList.add('grid-2x6');
        
        app.renderHub();
        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        app.router('hub');
    },

    saveState: () => {
        // Save everything including admin settings
        localStorage.setItem('sc_store_data', JSON.stringify({
            cart: state.cart,
            user: {loggedin: state.isLoggedIn, email: state.userEmail},
            settings: {gridMode: state.gridMode},
            data: APP_DATA // Save modified DB!
        }));
    },

    loadState: () => {
        try {
            const raw = localStorage.getItem('sc_store_data');
            if(raw) {
                const d = JSON.parse(raw);
                state.cart = d.cart || [];
                state.isLoggedIn = d.user?.loggedin || false;
                state.userEmail = d.user?.email || '';
                state.gridMode = d.settings?.gridMode || false;
                if(d.data) window.APP_DATA = d.data; // Overwrite DB with local changes
            }
        } catch(e) {}
    },

    // RENDER HELPERS
    renderChar: (char) => {
        // Проверяем, это URL картинки или эмодзи
        if(char.includes('http') || char.includes('data:image')) {
            return `<img src="${char}" alt="char">`;
        }
        return char;
    },

    renderHub: () => {
        const grid = document.getElementById('hub-grid');
        grid.innerHTML = APP_DATA.map((game, i) => {
            // Находим класс темы
            const themeObj = THEMES.find(t => t.id === game.theme) || THEMES[0];
            const themeClass = themeObj.class;
            
            return `
            <div class="game-card" onclick="app.openGame('${game.id}')">
                <!-- CONTROLS LAYER (Dev Mode) -->
                <div class="controls-layer ${state.devMode ? '' : 'hidden'}">
                    <div class="control-btn move-btn" onclick="admin.moveGame(${i}, -1); event.stopPropagation();">↑</div>
                    <div class="control-btn move-btn" onclick="admin.moveGame(${i}, 1); event.stopPropagation();">↓</div>
                    <div class="control-btn" onclick="admin.openThemeEditor('${game.id}'); event.stopPropagation();">🎨</div>
                    <div class="control-btn" onclick="admin.openEditor('game', '${game.id}'); event.stopPropagation();">✎</div>
                </div>

                <div class="card-bg ${themeClass}">
                    <div class="card-character ${game.anim}">${app.renderChar(game.character)}</div>
                </div>
                <div class="card-content">
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        <span class="action-text">View Offers →</span>
                    </div>
                    <div class="game-icon-box" style="background:${game.iconBg || '#333'}">
                        ${app.renderChar(game.icon)}
                    </div>
                </div>
            </div>
        `}).join('');
    },

    openGame: (gameId) => {
        const game = APP_DATA.find(g => g.id === gameId);
        if(!game) return;
        state.activeGameId = gameId;
        
        document.getElementById('game-title').textContent = game.name.toUpperCase();
        const themeObj = THEMES.find(t => t.id === game.theme) || THEMES[0];
        
        // Hero
        document.getElementById('game-hero').innerHTML = `
            <div class="hero-card" style="background:${game.hero.bg || '#333'}">
                <div class="shine-effect"></div>
                <div class="bonus-tag">${game.hero.tag}</div>
                <div class="hero-content">
                    <div class="hero-visual">${game.hero.visual}</div>
                    <div class="hero-info"><h1>${game.hero.title}</h1><p>${game.hero.desc}</p></div>
                </div>
            </div>
        `;

        // Products
        const list = document.getElementById('prod-track');
        list.innerHTML = game.products.map((prod, i) => `
            <div class="offer-card carousel-card">
                <div class="controls-layer ${state.devMode ? '' : 'hidden'}" style="top:5px; right:5px;">
                    <div class="control-btn" onclick="admin.openEditor('product', '${game.id}', ${i}); event.stopPropagation();">✎</div>
                </div>
                <span class="badge">${prod.badge}</span>
                <div class="offer-visual">${prod.icon}</div>
                <h3>${prod.name}</h3>
                <p class="price">$${prod.price}</p>
                <button class="buy-btn" onclick="app.addToCart('${prod.name}', ${prod.price})">Purchase</button>
            </div>
        `).join('');

        // Apply theme color to dynamic background
        const view = document.getElementById('view-game');
        view.className = `view active`; // Reset
        view.style.background = '#f0f2f5'; // Reset
        // Можно добавить логику динамического фона по теме, но пока оставим просто цвет
        
        app.router('game');
    },

    // --- STANDARD ROUTER & CART (Compact) ---
    router: (id) => {
        document.querySelectorAll('.view').forEach(e => {e.classList.remove('active'); e.style.display='none'});
        const t = document.getElementById(id==='game'?'view-game':`view-${id}`);
        if(t){t.style.display='block'; requestAnimationFrame(()=>t.classList.add('active'));}
        window.scrollTo(0,0);
        // Header color logic omitted for brevity, stick to white/black
    },
    addToCart: (n,p) => { state.cart.push({name:n, price:p}); app.saveState(); app.updateCartUI(); tg.HapticFeedback.impactOccurred('medium'); },
    toggleCart: () => { const m=document.getElementById('cart-modal'); if(!m.classList.contains('open')) app.renderCart(); m.classList.toggle('open'); },
    renderCart: () => { document.getElementById('cart-items').innerHTML = state.cart.map(i=>`<div style="padding:10px; border-bottom:1px solid #eee;"><b>${i.name}</b> $${i.price}</div>`).join(''); document.getElementById('cart-total').textContent='$'+state.cart.reduce((a,b)=>a+b.price,0).toFixed(2); },
    handleAuthClick: () => { if(state.isLoggedIn) admin.logout(); else document.getElementById('login-modal').classList.add('open'); },
    processLogin: () => { state.isLoggedIn=true; app.saveState(); document.getElementById('login-modal').classList.remove('open'); app.checkLoginUI(); },
    checkLoginUI: () => { const b=document.getElementById('login-btn'); if(state.isLoggedIn) { b.innerHTML='👤 USER'; b.style.background='#28ca42'; } else { b.innerHTML='LOG IN ID'; b.style.background='#000'; } },
    updateCartUI: () => { 
        const c=state.cart.length; 
        const b=document.getElementById('cart-count'); 
        b.textContent=c; 
        c>0?b.classList.remove('hidden'):b.classList.add('hidden');
    },
    scrollCarousel: (d) => { document.getElementById('prod-track').scrollBy({left:200*d, behavior:'smooth'}); }
};

// --- ADMIN ENGINE ---
const admin = {
    toggleDevMode: () => {
        state.devMode = !state.devMode;
        
        // Show/Hide controls
        document.querySelectorAll('.controls-layer, .add-game-card, .add-prod-card, .grid-toggle, .export-icon').forEach(el => {
            state.devMode ? el.classList.remove('hidden') : el.classList.add('hidden');
        });
        
        tg.showAlert(state.devMode ? '🛠 DEV MODE ON' : 'DEV MODE OFF');
        app.renderHub(); // Refresh to show controls
    },

    toggleGrid: () => {
        state.gridMode = !state.gridMode;
        const grid = document.getElementById('hub-grid');
        state.gridMode ? grid.classList.add('grid-2x6') : grid.classList.remove('grid-2x6');
        app.saveState();
    },

    moveGame: (index, dir) => {
        if (index + dir < 0 || index + dir >= APP_DATA.length) return;
        // Swap
        [APP_DATA[index], APP_DATA[index+dir]] = [APP_DATA[index+dir], APP_DATA[index]];
        app.saveState();
        app.renderHub();
    },

    openEditor: (type, id, subId) => {
        const modal = document.getElementById('admin-modal');
        const content = document.getElementById('admin-editor');
        modal.classList.add('open');
        
        // Store context for save/delete
        state.editContext = { type, id, subId };

        let html = '';
        if (type === 'game') {
            const g = APP_DATA.find(x => x.id === id);
            html = `
                <h3>Edit Game</h3>
                <div class="edit-row"><label>Name</label><input id="ed-name" value="${g.name}"></div>
                <div class="edit-row"><label>Icon (Emoji/URL)</label><input id="ed-icon" value="${g.icon}"></div>
                <div class="edit-row"><label>Icon BG (Color)</label><input id="ed-bg" value="${g.iconBg || '#333'}"></div>
                <div class="edit-row"><label>Char (Emoji/URL)</label><input id="ed-char" value="${g.character}"></div>
            `;
        } else if (type === 'product') {
            const g = APP_DATA.find(x => x.id === id);
            const p = g.products[subId];
            html = `
                <h3>Edit Product</h3>
                <div class="edit-row"><label>Name</label><input id="ed-name" value="${p.name}"></div>
                <div class="edit-row"><label>Price</label><input id="ed-price" value="${p.price}"></div>
                <div class="edit-row"><label>Badge</label><input id="ed-badge" value="${p.badge}"></div>
            `;
        } else if (type === 'new_game') {
            html = `
                <h3>New Game</h3>
                <div class="edit-row"><label>ID</label><input id="ed-id" placeholder="unique_id"></div>
                <div class="edit-row"><label>Name</label><input id="ed-name" placeholder="Name"></div>
            `;
        }
        content.innerHTML = html;
        
        // Show/Hide delete button
        const delBtn = document.getElementById('delete-trigger');
        if(type === 'new_game') delBtn.style.display = 'none';
        else delBtn.style.display = 'block';
    },

    save: () => {
        const ctx = state.editContext;
        if(ctx.type === 'game') {
            const g = APP_DATA.find(x => x.id === ctx.id);
            g.name = document.getElementById('ed-name').value;
            g.icon = document.getElementById('ed-icon').value;
            g.iconBg = document.getElementById('ed-bg').value;
            g.character = document.getElementById('ed-char').value;
            app.renderHub();
        } else if (ctx.type === 'product') {
            const g = APP_DATA.find(x => x.id === ctx.id);
            const p = g.products[ctx.subId];
            p.name = document.getElementById('ed-name').value;
            p.price = parseFloat(document.getElementById('ed-price').value);
            p.badge = document.getElementById('ed-badge').value;
            app.openGame(ctx.id);
        } else if (ctx.type === 'new_game') {
            const newG = {
                id: document.getElementById('ed-id').value,
                name: document.getElementById('ed-name').value,
                icon: '🎮', iconBg: '#000', character: '❓', theme: 'bs', anim: 'floating',
                hero: {tag:'NEW', visual:'✨', title:'Welcome', desc:'New game'},
                products: []
            };
            APP_DATA.push(newG);
            app.renderHub();
        }
        app.saveState();
        document.getElementById('admin-modal').classList.remove('open');
    },

    deleteItem: () => {
        const ctx = state.editContext;
        if(confirm('Delete this item?')) {
            if(ctx.type === 'game') {
                const idx = APP_DATA.findIndex(x => x.id === ctx.id);
                APP_DATA.splice(idx, 1);
                app.renderHub();
            } else if(ctx.type === 'product') {
                const g = APP_DATA.find(x => x.id === ctx.id);
                g.products.splice(ctx.subId, 1);
                app.openGame(ctx.id);
            }
            app.saveState();
            document.getElementById('admin-modal').classList.remove('open');
        }
    },

    addProduct: () => {
        if(!state.activeGameId) return;
        const g = APP_DATA.find(x => x.id === state.activeGameId);
        g.products.push({name: 'New Item', price: 0.99, badge: 'NEW', icon: '📦'});
        app.saveState();
        app.openGame(state.activeGameId);
    },

    // THEME EDITOR
    openThemeEditor: (gameId) => {
        state.editingThemeGameId = gameId;
        const game = APP_DATA.find(x => x.id === gameId);
        // Find index of current theme
        state.currentThemeIndex = THEMES.findIndex(t => t.id === game.theme);
        if(state.currentThemeIndex === -1) state.currentThemeIndex = 0;
        
        admin.updateThemePreview();
        document.getElementById('theme-modal').classList.add('open');
    },

    changeThemePreview: (dir) => {
        state.currentThemeIndex += dir;
        if(state.currentThemeIndex < 0) state.currentThemeIndex = THEMES.length - 1;
        if(state.currentThemeIndex >= THEMES.length) state.currentThemeIndex = 0;
        admin.updateThemePreview();
    },

    updateThemePreview: () => {
        const theme = THEMES[state.currentThemeIndex];
        const box = document.getElementById('theme-preview-box');
        document.getElementById('theme-name-display').textContent = theme.name;
        
        // Remove all theme classes and add new one
        box.className = 'theme-preview-box ' + theme.class;
    },

    applyTheme: () => {
        const game = APP_DATA.find(x => x.id === state.editingThemeGameId);
        game.theme = THEMES[state.currentThemeIndex].id;
        app.saveState();
        app.renderHub();
        document.getElementById('theme-modal').classList.remove('open');
    },

    exportConfig: () => {
        const code = `const DEFAULT_DB = ${JSON.stringify(APP_DATA, null, 2)};\nlet APP_DATA = JSON.parse(localStorage.getItem('sc_store_data'))?.data || DEFAULT_DB;`;
        navigator.clipboard.writeText(code);
        tg.showAlert('Config copied to clipboard!');
    }
};

document.addEventListener('DOMContentLoaded', app.init);

