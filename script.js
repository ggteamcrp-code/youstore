const tg = window.Telegram.WebApp;

// App State with Persistence
const state = {
    cart: [],
    isLoggedIn: false,
    userEmail: ''
};

const app = {
    init: () => {
        tg.expand();
        tg.ready();
        
        // Load Data from LocalStorage
        app.loadState();
        
        // Init UI
        app.updateCartUI();
        app.checkLoginUI();
        
        // Initial Theme
        tg.setHeaderColor('#ffffff');
    },

    saveState: () => {
        localStorage.setItem('supercell_cart', JSON.stringify(state.cart));
        localStorage.setItem('supercell_login', JSON.stringify({
            isLoggedIn: state.isLoggedIn,
            email: state.userEmail
        }));
    },

    loadState: () => {
        const savedCart = localStorage.getItem('supercell_cart');
        const savedLogin = localStorage.getItem('supercell_login');

        if (savedCart) state.cart = JSON.parse(savedCart);
        if (savedLogin) {
            const loginData = JSON.parse(savedLogin);
            state.isLoggedIn = loginData.isLoggedIn;
            state.userEmail = loginData.email;
        }
    },

    router: (viewId) => {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        window.scrollTo(0, 0);

        // Theme Switcher
        const navbar = document.querySelector('.navbar');
        const logo = document.querySelector('.supercell-logo');
        const loginBtn = document.querySelector('.login-btn');

        if (viewId === 'brawlstars') {
            tg.setHeaderColor('#4737ff');
            navbar.style.background = 'rgba(71, 55, 255, 0.95)';
            navbar.style.color = '#fff';
            logo.style.color = '#fff';
            loginBtn.style.background = '#fff';
            loginBtn.style.color = '#000';
        } else {
            tg.setHeaderColor('#ffffff');
            navbar.style.background = 'rgba(255,255,255,0.95)';
            navbar.style.color = '#111';
            logo.style.color = '#111';
            loginBtn.style.background = '#000';
            loginBtn.style.color = '#fff';
        }
    },

    // --- CART LOGIC ---
    addToCart: (name, price) => {
        tg.HapticFeedback.impactOccurred('medium');
        
        state.cart.push({ name, price, id: Date.now() }); // Unique ID for deletion
        app.saveState();
        app.updateCartUI();
        
        // Pulse Animation
        const btn = document.getElementById('cart-btn');
        btn.classList.remove('bump');
        void btn.offsetWidth; // Trigger reflow
        btn.classList.add('bump');
    },

    removeFromCart: (index) => {
        tg.HapticFeedback.impactOccurred('light');
        state.cart.splice(index, 1);
        app.saveState();
        app.updateCartUI();
        app.renderCartItems(); // Re-render list immediately
    },

    updateCartUI: () => {
        const count = state.cart.length;
        const badge = document.getElementById('cart-count');
        
        badge.textContent = count;
        if (count > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
        
        // Total Calc
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
            list.innerHTML = '<p class="empty-msg" style="color:#888; padding:20px 0;">Your cart is empty 🥺</p>';
        } else {
            list.innerHTML = state.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${item.price}</span>
                    </div>
                    <span class="remove-btn" onclick="app.removeFromCart(${index})">✕</span>
                </div>
            `).join('');
        }
    },

    checkout: () => {
        // AUTH GUARD: Force Login
        if (!state.isLoggedIn) {
            app.toggleCart(); // Close cart
            setTimeout(() => {
                tg.showAlert('Please Log In to continue');
                app.toggleLogin(); // Open login
            }, 300);
            return;
        }

        if (state.cart.length === 0) return;

        tg.showPopup({
            title: 'Confirm Purchase',
            message: `Pay $${state.cart.reduce((a,b)=>a+b.price,0).toFixed(2)} using Telegram Stars?`,
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

    // --- LOGIN LOGIC ---
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
            
            // Reset modal for next time
            setTimeout(() => {
                document.querySelector('.login-step-1').classList.remove('hidden');
                document.querySelector('.login-loader').classList.add('hidden');
            }, 500);

            tg.HapticFeedback.notificationOccurred('success');
        }, 1500);
    },

    checkLoginUI: () => {
        if (state.isLoggedIn) {
            const btn = document.getElementById('login-btn');
            const name = state.userEmail.split('@')[0];
            btn.innerHTML = `👤 ${name.length > 8 ? name.slice(0,8)+'...' : name}`;
            btn.style.background = '#28ca42'; // Supercell Green
            btn.style.color = '#fff';
            btn.style.border = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
