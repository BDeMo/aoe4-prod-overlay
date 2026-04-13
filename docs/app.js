/**
 * AoE4 Production Calculator - Web Version
 */
const IS_WEB = document.body.classList.contains('web-mode');

// ---- Building Source Icons (inline SVG) ----
const SOURCE_ICONS = {
    tc:         '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1L1 6v1h2v7h10V7h2V6L8 1z" fill="currentColor"/></svg>',
    mill:       '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1l-1 3-3-1 1 3-3 1 3 1-1 3 3-1 1 3 1-3 3 1-1-3 3-1-3-1 1-3-3 1-1-3z" fill="currentColor"/><rect x="6" y="10" width="4" height="5" fill="currentColor"/></svg>',
    lumber:     '<svg viewBox="0 0 16 16" width="12" height="12"><rect x="2" y="4" width="12" height="3" rx="1" fill="currentColor"/><rect x="2" y="9" width="12" height="3" rx="1" fill="currentColor"/><rect x="6" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.5"/></svg>',
    mining:     '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 13l5-11 5 11H3z" fill="currentColor" opacity="0.7"/><path d="M6 8l2-4 2 4H6z" fill="currentColor"/></svg>',
    blacksmith: '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M4 2v5l4 4 4-4V2H4z" fill="currentColor" opacity="0.6"/><rect x="7" y="9" width="2" height="5" fill="currentColor"/><rect x="5" y="13" width="6" height="2" rx="1" fill="currentColor"/></svg>',
};

const SOURCE_NAMES = {
    tc: 'Town Center',
    mill: 'Mill',
    lumber: 'Lumber Camp',
    mining: 'Mining Camp',
    blacksmith: 'Blacksmith',
};

// ---- State ----
let currentCiv = 'ENGLAND';
let selectedUnits = {}; // { unitId: count }
let foodSource = 'FARM';
let activeGatheringMods = [];
let activeProductionSpeedMods = [];
let activeCostMods = [];
let passiveIncomeSources = {}; // { sourceId: count }

// ---- Services ----
const gatheringRatesService = new GatheringRatesService();
const passiveIncomeService = new PassiveIncomeService();
const limitedFoodService = new LimitedFoodGatheringSourceService(gatheringRatesService);
const calculator = new ProductionCalculatorService(limitedFoodService, passiveIncomeService);

let compactMode = false;

// ---- Hotkey Configuration ----
const DEFAULT_HOTKEYS = {
    toggleCompact: { ctrl: true, shift: false, alt: false, key: 'm', label: 'Compact Mode' },
    toggleHide:    { ctrl: true, shift: false, alt: false, key: 'h', label: 'Hide/Show' },
    toggleOpponent:{ ctrl: true, shift: false, alt: false, key: 'o', label: 'Opponent Panel' }
};

const HOTKEY_ACTIONS = {
    toggleCompact: () => toggleCompactMode(),
    toggleHide:    () => minimizePanel(),
    toggleOpponent:() => toggleOpponentPanel()
};

function loadHotkeys() {
    try {
        const saved = localStorage.getItem('aoe4_hotkeys');
        if (saved) return { ...DEFAULT_HOTKEYS, ...JSON.parse(saved) };
    } catch(e) {}
    return { ...DEFAULT_HOTKEYS };
}

function saveHotkeys(hotkeys) {
    localStorage.setItem('aoe4_hotkeys', JSON.stringify(hotkeys));
}

let hotkeys = loadHotkeys();

// ---- Favorite (starred) modifiers ----
function loadFavorites() {
    try {
        const saved = localStorage.getItem('aoe4_favorites');
        if (saved) return new Set(JSON.parse(saved));
    } catch(e) {}
    return new Set();
}

function saveFavorites() {
    localStorage.setItem('aoe4_favorites', JSON.stringify([...favorites]));
}

let favorites = loadFavorites();

function toggleFavorite(modId) {
    if (favorites.has(modId)) {
        favorites.delete(modId);
    } else {
        favorites.add(modId);
    }
    saveFavorites();
    renderModifierToggles();
}

