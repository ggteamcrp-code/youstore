const tg = window.Telegram.WebApp;

const app = {
    init: () => {
        // Сообщаем Telegram, что приложение готово
        tg.expand(); 
        tg.ready();
        
        // Настраиваем цвета шапки Telegram под наш стиль
        tg.setHeaderColor('#f5f5f7'); 
    },

    router: (page) => {
        // Скрываем все view
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        
        // Показываем нужную
        const target = document.getElementById(`view-${page}`);
        if(target) target.classList.add('active');

        // Динамическая смена цветов под страницу
        if (page === 'brawlstars') {
            document.body.style.backgroundColor = '#3344ff';
            tg.setHeaderColor('#3344ff'); // Красим шапку Telegram в синий
            tg.BackButton.show();
            tg.BackButton.onClick(() => app.router('hub'));
        } else {
            document.body.style.backgroundColor = '#f5f5f7';
            tg.setHeaderColor('#f5f5f7');
            tg.BackButton.hide();
        }
    }
};

// Запуск
document.addEventListener('DOMContentLoaded', app.init);
