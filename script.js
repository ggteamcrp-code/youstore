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
        tg.setHeaderColor('#ffffff'); // Старт с белой шапкой
        
        // Восстановление данных (опционально)
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
            app.updateCartUI();
        }
    },

    router: (viewId) => {
        // Switch Views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        // Scroll to top
        window.scrollTo(0, 0);

        // Update Theme
        if (viewId === 'brawlstars') {
            tg.setHeaderColor('#4737ff'); // Синяя шапка
            document.querySelector('.navbar').style.background = 'rgba(71, 55, 255, 0.95)';
            document.querySelector('.navbar').style.color = '#fff';
            document.querySelector('.supercell-logo').style.color = '#fff';
            document.querySelector('.login-btn').style.background = '#fff';
            document.querySelector('.login-btn').style.color = '#000';
        } else {
            tg.setHeaderColor('#ffffff'); // Белая шапка
            document.querySelector('.navbar').style.background = 'rgba(255,255,255,0.9)';
            document.querySelector('.navbar').style.color = '#111';
            document.querySelector('.supercell-logo').style.color = '#111';
            document.querySelector('.login-btn').style.background = '#111';
            document.querySelector('.login-btn').style.color = '#fff';
        }
    },

    // --- CART LOGIC ---
    addToCart: (name, price) => {
        // Haptic Feedback (вибрация телефона)
        tg.HapticFeedback.notificationOccurred('success');
        
        state.cart.push({ name, price });
        localStorage.setItem('cart', JSON.stringify(state.cart));
        app.updateCartUI();
        
        // Visual Feedback
        const badge = document.getElementById('cart-count');
        badge.style.transform = 'scale(1.5)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    },

    updateCartUI: () => {
        const count = state.cart.length;
        const badge = document.getElementById('cart-count');
        
        badge.textContent = count;
        if (count > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
        
        // Calc total
        const total = state.cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
    },

    toggleCart: () => {
        const modal = document.getElementById('cart-modal');
        const list = document.getElementById('cart-items');
        
        if (!modal.classList.contains('open')) {
            // Render Items
            if (state.cart.length === 0) {
                list.innerHTML = '<p class="empty-msg">Cart is empty 🥺</p>';
            } else {
                list.innerHTML = state.cart.map((item, index) => `
                    <div class="cart-item">
                        <span>${item.name}</span>
                        <b>$${item.price}</b>
                    </div>
                `).join('');
            }
        }
        modal.classList.toggle('open');
    },

    checkout: () => {
        if (state.cart.length === 0) return;
        tg.showPopup({
            title: 'Payment',
            message: `Pay $${state.cart.reduce((a,b)=>a+b.price,0).toFixed(2)}?`,
            buttons: [{type: 'ok', text: 'Pay with Stars'}]
        }, () => {
            state.cart = [];
            app.updateCartUI();
            app.toggleCart();
            tg.HapticFeedback.notificationOccurred('success');
        });
    },

    // --- LOGIN LOGIC ---
    toggleLogin: () => {
        if (state.isLoggedIn) return; // Уже вошел
        document.getElementById('login-modal').classList.toggle('open');
    },

    processLogin: () => {
        const email = document.getElementById('email-input').value;
        if (!email.includes('@')) {
            tg.showAlert('Please enter a valid email');
            return;
        }

        // UI Change
        document.querySelector('.login-step-1').classList.add('hidden');
        document.querySelector('.login-loader').classList.remove('hidden');

        // Fake Delay
        setTimeout(() => {
            state.isLoggedIn = true;
            state.userEmail = email;
            
            // Close modal
            document.getElementById('login-modal').classList.remove('open');
            
            // Update UI
            const btn = document.getElementById('login-btn');
            btn.innerHTML = `👤 ${email.split('@')[0]}`;
            btn.style.background = '#28ca42'; // Green
            btn.style.border = 'none';
            
            tg.HapticFeedback.notificationOccurred('success');
        }, 1500);
    }
};

document.addEventListener('DOMContentLoaded', app.init);