function hotkeyToString(hk) {
    let parts = [];
    if (hk.ctrl) parts.push('Ctrl');
    if (hk.shift) parts.push('Shift');
    if (hk.alt) parts.push('Alt');
    parts.push(hk.key.toUpperCase());
    return parts.join('+');
}

function matchesHotkey(e, hk) {
    return e.ctrlKey === !!hk.ctrl
        && e.shiftKey === !!hk.shift
        && e.altKey === !!hk.alt
        && e.key.toLowerCase() === hk.key.toLowerCase();
}

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
    initCivSelector();
    onCivChange(currentCiv);
    if (!IS_WEB) {
        initKeyboardShortcuts();
        renderHotkeySettings();
    }
    // Restore opponent panel state
    if (localStorage.getItem('aoe4_show_opponent') === 'true') {
        document.getElementById('opponent-section').style.display = '';
        const cb = document.getElementById('toggle-opponent-panel');
        if (cb) cb.checked = true;
    }
    // Restore saved player name
    const savedName = loadSavedPlayerName();
    const nameInput = document.getElementById('player-name-input');
    if (nameInput && savedName) {
        nameInput.value = savedName;
        searchPlayer(savedName);
    }
});

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        for (const [actionId, hk] of Object.entries(hotkeys)) {
            if (matchesHotkey(e, hk) && HOTKEY_ACTIONS[actionId]) {
                e.preventDefault();
                HOTKEY_ACTIONS[actionId]();
                return;
            }
        }
    });
}

function initCivSelector() {
    const select = document.getElementById('civ-selector');
    Object.entries(CIVILIZATIONS).forEach(([key, name]) => {
        if (key === 'RANDOM') return;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name;
        if (key === currentCiv) opt.selected = true;
        select.appendChild(opt);
    });
}

// ---- Event Handlers ----
function onCivChange(civ) {
    currentCiv = civ;
    selectedUnits = {};
    passiveIncomeSources = {};
    loadCivModifiers();
    renderUnitGrid();
    renderSelectedUnits();
    renderPassiveIncomeSources();
    recalculate();
}

function onFoodSourceChange(source) {
    foodSource = source;
    recalculate();
}

function toggleSettings() {
    // Legacy, kept for compatibility
    toggleSettingsDropdown();
}

function toggleSettingsDropdown() {
    const dropdown = document.getElementById('settings-dropdown');
    dropdown.classList.toggle('open');
}

function toggleCompactMode() { /* web: no-op */ }
function minimizePanel() { /* web: no-op */ }
function closePanel() { /* web: no-op */ }

function resetAllSettings() {
    if (!confirm('Reset all settings to defaults? This clears hotkeys, modifiers, bookmarks, and food source.')) return;
    resetHotkeys();
    resetModifiers();
    favorites.clear();
    saveFavorites();
}

function resetHotkeys() {
    localStorage.removeItem('aoe4_hotkeys');
    hotkeys = { ...DEFAULT_HOTKEYS };
    renderHotkeySettings();
}

function resetModifiers() {
    document.getElementById('food-source').value = 'FARM';
    foodSource = 'FARM';
    loadCivModifiers();
    recalculate();
}

function clearOpponentData() {
    stopPlayerRefresh();
    localStorage.removeItem('aoe4_player_name');
    localStorage.removeItem('aoe4_player_profile_id');
    document.getElementById('opponent-players').innerHTML = '';
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) nameInput.value = '';
}

function notifyPyQt() { /* web: no-op */ }

// ---- Modifier Management ----
function loadCivModifiers() {
    const mods = getCivModifiers(currentCiv);

    // Set default gathering rate modifiers
    activeGatheringMods = [];
    (mods.defaults.gatheringRate || []).forEach(id => {
        if (mods.gatheringRate[id]) activeGatheringMods.push(mods.gatheringRate[id]);
    });

    // Set default production speed modifiers
    activeProductionSpeedMods = [];
    (mods.defaults.productionSpeed || []).forEach(id => {
        if (mods.productionSpeed[id]) activeProductionSpeedMods.push(mods.productionSpeed[id]);
    });

    // Set default cost modifiers
    activeCostMods = [];
    (mods.defaults.costModifiers || []).forEach(id => {
        if (mods.costModifiers[id]) activeCostMods.push(mods.costModifiers[id]);
    });

    renderModifierToggles();
}

