// --- SVGs ---
const ICONS = {
    coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
    die: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></svg>`,
    d10: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 12l10 10 10-10L12 2zm0 2l8 8-8 8-8-8 8-8z"/></svg>`,
    d20: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l-8.5 5v10l8.5 5 8.5-5v-10z"/><path d="M12 22v-10"/><path d="M3.5 7l8.5 5 8.5-5"/><path d="M12 12l-8.5 5"/><path d="M12 12l8.5 5"/></svg>`,
    custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
};

const ARENA_SVGS = {
    coin: `<svg class="arena-svg" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
    die: `<svg class="arena-svg" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/></svg>`
};

const app = {
    lang: 'en',
    currentDie: null,
    pool: [],
    sounds: {
        dice: new Audio('sounds/dice.mp3'),
        coin: new Audio('sounds/coin.mp3')
    },

    init: function () {
        this.initTheme();
        this.detectLanguage();
        this.renderIcons();
        this.renderSaved();

        // Listeners
        document.getElementById('languageSelector').addEventListener('change', (e) => {
            if (e.target.value === 'auto') this.detectLanguage();
            else this.setLanguage(e.target.value);
        });
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    },

    // --- SOUND ---
    playSound: function (type) {
        try {
            const sound = type === 'coin' ? this.sounds.coin : this.sounds.dice;
            sound.currentTime = 0; sound.volume = 0.5;
            sound.play().catch(e => { });
        } catch (e) { }
    },

    // --- THEME ---
    initTheme: function () {
        const saved = localStorage.getItem('theme');
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && sysDark)) {
            document.body.classList.add('dark-mode');
            this.updateThemeIcons(true);
        } else {
            this.updateThemeIcons(false);
        }
    },
    toggleTheme: function () {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeIcons(isDark);
    },
    updateThemeIcons: function (isDark) {
        document.getElementById('icon-sun').classList.toggle('hidden', isDark);
        document.getElementById('icon-moon').classList.toggle('hidden', !isDark);
    },

    // --- I18N ---
    renderIcons: function () {
        document.getElementById('icon-coin-dash').innerHTML = ICONS.coin;
        document.getElementById('icon-d6-dash').innerHTML = ICONS.die;
        document.getElementById('icon-d10-dash').innerHTML = ICONS.d10;
        document.getElementById('icon-d20-dash').innerHTML = ICONS.d20;
    },
    detectLanguage: function () {
        const browser = navigator.language.split('-')[0];
        const valid = ['en', 'es'].includes(browser) ? browser : 'en';
        document.getElementById('languageSelector').value = 'auto';
        this.setLanguage(valid);
    },
    setLanguage: function (lang) {
        this.lang = lang;
        const texts = TRANSLATIONS[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (texts[el.dataset.i18n]) el.innerText = texts[el.dataset.i18n];
        });
        document.getElementById('newDieName').placeholder = texts.placeholder_name;
    },
    t: function (key) { return TRANSLATIONS[this.lang][key] || key; },

    // --- TRAY LOGIC ---
    addToTray: function (type, customId) {
        let dieObj = null;

        if (type === 'coin') dieObj = { type: 'coin', name: 'Coin', faces: this.lang === 'es' ? ['Cara', 'Cruz'] : ['H', 'T'] };
        else if (type === 'd6') dieObj = { type: 'die', name: 'D6', faces: [1, 2, 3, 4, 5, 6] };
        else if (type === 'd10') dieObj = { type: 'die', name: 'D10', faces: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
        else if (type === 'd20') dieObj = { type: 'die', name: 'D20', faces: Array.from({ length: 20 }, (_, i) => i + 1) };

        else if (type === 'custom') {
            const saved = JSON.parse(localStorage.getItem('minimalDice') || '[]');
            const found = saved.find(d => Number(d.id) === Number(customId));
            if (found) {
                dieObj = { ...found, type: 'die', isCustom: true };
            }
        }

        if (dieObj) {
            this.pool.push(dieObj);
            this.renderTray();
            if (navigator.vibrate) navigator.vibrate(30);
        }
    },
    removeDie: function (index) {
        this.pool.splice(index, 1);
        this.renderTray();
    },
    renderTray: function () {
        const tray = document.getElementById('dice-tray');
        const list = document.getElementById('tray-list');
        const countSpan = document.getElementById('tray-count');

        if (this.pool.length === 0) {
            tray.classList.add('hidden');
            return;
        }

        tray.classList.remove('hidden');
        list.innerHTML = '';
        countSpan.innerText = this?.pool?.length ?? '0';

        this.pool.forEach((die, index) => {
            const item = document.createElement('div');
            item.className = 'tray-item';
            let label = '?';

            if (die.type === 'coin') label = 'C';
            else if (die.name === 'D6') label = '6';
            else if (die.name === 'D10') label = '10';
            else if (die.name === 'D20') label = '20';
            else if (die.isCustom) {
                label = die.name ? die.name.charAt(0).toUpperCase() : '*';
            } else {
                label = die.name.charAt(0);
            }

            item.innerText = label;
            item.onclick = () => this.removeDie(index);

            list.appendChild(item);
        });

        list.scrollLeft = list.scrollWidth;
    },
    clearTray: function () {
        this.pool = [];
        this.renderTray();
    },
    rollTray: function () {
        if (this.pool.length > 0) this.openArena('tray');
    },

    // --- ARENA ---
    openArena: function (mode) {
        if (mode === 'tray') {
            this.currentDie = { type: 'tray', name: 'Mix', pool: [...this.pool] };
            document.getElementById('arena-settings-container').style.display = 'none';
        } else {
            document.getElementById('arena-settings-container').style.display = 'flex';
        }
        document.getElementById('arena-title').innerText = this.currentDie.name;
        document.getElementById('arena-result').innerHTML = '<div style="opacity:0.3; font-size:4rem">🎲</div>';
        document.getElementById('view-dashboard').classList.remove('active');
        document.getElementById('view-arena').classList.add('active');
    },
    goHome: function () {
        document.getElementById('view-arena').classList.remove('active');
        document.getElementById('view-dashboard').classList.add('active');
        setTimeout(() => { document.getElementById('arena-result').innerHTML = ''; }, 300);
    },
    rollNow: function () {
        const resultContainer = document.getElementById('arena-result');
        resultContainer.innerHTML = '';

        let diceToRoll = [];
        if (this.currentDie.type === 'tray') diceToRoll = this.currentDie.pool;
        else {
            const qty = parseInt(document.getElementById('arenaQty').value) || 1;
            for (let i = 0; i < qty; i++) diceToRoll.push(this.currentDie);
        }

        this.playSound('dice');

        diceToRoll.forEach((die) => {
            const isCoin = die.type === 'coin';
            const wrapper = document.createElement('div');
            wrapper.className = isCoin ? 'coin-container' : 'die-container';
            const svgBg = isCoin ? ARENA_SVGS.coin : ARENA_SVGS.die;
            const val = die.faces[Math.floor(Math.random() * die.faces.length)];
            const delay = Math.random() * 0.15;

            wrapper.innerHTML = `
                ${svgBg}
                <div class="result-text anim-reveal" style="animation-delay: ${delay + 0.3}s">${val}</div>
            `;
            wrapper.style.animation = 'none';
            wrapper.offsetHeight;
            wrapper.style.animation = isCoin
                ? `flipCoin 0.6s ease-out forwards ${delay}s`
                : `spin3d 0.6s ease-out forwards ${delay}s`;
            resultContainer.appendChild(wrapper);
        });
    },

    // --- CREATOR ---
    openCreator: function () {
        document.getElementById('newDieName').value = '';
        document.getElementById('newDieFacesQty').value = 6;
        this.generateFacesInputs();
        document.getElementById('view-dashboard').classList.remove('active');
        document.getElementById('view-creator').classList.add('active');
    },
    closeCreator: function () {
        document.getElementById('view-creator').classList.remove('active');
        document.getElementById('view-dashboard').classList.add('active');
    },
    generateFacesInputs: function () {
        const qty = parseInt(document.getElementById('newDieFacesQty').value);
        const container = document.getElementById('faces-container');
        container.innerHTML = '';
        for (let i = 0; i < qty; i++) {
            const input = document.createElement('input');
            input.className = 'input-modern face-input';
            input.placeholder = i + 1; input.value = i + 1;
            container.appendChild(input);
        }
    },
    saveNewDie: function () {
        const name = document.getElementById('newDieName').value.trim();
        if (!name) return alert(this.t('alert_name'));
        const inputs = document.querySelectorAll('#faces-container .face-input');
        if (inputs.length < 2) return alert(this.t('alert_faces'));
        const faces = Array.from(inputs).map(i => i.value || i.placeholder);

        const newDie = { id: Date.now(), name: name, faces: faces };
        const list = JSON.parse(localStorage.getItem('minimalDice') || '[]');
        list.push(newDie);
        localStorage.setItem('minimalDice', JSON.stringify(list));
        this.renderSaved();
        this.closeCreator();
    },
    deleteDie: function (e, id) {
        e.stopPropagation();
        if (!confirm('Delete?')) return;
        let list = JSON.parse(localStorage.getItem('minimalDice') || '[]');
        list = list.filter(d => d.id !== id);
        localStorage.setItem('minimalDice', JSON.stringify(list));
        this.renderSaved();
    },
    renderSaved: function () {
        const grid = document.getElementById('saved-grid');
        const list = JSON.parse(localStorage.getItem('minimalDice') || '[]');
        grid.innerHTML = '';

        list.forEach(die => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => this.addToTray('custom', die.id);

            card.innerHTML = `
                <button class="card-del" onclick="app.deleteDie(event, ${die.id})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div class="card-icon">${ICONS.custom}</div>
                
                <div class="card-info">
                    <div class="card-title">${die.name}</div>
                    <div class="card-subtitle">${die.faces.length} faces</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
};

window.onload = () => app.init();