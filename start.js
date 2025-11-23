/* ======= SHORTCUTS ======= */
const $ = (s, r = document) => r.querySelector(s);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

/* ======= AUTO PERFORMANCE TUNING ======= */
const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
const smallScreen = Math.min(screen.width, screen.height) <= 390; // iPhone mini & co

/* ======= BACKDROP OPTIONAL IMAGE ======= */
(() => {
    const t = new Image();
    t.onload = () => document.body.classList.add('has-bg');
    t.src = 'img/bg.png';
})();
(() => {
    const img = $('#rulesImg'), block = $('#rulesBlock');
    if (!img || !block) return;
    on(img, 'error', () => block.classList.add('is-hidden'));
})();

/* ======= FX (pétales / neige / sable / feuilles) ======= */
const fx = (() => {
    const c = $('#fx');
    if (!c) return null;
    const ctx = c.getContext('2d');
    let w, h, ratio = window.devicePixelRatio || 1;
    let parts = [];
    let mode = 'printemps';
    const baseCount = isLowPower || smallScreen ? 55 : 100;

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        c.width = w * ratio;
        c.height = h * ratio;
        c.style.width = w + 'px';
        c.style.height = h + 'px';
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function make(n = baseCount) {
        parts.length = 0;
        for (let i = 0; i < n; i++) spawn(true);
    }

    function spawn(init = false) {
        const baseY = init ? Math.random() * h : -20;
        const p = {
            x: Math.random() * w,
            y: baseY,
            vx: -.4 + Math.random() * .8,
            vy: 1 + Math.random() * 1.5,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - .5) * .02,
            life: 0
        };
        if (mode === 'hiver') {
            p.sz = 3 + Math.random() * 4;
            p.type = 'snow';
            p.col = 'rgba(255,255,255,.9)';
            p.vy *= 0.7;
            p.vx *= 0.6;
        } else if (mode === 'printemps') {
            p.sz = 7 + Math.random() * 12;
            p.type = 'petal';
            p.col = `hsl(${310 + Math.random() * 20},80%,85%)`;
            p.vx *= 0.8;
            p.vy *= 0.9;
        } else if (mode === 'ete') {
            p.sz = 2 + Math.random() * 3;
            p.type = 'sand';
            p.col = 'rgba(255,230,150,.7)';
            p.vx *= 0.3;
            p.vy = 0.4 + Math.random() * 0.6;
        } else if (mode === 'automne') {
            p.sz = 9 + Math.random() * 16;
            p.type = 'leaf';
            p.h = 20 + Math.random() * 60;
            p.s = 70 + Math.random() * 20;
            p.l = 40 + Math.random() * 30;
            p.vx *= 0.6;
            p.vy *= 1.1;
        }
        parts.push(p);
    }

    function step() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.life += 1;
            if (p.y > h + 30 || p.x < -40 || p.x > w + 40) {
                parts[i] = parts[parts.length - 1];
                parts.pop();
                i--;
                spawn();
                continue;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            if (p.type === 'snow') drawSnow(p); else if (p.type === 'petal') drawPetal(p); else if (p.type === 'leaf') drawLeaf(p); else drawSand(p);
            ctx.restore();
        }
        requestAnimationFrame(step);
    }

    function drawSnow(p) {
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(0, 0, p.sz, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPetal(p) {
        ctx.fillStyle = p.col;
        const s = p.sz;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(s * 0.9, -s * 0.4, 0, -s);
        ctx.quadraticCurveTo(-s * 0.9, -s * 0.4, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(0, -s * 0.6, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawLeaf(p) {
        const s = p.sz;
        ctx.fillStyle = `hsl(${p.h}, ${p.s}%, ${p.l}%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(s * 0.8, -s * 0.6, 0, -s);
        ctx.quadraticCurveTo(-s * 0.8, -s * 0.6, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.fillRect(-s * 0.05, -s * 0.6, s * 0.1, s * 0.6);
        ctx.globalAlpha = 1;
    }

    function drawSand(p) {
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.sz * 0.5, -p.sz * 0.5, p.sz, p.sz);
    }

    function setMode(m) {
        mode = m;
        make(mode === 'ete' ? baseCount + 20 : (mode === 'hiver' ? baseCount - 5 : (mode === 'automne' ? baseCount - 10 : baseCount + 10)));
    }

    on(window, 'resize', resize);
    resize();
    make(baseCount);
    step();
    return {setMode};
})();

/* ======= AUDIO (fichiers + fallback rapide) ======= */
const audio = {ctx: null, enabled: true, nodes: {}, tag: null};
const soundFiles = { // ➜ place tes vrais .mp3 si tu veux
    printemps: ['assets/audio/oiseaux.mp3'],
    ete: ['assets/audio/vagues.mp3', 'assets/audio/cigales.mp3'],
    automne: ['assets/audio/vent.mp3', 'assets/audio/feuilles.mp3'],
    hiver: ['assets/audio/clochettes.mp3', 'assets/audio/ventfroid.mp3']
};

function ensureCtx() {
    if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
}

function stopAmb() {
    const n = audio.nodes;
    if (n.srcs) {
        n.srcs.forEach(a => {
            try {
                a.pause()
            } catch (e) {
            }
        });
    }
    if (n.master) {
        try {
            n.master.disconnect()
        } catch (e) {
        }
    }
    if (n.timer) {
        clearTimeout(n.timer);
    }
    audio.nodes = {};
}

function tryPlay(url, vol) {
    return new Promise((res) => {
        const a = new Audio(url);
        a.loop = true;
        a.volume = vol;
        a.addEventListener('canplaythrough', () => {
            a.play().then(() => res(a)).catch(() => res(null));
        }, {once: true});
        a.addEventListener('error', () => res(null), {once: true});
        setTimeout(() => res(null), 900); /* timeout fallback */
        a.load();
    });
}

async function playFiles(urls) {
    ensureCtx();
    stopAmb();
    const srcs = [];
    for (let i = 0; i < urls.length; i++) {
        const r = await tryPlay(urls[i], i === 0 ? 0.7 : 0.35);
        if (r) srcs.push(r);
    }
    if (srcs.length) {
        audio.nodes.srcs = srcs;
    } else {
        playFallbackNoise();
    }
}

function playFallbackNoise(freq = 900) {
    ensureCtx();
    const ac = audio.ctx;
    const n = ac.createBufferSource();
    const bf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = bf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1);
    }
    const flt = ac.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = 0.035;
    n.buffer = bf;
    n.loop = true;
    n.connect(flt).connect(g).connect(ac.destination);
    n.start();
    audio.nodes.src = n;
}

function setSeasonAudio(season) {
    if (!audio.enabled) return stopAmb();
    const urls = soundFiles[season];
    if (urls && urls.length) {
        playFiles(urls);
    } else {
        const map = {ete: 600, automne: 1000, printemps: 1200, hiver: 700};
        playFallbackNoise(map[season] || 900);
    }
}

function unlockAudio() {
    ensureCtx();
    ['touchstart', 'pointerdown', 'keydown'].forEach(ev => {
        window.addEventListener(ev, () => {
            if (audio.ctx && audio.ctx.state === 'suspended') {
                audio.ctx.resume();
            }
        }, {once: true});
    });
}

unlockAudio();

function beep() {
    if (!audio.enabled) return;
    try {
        ensureCtx();
        const o = audio.ctx.createOscillator();
        const g = audio.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 720;
        g.gain.setValueAtTime(0.001, audio.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, audio.ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.12);
        o.connect(g).connect(audio.ctx.destination);
        o.start();
        o.stop(audio.ctx.currentTime + 0.13);
    } catch (e) {
    }
}

$('#soundToggle').addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    $('#soundToggle').textContent = audio.enabled ? '🔊' : '🔇';
    $('#soundToggle').setAttribute('aria-pressed', audio.enabled ? 'true' : 'false');
    if (audio.enabled) {
        setSeasonAudio($('#seasonSel').value);
    } else {
        stopAmb();
    }
    beep();
});

/* ======= I18N ======= */
const i18n = {
    fr: {
        start: 'DÉPART', resume: 'REPRENDRE', next: 'Suivant →', back: '← Retour', launch: 'Lancer la partie ▶️',
        playersQ: 'Combien de joueurs ?', namesErr: 'Entre tous les pseudos pour continuer.',
        playersErr: 'Sélectionne un nombre de joueurs.', botQ: 'Ajouter un robot ?',
        tagline: 'Clique sur <strong>Départ</strong> puis choisis joueurs, pseudos et robot ♻️',
        rulesBrief: 'Règles en bref', close: 'Fermer', saved: 'Les paramètres sont mémorisés localement.',
        fullRules: '🔗 Règlement complet'
    },
    en: {
        start: 'START', resume: 'RESUME', next: 'Next →', back: '← Back', launch: 'Start game ▶️',
        playersQ: 'How many players?', namesErr: 'Enter all nicknames to continue.',
        playersErr: 'Select a player count.', botQ: 'Add a bot?',
        tagline: 'Click <strong>Start</strong>, then choose players, names and bot ♻️',
        rulesBrief: 'Rules at a glance', close: 'Close', saved: 'Settings are saved locally.',
        fullRules: '🔗 Full rules'
    },
    ru: {
        start: 'СТАРТ', resume: 'ПРОДОЛЖИТЬ', next: 'Далее →', back: '← Назад', launch: 'Начать игру ▶️',
        playersQ: 'Сколько игроков?', namesErr: 'Введите все ники, чтобы продолжить.',
        playersErr: 'Выберите число игроков.', botQ: 'Добавить робота?',
        tagline: 'Нажмите <strong>Старт</strong>, затем выберите игроков, имена и робота ♻️',
        rulesBrief: 'Правила вкратце', close: 'Закрыть', saved: 'Параметры сохраняются локально.',
        fullRules: '🔗 Полные правила'
    }
};

function setLang(lang) {
    const t = i18n[lang] || i18n.fr;
    $('#btnStart').textContent = '▶️ ' + t.start;
    $('#toStep2').textContent = t.next;
    $('#toStep3').textContent = t.next;
    $('#back1').textContent = t.back;
    $('#back2').textContent = t.back;
    $('#launch').textContent = t.launch;
    $('#lblPlayers').textContent = t.playersQ;
    $('#errNames').textContent = t.namesErr;
    $('#errPlayers').textContent = t.playersErr;
    $('#lblBot').textContent = t.botQ;
    $('#tagline').innerHTML = t.tagline;
    $('#modalTitle').textContent = t.rulesBrief;
    $('#modalClose').textContent = t.close;
    $('#saveNote').textContent = t.saved;
    $('#fullRulesLink').textContent = t.fullRules;
}

/* ======= STATE / PREFS ======= */
const SAVE_KEY = 'eco_save_v7';

function detectSeasonByMonth(m) {
    if (m <= 1 || m === 11) return 'hiver';
    if (m >= 2 && m <= 4) return 'printemps';
    if (m >= 5 && m <= 7) return 'ete';
    return 'automne';
}

(() => {
    const langSel = $('#langSel'), seasonSel = $('#seasonSel');
    const storedLang = localStorage.getItem('eco_lang') || navigator.language.slice(0, 2);
    const lang = ['fr', 'en', 'ru'].includes(storedLang) ? storedLang : 'fr';
    langSel.value = lang;
    setLang(lang);
    on(langSel, 'change', () => {
        localStorage.setItem('eco_lang', langSel.value);
        setLang(langSel.value);
        beep();
    });
    let season = localStorage.getItem('eco_season') || 'printemps';
    seasonSel.value = season;
    document.body.setAttribute('data-season', season);
    fx && fx.setMode(season);
    setSeasonAudio(season);
    on(seasonSel, 'change', () => {
        const s = seasonSel.value;
        localStorage.setItem('eco_season', s);
        document.body.setAttribute('data-season', s);
        fx && fx.setMode(s);
        setSeasonAudio(s);
        document.querySelector('.bg-grad').style.opacity = '0.95';
        setTimeout(() => document.querySelector('.bg-grad').style.opacity = '0.9', 350);
        beep();
    });
})();

/* ======= RÈGLES ======= */
const FULL_RULES_URL = ""; // ex: "https://alexandre293.github.io/Eco-jeux/reglement"
if (FULL_RULES_URL) {
    const L = $('#fullRulesLink');
    L.style.display = 'inline-flex';
    L.href = FULL_RULES_URL;
}
on($('#btnRulesQuick'), 'click', () => {
    if (FULL_RULES_URL) {
        window.open(FULL_RULES_URL, '_blank', 'noopener');
    } else {
        $('#modal').classList.add('open');
    }
});

/* ======= WIZARD LOGIC ======= */
const stepper = $('#stepper'), progress = $('#progress'), bar = $('#bar');
const screens = [...document.querySelectorAll('.screen')];
const dots = [$('#d1'), $('#d2'), $('#d3')];

function goStep(n) {
    screens.forEach(s => s.classList.remove('active'));
    const target = screens[n - 1];
    if (!target) return;
    target.classList.add('active');
    dots.forEach((d, i) => d.classList.toggle('on', i < n));
    bar.style.width = (n - 1) * 50 + '%';
}

function renderPlayerInputs(count) {
    const box = $('#playersBox');
    box.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = 'player-row';
        const lab = document.createElement('label');
        lab.htmlFor = 'pseudo' + i;
        lab.textContent = `Pseudo joueur ${i} :`;
        const input = document.createElement('input');
        input.className = 'in';
        input.type = 'text';
        input.id = 'pseudo' + i;
        input.placeholder = `Nom du joueur ${i}`;
        input.required = true;
        input.addEventListener('input', () => {
            const val = input.value.trim();
            $('#logoWord').textContent = val ? `Bienvenue ${val} !` : 'ÉCO‑CHALLENGE';
        });
        row.appendChild(lab);
        row.appendChild(input);
        box.appendChild(row);
    }
    try {
        const save = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        if (save?.names) {
            save.names.slice(0, count).forEach((v, idx) => {
                const el = $('#pseudo' + (idx + 1));
                if (el) el.value = v;
            });
        }
    } catch (e) {
    }
}

on($('#btnStart'), 'click', () => {
    $('#btnStart').style.display = 'none';
    $('#wizard').style.display = 'block';
    stepper.style.display = 'flex';
    progress.style.display = 'block';
    goStep(1);
    beep();
});

on($('#toStep2'), 'click', () => {
    const players = parseInt($('#players').value, 10);
    if (!players || players < 1 || players > 4) {
        $('#errPlayers').classList.add('show');
        return;
    }
    $('#errPlayers').classList.remove('show');
    renderPlayerInputs(players);
    goStep(2);
    beep();
});

on($('#back1'), 'click', () => {
    goStep(1);
    beep();
});

on($('#toStep3'), 'click', () => {
    const players = parseInt($('#players').value, 10);
    let ok = true, names = [];
    for (let i = 1; i <= players; i++) {
        const v = ($('#pseudo' + i) || {}).value || '';
        if (!v.trim()) {
            ok = false;
            break;
        }
        names.push(v.trim());
    }
    if (!ok) {
        $('#errNames').classList.add('show');
        return;
    }
    $('#errNames').classList.remove('show');
    goStep(3);
    beep();
});

on($('#back2'), 'click', () => {
    goStep(2);
    beep();
});

on($('#launch'), 'click', () => {
    const n = parseInt($('#players').value, 10);
    const names = [];
    for (let i = 1; i <= n; i++) {
        names.push(($('#pseudo' + i) || {}).value.trim());
    }
    const bot = $('#bot').value || 'none';

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            version: 7,
            players: n,
            names,
            bot,
            ts: Date.now()
        }));
    } catch (e) {}

    confetti();
    beep();

    setTimeout(() => {
        alert(`OK ! ${n} joueur(s) • ${names.join(', ')} • bot: ${bot}`);
        // Redirection vers la page principale du jeu
        window.location.href = "index.html";
    }, 350);
});


/* ======= MODAL close ======= */
on($('#modalClose'), 'click', () => {
    $('#modal').classList.remove('open');
});

/* ======= CONFETTI ======= */
function confetti() {
    const c = $('#fx');
    if (!c) return;
    const ctx = c.getContext('2d');
    const pieces = [];
    const W = c.width = window.innerWidth * (window.devicePixelRatio || 1),
        H = c.height = window.innerHeight * (window.devicePixelRatio || 1);
    const N = 120;
    for (let i = 0; i < N; i++) {
        pieces.push({
            x: Math.random() * W,
            y: -Math.random() * H * 0.2,
            vx: (Math.random() - .5) * 4,
            vy: 2 + Math.random() * 3,
            sz: 6 + Math.random() * 10,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - .5) * .2,
            col: `hsl(${120 + Math.random() * 120},85%,64%)`
        });
    }
    const start = performance.now();

    function tick(t) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.save();
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            ctx.save();
            ctx.translate(p.x / (window.devicePixelRatio || 1), p.y / (window.devicePixelRatio || 1));
            ctx.rotate(p.rot);
            ctx.fillStyle = p.col;
            ctx.fillRect(-p.sz * .5, -p.sz * .2, p.sz, p.sz * .4);
            ctx.restore();
        });
        ctx.restore();
        if (t - start < 820) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}