function renderModifierToggles() {
    const mods = getCivModifiers(currentCiv);
    const civName = CIVILIZATIONS[currentCiv] || currentCiv;

    // Common group — all universal modifiers
    const commonContainer = document.getElementById('common-modifiers-group');
    commonContainer.innerHTML = '';

    const commonGrMods = Object.values(COMMON_GATHERING_RATE_MODIFIERS);
    const commonPsMods = Object.values(COMMON_PRODUCTION_SPEED_MODIFIERS);
    const hasCommon = commonGrMods.length > 0 || commonPsMods.length > 0;

    if (hasCommon) {
        const label = document.createElement('div');
        label.className = 'modifier-group-label';
        label.textContent = 'Common';
        commonContainer.appendChild(label);
        commonGrMods.forEach(mod => {
            commonContainer.appendChild(createModifierToggle(mod, 'gathering', false));
        });
        commonPsMods.forEach(mod => {
            commonContainer.appendChild(createModifierToggle(mod, 'speed', false));
        });
    }

    // Civ group — all civ-specific modifiers
    const civContainer = document.getElementById('civ-modifiers-group');
    civContainer.innerHTML = '';

    const civGrMods = Object.values(mods.gatheringRate);
    const civPsMods = Object.values(mods.productionSpeed);
    const civCostMods = Object.values(mods.costModifiers);
    const hasCiv = civGrMods.length > 0 || civPsMods.length > 0 || civCostMods.length > 0;

    if (hasCiv) {
        const label = document.createElement('div');
        label.className = 'modifier-group-label';
        label.textContent = civName;
        civContainer.appendChild(label);
        civGrMods.forEach(mod => {
            const isDefault = (mods.defaults.gatheringRate || []).includes(mod.id);
            civContainer.appendChild(createModifierToggle(mod, 'gathering', isDefault));
        });
        civPsMods.forEach(mod => {
            const isDefault = (mods.defaults.productionSpeed || []).includes(mod.id);
            civContainer.appendChild(createModifierToggle(mod, 'speed', isDefault));
        });
        civCostMods.forEach(mod => {
            const isDefault = (mods.defaults.costModifiers || []).includes(mod.id);
            civContainer.appendChild(createModifierToggle(mod, 'cost', isDefault));
        });
    }
}

function createModifierToggle(mod, type, defaultChecked) {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = defaultChecked;
    checkbox.addEventListener('change', () => {
        updateActiveModifiers();
        recalculate();
    });
    checkbox.dataset.modId = mod.id;
    checkbox.dataset.modType = type;

    label.appendChild(checkbox);

    const star = document.createElement('span');
    star.className = 'popular-star' + (favorites.has(mod.id) ? ' active' : '');
    star.textContent = favorites.has(mod.id) ? '\u2605' : '\u2606';
    star.title = 'Click to bookmark';
    star.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(mod.id); };
    label.appendChild(star);

    label.appendChild(document.createTextNode(' ' + mod.description));
    if (mod.source) {
        const tag = document.createElement('span');
        tag.className = 'modifier-source-tag';
        tag.innerHTML = SOURCE_ICONS[mod.source] || mod.source;
        tag.title = SOURCE_NAMES[mod.source] || mod.source;
        label.appendChild(tag);
    }
    if (mod.age) {
        const ageTag = document.createElement('span');
        ageTag.className = 'modifier-age-tag age-' + mod.age;
        ageTag.textContent = mod.age;
        label.appendChild(ageTag);
    }
    row.appendChild(label);
    return row;
}

