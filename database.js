// И ЗАМЕНИТЕ ЕГО НА ЭТОТ:
const DB = [
    {
        id: 'brawlstars',
        name: 'Brawl Stars',
        theme: 'bs',
        anim: 'floating',
        pattern: 'techno-grid-pattern',
        character: 'img/bs-character.png', // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        icon: '💀',
        hero: {
            tag: 'FREE GEMS',
            title: 'LEGENDARY PASS',
            desc: 'Unlock exclusive content and accelerate your progress!',
            visual: '💎'
        },
        products: [
            { name: '170 Gems', price: 9.99, icon: '💎', badge: 'Popular' },
            { name: '360 Gems', price: 19.99, icon: '💎', badge: 'Best Value' },
            { name: '950 Gems', price: 49.99, icon: '💎', badge: 'Large' },
        ]
    },
    {
        id: 'clashofclans',
        name: 'Clash of Clans',
        theme: 'coc',
        anim: 'clashing',
        pattern: 'jungle-ruins-pattern',
        character: 'img/coc-character.png', // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        icon: '👺',
        hero: {
            tag: '20% MORE',
            title: 'GOLDEN BOAR',
            desc: 'Fill your treasury with this limited time offer.',
            visual: '🐷'
        },
        products: [
            { name: '1500 Gems', price: 9.99, icon: '💎', badge: 'Popular' },
            { name: '3200 Gems', price: 19.99, icon: '💎', badge: 'Best Value' },
            { name: '8000 Gems', price: 49.99, icon: '💎', badge: 'Large' },
        ]
    },
    {
        id: 'clashroyale',
        name: 'Clash Royale',
        theme: 'cr',
        anim: 'tilting',
        pattern: 'cr-battle-arena-wrapper',
        character: null, // <-- ИЗМЕНЕНИЕ: Для CR персонаж не нужен, так как там целая арена
        icon: '🤴',
        hero: {
            tag: 'BEST VALUE',
            title: 'CHEST OF LEGENDS',
            desc: 'Guaranteed Legendary card and a huge amount of gold.',
            visual: '📦'
        },
        products: [
            { name: '170 Gems', price: 9.99, icon: '💎', badge: 'Popular' },
            { name: '360 Gems', price: 19.99, icon: '💎', badge: 'Best Value' },
            { name: '950 Gems', price: 49.99, icon: '💎', badge: 'Large' },
        ]
    },
    {
        id: 'hayday',
        name: 'Hay Day',
        theme: 'hd',
        anim: 'bouncing',
        pattern: 'ocean-deep-pattern',
        character: 'img/hd-character.png', // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
        icon: '🚜',
        hero: {
            tag: 'SEASONAL',
            title: 'FARMER\'S DELIGHT',
            desc: 'Get a head start on the season with this bundle.',
            visual: '🌽'
        },
        products: [
            { name: '170 Diamonds', price: 9.99, icon: '💎', badge: 'Popular' },
            { name: '360 Diamonds', price: 19.99, icon: '💎', badge: 'Best Value' },
            { name: '950 Diamonds', price: 49.99, icon: '💎', badge: 'Large' },
        ]
    }
];
