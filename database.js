const DB = [
    {
        id: "brawlstars",
        name: "Brawl Stars",
        icon: "★",
        character: "💀",
        anim: "floating", // floating, clashing, tilting, bouncing
        theme: "bs", // bs, coc, cr, hd (для цветов)
        hero: {
            tag: "STORE BONUS",
            visual: "💎",
            title: "+10% ON GEMS",
            desc: "Get bonus gems, coins, or bling instantly!"
        },
        products: [
            { name: "Brawl Pass Plus", price: 9.99, icon: "🎫", badge: "INSTANT 30%" },
            { name: "170 Gems Pack", price: 9.99, icon: "💰", badge: "BONUS x2" },
            { name: "Skin: Mecha Crow", price: 14.99, icon: "🤖", badge: "LEGENDARY" }
        ]
    },
    {
        id: "clashofclans",
        name: "Clash of Clans",
        icon: "🔨",
        character: "⚔️",
        anim: "clashing",
        theme: "coc",
        hero: {
            tag: "GOLD PASS",
            visual: "🛡️",
            title: "STAMP CARD",
            desc: "You'll earn a free Book of Everything!"
        },
        products: [
            { name: "Book of Building", price: 4.99, icon: "📕", badge: "x5 VALUE" },
            { name: "Resource Potion", price: 1.99, icon: "🧪", badge: "BOOST" }
        ]
    },
    {
        id: "clashroyale",
        name: "Clash Royale",
        icon: "🏰",
        character: "👑",
        anim: "tilting",
        theme: "cr",
        hero: {
            tag: "ROYALE PASS",
            visual: "👑",
            title: "PASS ROYALE",
            desc: "Earn a free Royal Wild Chest!"
        },
        products: [
            { name: "Ice Golem Bundle", price: 6.99, icon: "☃️", badge: "BUNDLE" },
            { name: "Lucky Drop", price: 2.99, icon: "📦", badge: "2 STARS" }
        ]
    },
    {
        id: "hayday",
        name: "Hay Day",
        icon: "🌾",
        character: "🐔",
        anim: "bouncing",
        theme: "hd",
        hero: {
            tag: "SEASON",
            visual: "🐣",
            title: "FARM PASS",
            desc: "Activate it in game at any time!"
        },
        products: [
            { name: "Expansion Pack", price: 5.99, icon: "🪵", badge: "EXPANSION" },
            { name: "1000 Keys", price: 9.99, icon: "🗝️", badge: "KEY DEAL" }
        ]
    }
];