function updateActiveModifiers() {
    const mods = getCivModifiers(currentCiv);
    activeGatheringMods = [];
    activeProductionSpeedMods = [];
    activeCostMods = [];

    document.querySelectorAll('input[data-mod-type="gathering"]:checked').forEach(cb => {
        const mod = COMMON_GATHERING_RATE_MODIFIERS[cb.dataset.modId] || mods.gatheringRate[cb.dataset.modId];
        if (mod) activeGatheringMods.push(mod);
    });

    document.querySelectorAll('input[data-mod-type="speed"]:checked').forEach(cb => {
        const mod = COMMON_PRODUCTION_SPEED_MODIFIERS[cb.dataset.modId] || mods.productionSpeed[cb.dataset.modId];
        if (mod) activeProductionSpeedMods.push(mod);
    });

    document.querySelectorAll('input[data-mod-type="cost"]:checked').forEach(cb => {
        const mod = COMMON_COST_MODIFIERS[cb.dataset.modId] || mods.costModifiers[cb.dataset.modId];
        if (mod) activeCostMods.push(mod);
    });
}

// ---- Unit Grid ----
function renderUnitGrid() {
    const grid = document.getElementById('unit-grid');
    grid.innerHTML = '';

    const civUnits = UNITS_LIST.filter(u =>
        u.civilizations.includes(currentCiv)
    );

    civUnits.forEach(unit => {
        const el = document.createElement('div');
        el.className = 'unit-icon' + (selectedUnits[unit.id] ? ' selected' : '');
        el.title = `${unit.name}\nF:${unit.cost.food} G:${unit.cost.gold} W:${unit.cost.wood} S:${unit.cost.stone}\nTime: ${unit.productionTime}s`;
        el.onclick = () => addUnit(unit.id);

        const iconPath = getUnitIcon(unit.id);
        if (iconPath) {
            const img = document.createElement('img');
            img.src = iconPath;
            img.alt = unit.name;
            img.className = 'unit-img';
            img.onerror = () => {
                img.style.display = 'none';
                const abbrev = document.createElement('span');
                abbrev.className = 'abbrev';
                abbrev.textContent = getAbbrev(unit.name);
                el.appendChild(abbrev);
            };
            el.appendChild(img);
        } else {
            const abbrev = document.createElement('span');
            abbrev.className = 'abbrev';
            abbrev.textContent = getAbbrev(unit.name);
            el.appendChild(abbrev);
        }

        grid.appendChild(el);
    });
}

function getAbbrev(name) {
    const words = name.split(/[\s-]+/);
    if (words.length === 1) {
        return name.substring(0, 3).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().substring(0, 3);
}

function addUnit(unitId) {
    if (!selectedUnits[unitId]) {
        selectedUnits[unitId] = 1;
    } else {
        selectedUnits[unitId]++;
    }
    renderUnitGrid();
    renderSelectedUnits();
    recalculate();
}

function removeUnit(unitId) {
    delete selectedUnits[unitId];
    renderUnitGrid();
    renderSelectedUnits();
    recalculate();
}

function clearQueue() {
    selectedUnits = {};
    renderUnitGrid();
    renderSelectedUnits();
    recalculate();
}

function changeUnitCount(unitId, delta) {
    selectedUnits[unitId] = Math.max(0, (selectedUnits[unitId] || 0) + delta);
    if (selectedUnits[unitId] <= 0) {
        delete selectedUnits[unitId];
    }
    renderUnitGrid();
    renderSelectedUnits();
    recalculate();
}

// ---- Selected Units Display ----
function renderSelectedUnits() {
    const container = document.getElementById('selected-units');
    const ids = Object.keys(selectedUnits);

    if (ids.length === 0) {
        container.innerHTML = '<div class="empty-state">Click units above to add them</div>';
        return;
    }

    container.innerHTML = '';
    ids.forEach(unitId => {
        const unit = UNITS[unitId];
        if (!unit) return;
        const count = selectedUnits[unitId];

        const row = document.createElement('div');
        row.className = 'selected-unit';

        const iconPath = getUnitIcon(unitId);
        const iconHtml = iconPath
            ? `<img src="${iconPath}" class="unit-list-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="${unit.name}"><div class="unit-abbrev" style="display:none">${getAbbrev(unit.name)}</div>`
            : `<div class="unit-abbrev">${getAbbrev(unit.name)}</div>`;

        row.innerHTML = `
            ${iconHtml}
            <span class="unit-name">${unit.name}</span>
            <div class="counter-controls">
                <button onclick="changeUnitCount('${unitId}', -1)">-</button>
                <span class="count">${count}</span>
                <button onclick="changeUnitCount('${unitId}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeUnit('${unitId}')" title="Remove">&times;</button>
        `;

        container.appendChild(row);
    });
}

// ---- Hotkey Settings UI ----
function renderHotkeySettings() {
    const container = document.getElementById('hotkey-settings');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(hotkeys).forEach(([actionId, hk]) => {
        const row = document.createElement('div');
        row.className = 'setting-row hotkey-row';

        const label = document.createElement('span');
        label.className = 'hotkey-label';
        label.textContent = hk.label + ':';

        const btn = document.createElement('button');
        btn.className = 'hotkey-btn';
        btn.textContent = hotkeyToString(hk);
        btn.title = 'Click to rebind';
        btn.onclick = () => startHotkeyCapture(actionId, btn);

        row.appendChild(label);
        row.appendChild(btn);
        container.appendChild(row);
    });
}

function startHotkeyCapture(actionId, btn) {
    btn.textContent = '...press key...';
    btn.classList.add('capturing');

    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Ignore standalone modifier keys
        if (['Control','Shift','Alt','Meta'].includes(e.key)) return;

        hotkeys[actionId] = {
            ...hotkeys[actionId],
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            key: e.key.toLowerCase()
        };
        saveHotkeys(hotkeys);
        btn.textContent = hotkeyToString(hotkeys[actionId]);
        btn.classList.remove('capturing');
        document.removeEventListener('keydown', handler, true);
    };
    document.addEventListener('keydown', handler, true);
}

