/**
 * AoE4 Production Overlay - UI Application Logic
 */
const IS_WEB = true;

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
    initKeyboardShortcuts();
    renderHotkeySettings();
    // Restore opponent panel state
    if (localStorage.getItem('aoe4_show_opponent') === 'true') {
        document.getElementById('opponent-section').style.display = '';
        const cb = document.getElementById('toggle-opponent-panel');
        if (cb) cb.checked = true;
    }
    // Restore toggle states
    const autoDetectCb = document.getElementById('toggle-auto-detect');
    if (autoDetectCb) autoDetectCb.checked = _autoDetectEnabled;
    const ocrCb = document.getElementById('toggle-ocr');
    if (ocrCb) ocrCb.checked = _ocrEnabled;
    const passiveAutoCb = document.getElementById('toggle-passive-auto');
    if (passiveAutoCb) passiveAutoCb.checked = _passiveAutoEnabled;


    // Restore saved player name
    const savedName = loadSavedPlayerName();
    const nameInput = document.getElementById('player-name-input');
    if (nameInput && savedName) {
        nameInput.value = savedName;
        searchPlayer(savedName);
    }

    // Title bar drag to move window
    initTitleBarDrag();
});

// ---- Font scaling based on window width ----
const BASE_WIDTH = 340;
const BASE_FONT = 12;
const MIN_FONT = 9;
const MAX_FONT = 18;

function onWindowResize(w, h) {
    const scale = w / BASE_WIDTH;
    const clampedScale = Math.min(1.6, Math.max(0.7, scale));
    document.getElementById('overlay-panel').style.zoom = clampedScale;
}

// ---- Title Bar Drag (window move) + Edge Resize ----
const RESIZE_MARGIN = 8; // px from edge to trigger resize
let _interactionMode = null; // 'drag' | 'resize'
let _resizeEdge = null;

function _getEdge(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = e.clientX;
    const y = e.clientY;
    const m = RESIZE_MARGIN;
    let edge = '';
    if (y >= h - m) edge += 'bottom';
    if (x <= m) edge += 'left';
    else if (x >= w - m) edge += 'right';
    return edge || null;
}

function _updateResizeCursor(e) {
    if (_interactionMode) return; // don't change cursor while dragging
    const edge = _getEdge(e);
    if (!edge) {
        document.body.style.cursor = '';
        return;
    }
    if (edge === 'left' || edge === 'right') document.body.style.cursor = 'ew-resize';
    else if (edge === 'bottom') document.body.style.cursor = 'ns-resize';
    else if (edge === 'bottomright') document.body.style.cursor = 'nwse-resize';
    else if (edge === 'bottomleft') document.body.style.cursor = 'nesw-resize';
    else document.body.style.cursor = '';
}

