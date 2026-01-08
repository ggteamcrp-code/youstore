const tg = window.Telegram.WebApp;

const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: ''
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // Hide all views initially (Safety)
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
            email: state.userEmail
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
            }
        } catch(e) {}
    },

    router: (viewId) => {
        // 1. Hide All
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });

        // 2. Show Target
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.style.display = 'block';
            requestAnimationFrame(() => target.classList.add('active'));
        }
        window.scrollTo(0,0);

        // 3. Theme Colors Configuration
        const navbar = document.querySelector('.navbar');
        const loginBtn = document.querySelector('.login-btn');
        const logo = document.querySelector('.supercell-logo');

        // Defaults (White Theme)
        let headerColor = '#ffffff';
        let navBg = 'rgba(255,255,255,0.98)';
        let navColor = '#111';
        let btnBg = '#000';
        let btnColor = '#fff';

        // Game Specific Themes
        switch(viewId) {
            case 'brawlstars':
                headerColor = '#4737ff';
                navBg = 'rgba(71, 55, 255, 0.98)';
                navColor = '#fff';
                btnBg = '#fff'; btnColor = '#000';
                break;
            case 'clashofclans':
                headerColor = '#5c3c2e'; // Brown
                navBg = 'rgba(92, 60, 46, 0.98)';
                navColor = '#fff';
                btnBg = '#fff'; btnColor = '#442817';
                break;
            case 'clashroyale':
                headerColor = '#2b3b75'; // Dark Blue
                navBg = 'rgba(43, 59, 117, 0.98)';
                navColor = '#fff';
                btnBg = '#fff'; btnColor = '#2b3b75';
                break;
            case 'hayday':
                headerColor = '#6ecbf5'; // Sky Blue
                navBg = 'rgba(110, 203, 245, 0.98)';
                navColor = '#2a5a00'; // Dark Green text
                btnBg = '#2a5a00'; btnColor = '#fff';
                break;
        }

        // Apply Colors
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
        if (!modal.classList.contains('open')) app.renderCartItems();
        modal.classList.toggle('open');
    },

    renderCartItems: () => {
        const list = document.getElementById('cart-items');
        if (state.cart.length === 0) {
            list.innerHTML = '<div style="padding:20px 0; color:#999;">Cart is empty</div>';
        } else {
            list.innerHTML = state.cart.map((item, i) => `
                <div class="cart-item" style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
                    <div style="text-align:left;"><b>${item.name}</b><br><span style="color:#666;">$${item.price}</span></div>
                    <div onclick="app.removeFromCart(${i})" style="color:red; font-weight:bold; cursor:pointer; padding:5px;">✕</div>
                </div>
            `).join('');
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
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