// ---- Opponent Panel (aoe4world.com API) ----
const AOE4_API = 'https://aoe4world.com/api/v0';
let _playerRefreshTimer = null;
const PLAYER_REFRESH_INTERVAL = 60000; // 60 seconds

function toggleOpponentPanel() {
    const section = document.getElementById('opponent-section');
    const visible = section.style.display !== 'none';
    section.style.display = visible ? 'none' : '';
    localStorage.setItem('aoe4_show_opponent', !visible);
    const cb = document.getElementById('toggle-opponent-panel');
    if (cb) cb.checked = !visible;
}

function loadSavedPlayerName() {
    return localStorage.getItem('aoe4_player_name') || '';
}

function onPlayerNameSubmit() {
    const input = document.getElementById('player-name-input');
    const name = input.value.trim();
    if (!name) return;
    localStorage.setItem('aoe4_player_name', name);
    searchPlayer(name);
}

function startPlayerRefresh(name) {
    stopPlayerRefresh();
    _playerRefreshTimer = setInterval(() => {
        searchPlayer(name, true);
    }, PLAYER_REFRESH_INTERVAL);
}

function stopPlayerRefresh() {
    if (_playerRefreshTimer) {
        clearInterval(_playerRefreshTimer);
        _playerRefreshTimer = null;
    }
}

async function searchPlayer(name, silent) {
    const container = document.getElementById('opponent-players');
    if (!silent) container.innerHTML = '<div class="empty-state">Searching...</div>';

    try {
        const res = await fetch(`${AOE4_API}/players/search?query=${encodeURIComponent(name)}&limit=1`);
        const data = await res.json();
        if (!data.players || data.players.length === 0) {
            if (!silent) container.innerHTML = '<div class="empty-state">Player not found</div>';
            return;
        }
        const player = data.players[0];
        localStorage.setItem('aoe4_player_profile_id', player.profile_id);
        renderPlayerProfile(player);
        fetchLastGame(player.profile_id);
        // Start auto-refresh
        startPlayerRefresh(name);
    } catch(e) {
        if (!silent) container.innerHTML = `<div class="empty-state">API error: ${e.message}</div>`;
    }
}