function initTitleBarDrag() {
    const titleBar = document.getElementById('title-bar');
    if (!titleBar) return;

    // Resize grip (bottom-right corner handle)
    const grip = document.getElementById('resize-grip');
    if (grip) {
        grip.addEventListener('mousedown', (e) => {
            _interactionMode = 'resize';
            _resizeEdge = 'bottomright';
            notifyPyQt('resizeStart', { screenX: e.screenX, screenY: e.screenY, edge: 'bottomright' });
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // Edge resize — mousedown anywhere near edge
    document.addEventListener('mousedown', (e) => {
        if (_interactionMode) return;
        const edge = _getEdge(e);
        if (edge) {
            _interactionMode = 'resize';
            _resizeEdge = edge;
            notifyPyQt('resizeStart', { screenX: e.screenX, screenY: e.screenY, edge: edge });
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }, true); // capture phase so it fires before title bar drag

    // Title bar drag
    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        if (_interactionMode) return;
        _interactionMode = 'drag';
        notifyPyQt('dragStart', { screenX: e.screenX, screenY: e.screenY });
        e.preventDefault();
    });

    // Global move / up
    document.addEventListener('mousemove', (e) => {
        if (!_interactionMode) {
            _updateResizeCursor(e);
            return;
        }
        if (_interactionMode === 'drag') {
            notifyPyQt('dragMove', { screenX: e.screenX, screenY: e.screenY });
        } else if (_interactionMode === 'resize') {
            notifyPyQt('resizeMove', { screenX: e.screenX, screenY: e.screenY });
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!_interactionMode) return;
        if (_interactionMode === 'drag') {
            notifyPyQt('dragEnd', {});
        } else if (_interactionMode === 'resize') {
            notifyPyQt('resizeEnd', {});
        }
        _interactionMode = null;
        _resizeEdge = null;
        document.body.style.cursor = '';
    });
}

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

function toggleCompactMode() {
    compactMode = !compactMode;
    document.querySelectorAll('.collapsible-section').forEach(el => {
        el.style.display = compactMode ? 'none' : '';
    });
    // Hide player search bar and section label in compact mode
    const opponentSection = document.getElementById('opponent-section');
    if (opponentSection) {
        const searchRow = opponentSection.querySelector('.player-search-row');
        const sectionLabel = opponentSection.querySelector('.section-label');
        if (searchRow) searchRow.style.display = compactMode ? 'none' : '';
        if (sectionLabel) sectionLabel.style.display = compactMode ? 'none' : '';
    }
    if (!compactMode) {
        renderPassiveIncomeSources();
    }
    // Notify PyQt5 to resize window to fit content
    notifyPyQt('compactMode', compactMode);
}

function minimizePanel() {
    // Minimize to system tray
    notifyPyQt('minimize');
}

function closePanel() {
    notifyPyQt('close');
}

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

// Bridge to PyQt5
function notifyPyQt(action, data) {
    // PyQt5 polls this via JavaScript
    window._pyqtAction = { action, data, ts: Date.now() };
}

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

function setUnitCount(unitId, value) {
    const count = parseInt(value);
    if (isNaN(count) || count <= 0) {
        delete selectedUnits[unitId];
    } else {
        selectedUnits[unitId] = count;
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
                <input type="number" class="queue-count-input" value="${count}" min="1" max="99"
                    onblur="setUnitCount('${unitId}', this.value)"
                    onkeydown="if(event.key==='Enter')this.blur()">
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

let _playerSearchDebounce = null;
function debouncedPlayerSearch() {
    clearTimeout(_playerSearchDebounce);
    _playerSearchDebounce = setTimeout(() => {
        onPlayerNameSubmit();
    }, 800);
}

function onPlayerNameSubmit() {
    clearTimeout(_playerSearchDebounce);
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

// ---- Auto-Detection (called from PyQt5 LogWatcher) ----

// Map API civ names (snake_case) to our CIVILIZATIONS keys
const API_CIV_MAP = {};
(function buildCivMap() {
    for (const [key, name] of Object.entries(CIVILIZATIONS)) {
        if (key === 'RANDOM') continue;
        // Map by key lowercase: "england" -> "ENGLAND"
        API_CIV_MAP[key.toLowerCase()] = key;
        // Map by display name normalized: "abbasid_dynasty" -> "ABBASID"
        const normalized = name.toLowerCase().replace(/['\s]+/g, '_');
        API_CIV_MAP[normalized] = key;
    }
    // Manual overrides for tricky names
    API_CIV_MAP['english'] = 'ENGLAND';
    API_CIV_MAP['holy_roman_empire'] = 'HRE';
    API_CIV_MAP["jeanne_d'arc"] = 'JEANNE_D_ARC';
    API_CIV_MAP['jeanne_darc'] = 'JEANNE_D_ARC';
    API_CIV_MAP['order_of_the_dragon'] = 'DRAGON_ORDER';
    API_CIV_MAP["zhu_xi's_legacy"] = 'ZHU_XIS_LEGACY';
    API_CIV_MAP['zhu_xis_legacy'] = 'ZHU_XIS_LEGACY';
})();

function apiCivToKey(apiCivName) {
    if (!apiCivName) return null;
    const normalized = apiCivName.toLowerCase().replace(/['\s]+/g, '_');
    return API_CIV_MAP[normalized] || null;
}

let _autoSteamId = null;
let _autoSteamName = null;
let _matchPollTimer = null;
let _matchPollCount = 0;
let _lastMatchStartedAt = null;
let _autoDetectEnabled = localStorage.getItem('aoe4_auto_detect') !== 'false';

// Called by PyQt5 when Steam ID is found in log
function onSteamIdDetected(steamId, steamName) {
    _autoSteamId = steamId;
    _autoSteamName = steamName;
    console.log(`[AutoDetect] Steam: ${steamName} (${steamId})`);

    // Auto-fill player name if empty
    const nameInput = document.getElementById('player-name-input');
    if (nameInput && !nameInput.value.trim()) {
        nameInput.value = steamName;
        localStorage.setItem('aoe4_player_name', steamName);
        searchPlayer(steamName);
    }

    // Show opponent panel automatically
    const section = document.getElementById('opponent-section');
    if (section && section.style.display === 'none') {
        section.style.display = '';
        localStorage.setItem('aoe4_show_opponent', 'true');
        const cb = document.getElementById('toggle-opponent-panel');
        if (cb) cb.checked = true;
    }

    // Show auto-detect status
    _showAutoStatus('🔗 Connected: ' + steamName);
}

// Called by PyQt5 when [Match Flow] Start Match Command detected
function onMatchDetected() {
    if (!_autoDetectEnabled || !_autoSteamId) return;
    console.log('[AutoDetect] Match started, polling for game data...');
    _showAutoStatus('⏳ Match detected, loading...');
    _matchPollCount = 0;
    _lastMatchStartedAt = null;
    // Start polling API every 10s for up to 2 minutes
    _stopMatchPoll();
    _matchPollTimer = setInterval(() => _pollForNewGame(), 10000);
    // First poll after 15s (API has ~30-60s delay)
    setTimeout(() => _pollForNewGame(), 15000);
}

// Called by PyQt5 when match ends (Disconnect)
function onMatchEnded() {
    if (!_autoDetectEnabled || !_autoSteamId) return;
    console.log('[AutoDetect] Match ended, refreshing final results...');
    _stopMatchPoll();
    _showAutoStatus('🏁 Match ended, updating...');
    // Refresh after short delay to get final results
    setTimeout(() => {
        const profileId = localStorage.getItem('aoe4_player_profile_id');
        if (profileId) {
            fetchLastGame(profileId);
        }
        _showAutoStatus('');
    }, 5000);
}

async function _pollForNewGame() {
    _matchPollCount++;
    if (_matchPollCount > 12) { // 2 minutes max
        _stopMatchPoll();
        _showAutoStatus('⚠️ Timeout waiting for API data');
        setTimeout(() => _showAutoStatus(''), 5000);
        return;
    }

    try {
        const res = await fetch(`${AOE4_API}/players/${_autoSteamId}/games?limit=1`);
        const data = await res.json();
        if (!data.games || data.games.length === 0) return;

        const game = data.games[0];
        const startedAt = game.started_at || game.updated_at;

        // Check if this is a new game (started recently, within last 5 min)
        if (startedAt) {
            const gameTime = new Date(startedAt).getTime();
            const now = Date.now();
            const ageMs = now - gameTime;

            // If game started more than 5 min ago and we already saw it, skip
            if (_lastMatchStartedAt === startedAt && ageMs > 60000) return;

            // If game is less than 5 min old, treat as current match
            if (ageMs < 300000) {
                _lastMatchStartedAt = startedAt;
                _stopMatchPoll();
                _applyGameData(game);
                return;
            }
        }
    } catch (e) {
        console.log('[AutoDetect] Poll error:', e.message);
    }
}

function _applyGameData(game) {
    console.log('[AutoDetect] Game data received:', game.map);

    // Find my player entry to get my civ
    let myCiv = null;
    let myProfileId = null;
    if (game.teams) {
        for (const team of game.teams) {
            for (const entry of team) {
                const p = entry.player || entry;
                const steamMatch = p.profile_id == _autoSteamId ||
                    String(p.profile_id) === localStorage.getItem('aoe4_player_profile_id');
                if (steamMatch) {
                    myCiv = p.civilization;
                    myProfileId = p.profile_id;
                    break;
                }
            }
            if (myCiv) break;
        }
    }

    // Auto-set civilization
    if (myCiv) {
        const civKey = apiCivToKey(myCiv);
        if (civKey && civKey !== currentCiv) {
            currentCiv = civKey;
            const select = document.getElementById('civ-selector');
            if (select) select.value = civKey;
            onCivChange(civKey);
            _showAutoStatus('🎮 ' + (CIVILIZATIONS[civKey] || myCiv) + ' — ' + (game.map || ''));
        } else {
            _showAutoStatus('🎮 ' + (game.map || 'Match started'));
        }
    }

    // Store profile_id and fetch opponent data
    if (myProfileId) {
        localStorage.setItem('aoe4_player_profile_id', String(myProfileId));
        fetchLastGame(myProfileId);
    }

    // Clear auto status after 10s
    setTimeout(() => _showAutoStatus(''), 10000);
}

function _stopMatchPoll() {
    if (_matchPollTimer) {
        clearInterval(_matchPollTimer);
        _matchPollTimer = null;
    }
}

function _showAutoStatus(msg) {
    let el = document.getElementById('auto-detect-status');
    if (!el) {
        // Create status element if it doesn't exist
        const titleBar = document.getElementById('title-bar');
        if (!titleBar) return;
        el = document.createElement('div');
        el.id = 'auto-detect-status';
        titleBar.parentNode.insertBefore(el, titleBar.nextSibling);
    }
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
}

function toggleAutoDetect() {
    const cb = document.getElementById('toggle-auto-detect');
    _autoDetectEnabled = cb ? cb.checked : !_autoDetectEnabled;
    localStorage.setItem('aoe4_auto_detect', _autoDetectEnabled);
    if (!_autoDetectEnabled) {
        _stopMatchPoll();
        _showAutoStatus('');
    } else if (_autoSteamId) {
        _showAutoStatus('🔗 Connected: ' + (_autoSteamName || _autoSteamId));
    }
}

// ---- OCR Toggle ----
let _ocrEnabled = localStorage.getItem('aoe4_ocr') === 'true';

function toggleOCR() {
    const cb = document.getElementById('toggle-ocr');
    _ocrEnabled = cb ? cb.checked : !_ocrEnabled;
    localStorage.setItem('aoe4_ocr', _ocrEnabled);
    // Notify PyQt5 to start/stop OCR scanning
    notifyPyQt('ocrToggle', _ocrEnabled);
}

// ---- Passive Auto-Detect Toggle ----
let _passiveAutoEnabled = localStorage.getItem('aoe4_passive_auto') === 'true';

function togglePassiveAuto() {
    const cb = document.getElementById('toggle-passive-auto');
    _passiveAutoEnabled = cb ? cb.checked : !_passiveAutoEnabled;
    localStorage.setItem('aoe4_passive_auto', _passiveAutoEnabled);
    // Notify PyQt5 to start/stop passive income detection
    notifyPyQt('passiveAutoToggle', _passiveAutoEnabled);
}

// ---- OCR Pick Mode ----
function ocrPick(resource) {
    if (typeof IS_WEB !== 'undefined' && IS_WEB) return;
    notifyPyQt('ocrPick', resource);
}

function ocrScanAll() {
    if (typeof IS_WEB !== 'undefined' && IS_WEB) return;
    notifyPyQt('ocrScanAll', true);
}

function onOCRResult(resource, value, confidence, previewB64) {
    if (value !== null && value !== undefined) {
        const input = document.getElementById(`actual-${resource}`);
        if (input) {
            input.value = value;
            // Flash green to indicate success
            input.style.borderColor = '#4caf50';
            setTimeout(() => { input.style.borderColor = ''; }, 1000);
        }
        onActualVillChange();
    }
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
    const rates = gatheringRatesService.getGatheringRates(foodSource, activeGatheringMods, []);

    let totalEquiv = 0;

    sources.forEach(src => {
        const row = document.createElement('div');
        row.className = 'selected-unit';
        const count = passiveIncomeSources[src.id] || 0;

        // Calculate per-source total and per-unit villager equivalent
        let srcEquiv = 0;
        let unitEquiv = 0;
        if (count > 0) {
            src.modifiers.forEach(modId => {
                const mod = ALL_PASSIVE_INCOME_MODIFIERS[modId];
                if (!mod) return;
                if (mod.food && rates.food > 0) srcEquiv += (mod.food * count) / rates.food;
                if (mod.wood && rates.wood > 0) srcEquiv += (mod.wood * count) / rates.wood;
                if (mod.gold && rates.gold > 0) srcEquiv += (mod.gold * count) / rates.gold;
                if (mod.stone && rates.stone > 0) srcEquiv += (mod.stone * count) / rates.stone;
            });
            unitEquiv = srcEquiv / count;
            totalEquiv += srcEquiv;
        }

        // Show per-unit equiv (always per-unit, with total when count > 1)
        let equivStr = '';
        if (count > 0 && unitEquiv >= 0.05) {
            equivStr = count > 1
                ? `<span class="passive-src-equiv"><strong>${srcEquiv.toFixed(1)}v</strong> <span class="passive-src-detail">${unitEquiv.toFixed(1)}v × ${count}</span></span>`
                : `<span class="passive-src-equiv"><strong>${unitEquiv.toFixed(1)}v</strong></span>`;
        }

        row.innerHTML = `
            <span class="unit-name">${src.label}</span>
            ${equivStr}
            <div class="counter-controls">
                <button onclick="changePassiveIncomeCount('${src.id}', -1)">-</button>
                <input type="number" class="passive-count-input" value="${count}" min="0" max="99"
                    onchange="setPassiveIncomeCount('${src.id}', this.value)"
                    oninput="setPassiveIncomeCount('${src.id}', this.value)">
                <button onclick="changePassiveIncomeCount('${src.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(row);
    });

    // Show total passive villager equivalent
    if (totalEquiv >= 0.1) {
        const totalRow = document.createElement('div');
        totalRow.className = 'passive-total-row';
        const equiv = getPassiveVillagerEquiv();
        let parts = [];
        if (equiv.food >= 0.1) parts.push(`<span class="pe-food">${equiv.food.toFixed(1)}F</span>`);
        if (equiv.wood >= 0.1) parts.push(`<span class="pe-wood">${equiv.wood.toFixed(1)}W</span>`);
        if (equiv.gold >= 0.1) parts.push(`<span class="pe-gold">${equiv.gold.toFixed(1)}G</span>`);
        if (equiv.stone >= 0.1) parts.push(`<span class="pe-stone">${equiv.stone.toFixed(1)}S</span>`);
        totalRow.innerHTML = `Total ≈ <strong>${totalEquiv.toFixed(1)}</strong>v ${parts.join(' ')}`;
        container.appendChild(totalRow);
    }

    // Also update the passive column in requirements
    updatePassiveColumn();
}

function getPassiveVillagerEquiv() {
    const income = getPassiveIncome();
    const rates = gatheringRatesService.getGatheringRates(foodSource, activeGatheringMods, []);
    return {
        food:  rates.food > 0  ? income.food / rates.food   : 0,
        wood:  rates.wood > 0  ? income.wood / rates.wood   : 0,
        gold:  rates.gold > 0  ? income.gold / rates.gold   : 0,
        stone: rates.stone > 0 ? income.stone / rates.stone : 0
    };
}

function updatePassiveColumn() {
    const equiv = getPassiveVillagerEquiv();
    const total = equiv.food + equiv.wood + equiv.gold + equiv.stone;
    const hasPassive = total > 0.05;

    // Show/hide the passive column header
    const header = document.getElementById('res-h-passive');
    if (header) header.style.display = hasPassive ? '' : 'none';

    ['food', 'wood', 'gold', 'stone'].forEach(res => {
        const el = document.getElementById(`passive-${res}`);
        if (!el) return;
        if (!hasPassive) {
            el.style.display = 'none';
            return;
        }
        el.style.display = '';
        const v = equiv[res];
        el.textContent = v >= 0.05 ? v.toFixed(1) : '—';
    });
}

function changePassiveIncomeCount(sourceId, delta) {
    passiveIncomeSources[sourceId] = Math.max(0, (passiveIncomeSources[sourceId] || 0) + delta);
    renderPassiveIncomeSources();
    recalculate();
}

function setPassiveIncomeCount(sourceId, value) {
    const num = parseInt(value);
    passiveIncomeSources[sourceId] = isNaN(num) ? 0 : Math.max(0, num);
    // Don't re-render (would lose focus), just recalculate
    recalculate();
    updatePassiveColumn();
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

// Store last calculated requirements for allocation
let _lastReq = { food: 0, wood: 0, gold: 0, stone: 0 };

function updateDisplay(result) {
    const f = Math.max(0, result.foodVillagers);
    const w = Math.max(0, result.woodVillagers);
    const g = Math.max(0, result.goldVillagers);
    const s = Math.max(0, result.stoneVillagers);
    const total = f + w + g + s;
    const maxVal = Math.max(f, w, g, s, 1);

    _lastReq = { food: f, wood: w, gold: g, stone: s };

    document.getElementById('val-food').textContent = f.toFixed(1);
    document.getElementById('val-wood').textContent = w.toFixed(1);
    document.getElementById('val-gold').textContent = g.toFixed(1);
    document.getElementById('val-stone').textContent = s.toFixed(1);
    document.getElementById('val-total').textContent = total.toFixed(1);

    document.getElementById('bar-food').style.width = (f / maxVal * 100) + '%';
    document.getElementById('bar-wood').style.width = (w / maxVal * 100) + '%';
    document.getElementById('bar-gold').style.width = (g / maxVal * 100) + '%';
    document.getElementById('bar-stone').style.width = (s / maxVal * 100) + '%';

    updatePassiveColumn();
    updatePerResourceDiff();
}

function onActualVillChange() {
    updatePerResourceDiff();
}

function updatePerResourceDiff() {
    const resources = ['food', 'wood', 'gold', 'stone'];
    resources.forEach(res => {
        const input = document.getElementById(`actual-${res}`);
        const diffEl = document.getElementById(`diff-${res}`);
        if (!input || !diffEl) return;

        const actual = parseInt(input.value);
        const needed = _lastReq[res] || 0;

        if (isNaN(actual) || input.value === '') {
            diffEl.textContent = '';
            diffEl.className = 'res-diff';
            return;
        }

        const diff = actual - needed;
        if (Math.abs(diff) < 0.3) {
            diffEl.textContent = '✓';
            diffEl.className = 'res-diff balanced';
        } else if (diff > 0) {
            diffEl.textContent = '+' + Math.round(diff);
            diffEl.className = 'res-diff surplus';
        } else {
            diffEl.textContent = Math.round(diff);
            diffEl.className = 'res-diff deficit';
        }
    });
}