function renderPlayerProfile(player) {
    const container = document.getElementById('opponent-players');
    const lb = player.leaderboards || {};
    // Find best rated mode
    const modes = ['rm_solo', 'rm_1v1_elo', 'qm_1v1', 'rm_team'];
    let best = null;
    for (const m of modes) {
        if (lb[m] && lb[m].rating) { best = lb[m]; break; }
    }

    container.innerHTML = '';
    const profileDiv = document.createElement('div');
    profileDiv.className = 'opponent-player';

    const rating = best ? best.rating : '?';
    const wr = best ? best.win_rate : 0;
    const winRate = best ? (wr > 1 ? wr.toFixed(1) : (wr * 100).toFixed(1)) + '%' : '';
    const wins = best ? best.wins_count : '';
    const losses = best ? best.losses_count : '';
    const rank = best ? `#${best.rank}` : '';

    profileDiv.innerHTML = `
        <span class="opponent-name">${player.name}</span>
        <span class="opponent-rank">${rank}</span>
        <span class="opponent-rating">${rating}</span>
        <span class="opponent-winrate">${winRate}</span>
        <span class="opponent-record"><span class="wins">${wins}W</span> <span class="losses">${losses}L</span></span>
    `;
    container.appendChild(profileDiv);
}

async function fetchLastGame(profileId) {
    try {
        const res = await fetch(`${AOE4_API}/players/${profileId}/games?limit=1`);
        const data = await res.json();
        if (!data.games || data.games.length === 0) return;
        const game = data.games[0];
        // Collect all player profile IDs from the game to fetch their stats
        const allPlayerIds = [];
        if (game.teams) {
            game.teams.forEach(team => {
                team.forEach(entry => {
                    const p = entry.player || entry;
                    if (p.profile_id) allPlayerIds.push(p.profile_id);
                });
            });
        }
        // Fetch stats for all players in parallel
        const playerStats = {};
        await Promise.all(allPlayerIds.map(async (pid) => {
            try {
                const r = await fetch(`${AOE4_API}/players/${pid}`);
                const pData = await r.json();
                playerStats[pid] = pData;
            } catch(e) {}
        }));
        renderLastGame(game, profileId, playerStats);
    } catch(e) {}
}

function getPlayerBestLeaderboard(playerData) {
    // Search endpoint uses 'leaderboards', individual player endpoint uses 'modes'
    const lb = playerData.leaderboards || playerData.modes || {};
    const modeKeys = ['rm_1v1_elo', 'rm_solo', 'qm_1v1', 'rm_team'];
    for (const m of modeKeys) {
        if (lb[m] && lb[m].rating) return lb[m];
        // Check previous seasons if current has no rating
        if (lb[m] && lb[m].previous_seasons) {
            for (const ps of lb[m].previous_seasons) {
                if (ps.rating) return ps;
            }
        }
    }
    return null;
}

function renderLastGame(game, myProfileId, playerStats) {
    const container = document.getElementById('opponent-players');

    const mapDiv = document.createElement('div');
    mapDiv.className = 'opponent-map';
    mapDiv.textContent = `Last: ${game.map || 'Unknown map'}`;
    container.appendChild(mapDiv);

    if (!game.teams) return;
    game.teams.forEach((team) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'opponent-team';
        team.forEach(entry => {
            const p = entry.player || entry;
            const isMe = p.profile_id == myProfileId;
            const row = document.createElement('div');
            row.className = 'opponent-player' + (isMe ? ' is-me' : '');
            // Map civ name to flag key
            const civLower = (p.civilization || '').toLowerCase().replace(/\s+/g, '_');
            const civKey = Object.keys(CIVILIZATIONS).find(k =>
                k.toLowerCase() === civLower ||
                CIVILIZATIONS[k].toLowerCase().replace(/['\s]+/g, '_') === civLower
            );
            const flagSrc = civKey ? CIV_FLAGS[civKey] : '';
            const rating = p.mmr || p.rating || '';
            const result = p.result === 'win' ? 'W' : p.result === 'loss' ? 'L' : '';
            const score = p.score != null ? p.score : '';

            // Get win rate, wins, losses from fetched player stats
            const stats = playerStats[p.profile_id];
            let wrHtml = '';
            if (stats) {
                const best = getPlayerBestLeaderboard(stats);
                if (best) {
                    const wr = best.win_rate;
                    const wrStr = wr > 1 ? wr.toFixed(1) : (wr * 100).toFixed(1);
                    wrHtml = `<span class="opponent-winrate">${wrStr}%</span>` +
                             `<span class="opponent-record"><span class="wins">${best.wins_count}W</span> <span class="losses">${best.losses_count}L</span></span>`;
                }
            }

            row.innerHTML = `
                ${flagSrc ? `<img src="${flagSrc}" class="opponent-flag">` : ''}
                <span class="opponent-name">${p.name || ''}</span>
                <span class="opponent-rating">${rating}</span>
                ${wrHtml}
                ${score !== '' ? `<span class="opponent-score">${score}</span>` : ''}
                <span class="opponent-result ${p.result || ''}">${result}</span>
            `;
            teamDiv.appendChild(row);
        });
        container.appendChild(teamDiv);
    });
}

// ---- Passive Income Sources ----
function renderPassiveIncomeSources() {
    const sources = getCivPassiveIncomeSources(currentCiv);
    const section = document.getElementById('passive-income-section');
    const container = document.getElementById('passive-income-sources');
    container.innerHTML = '';

    if (sources.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    sources.forEach(src => {
        const row = document.createElement('div');
        row.className = 'selected-unit';
        const count = passiveIncomeSources[src.id] || 0;
        row.innerHTML = `
            <span class="unit-name">${src.label}</span>
            <div class="counter-controls">
                <button onclick="changePassiveIncomeCount('${src.id}', -1)">-</button>
                <span class="count">${count}</span>
                <button onclick="changePassiveIncomeCount('${src.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function changePassiveIncomeCount(sourceId, delta) {
    passiveIncomeSources[sourceId] = Math.max(0, (passiveIncomeSources[sourceId] || 0) + delta);
    renderPassiveIncomeSources();
    recalculate();
}

function getPassiveIncome() {
    let total = new ResourcesAmount();
    const sources = getCivPassiveIncomeSources(currentCiv);
    sources.forEach(src => {
        const count = passiveIncomeSources[src.id] || 0;
        if (count <= 0) return;
        src.modifiers.forEach(modId => {
            const mod = ALL_PASSIVE_INCOME_MODIFIERS[modId];
            if (!mod) return;
            total = total.add(ResourcesAmount.of(mod.food * count, mod.wood * count, mod.gold * count, mod.stone * count));
        });
    });
    return total;
}

// ---- Calculation ----
function recalculate() {
    if (Object.keys(selectedUnits).length === 0) {
        updateDisplay({ foodVillagers: 0, woodVillagers: 0, goldVillagers: 0, stoneVillagers: 0 });
        return;
    }

    // Get effective gathering rates
    const gatheringRates = gatheringRatesService.getGatheringRates(
        foodSource, activeGatheringMods, []
    );

    // Calculate passive income from civ-specific sources
    const passiveIncome = getPassiveIncome();

    // Calculate
    const result = calculator.calculateProductionVillagerCost(
        gatheringRates,
        selectedUnits,
        activeProductionSpeedMods,
        activeCostMods,
        passiveIncome,
        new ResourcesAmount(), // dynamic passive income
        [], // limited food sources
        [], // passive income from gathering villagers
        foodSource,
        0, // min food villagers
        {} // cost modifiers per unit
    );

    updateDisplay(result);
}

function updateDisplay(result) {
    const f = Math.max(0, result.foodVillagers);
    const w = Math.max(0, result.woodVillagers);
    const g = Math.max(0, result.goldVillagers);
    const s = Math.max(0, result.stoneVillagers);
    const total = f + w + g + s;
    const maxVal = Math.max(f, w, g, s, 1);

    document.getElementById('val-food').textContent = f.toFixed(1);
    document.getElementById('val-wood').textContent = w.toFixed(1);
    document.getElementById('val-gold').textContent = g.toFixed(1);
    document.getElementById('val-stone').textContent = s.toFixed(1);
    document.getElementById('val-total').textContent = total.toFixed(1);

    document.getElementById('bar-food').style.width = (f / maxVal * 100) + '%';
    document.getElementById('bar-wood').style.width = (w / maxVal * 100) + '%';
    document.getElementById('bar-gold').style.width = (g / maxVal * 100) + '%';
    document.getElementById('bar-stone').style.width = (s / maxVal * 100) + '%';
}
