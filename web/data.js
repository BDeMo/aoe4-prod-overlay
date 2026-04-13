/**
 * AoE4 Production Calculator - Game Data
 * Ported from https://github.com/SichYuriy/aoe4-production-calculator
 */

// ---- Base Gathering Rates (per minute) ----
const BASE_GATHERING_RATES = {
    sheep: 37.05, cattle: 40.78, berry: 32.93, deer: 41.7,
    farm: 36.718, gold: 37, wood: 31, stone: 37,
    stockyard: 38.67, twinMinaretBerry: 39.91
};

// ---- Civilizations ----
const CIVILIZATIONS = {
    RANDOM: 'Random', ABBASID: 'Abbasid Dynasty', CHINESE: 'Chinese',
    HRE: 'Holy Roman Empire', ENGLAND: 'English', DELHI: 'Delhi Sultanate',
    FRENCH: 'French', MONGOLS: 'Mongols', RUS: 'Rus',
    OTTOMANS: 'Ottomans', MALIANS: 'Malians',
    JEANNE_D_ARC: "Jeanne d'Arc", DRAGON_ORDER: 'Order of the Dragon',
    ZHU_XIS_LEGACY: "Zhu Xi's Legacy", AYYUBIDS: 'Ayyubids',
    JAPANESE: 'Japanese', BYZANTINES: 'Byzantines',
    KNIGHTS_TEMPLAR: 'Knights Templar', HOUSE_OF_LANCASTER: 'House of Lancaster',
    GOLDEN_HORDE: 'Golden Horde', MACEDONIAN_DYNASTY: 'Macedonian Dynasty',
    SENGOKU_DAIMYO: 'Sengoku Daimyo', TUGHLAQ_DYNASTY: 'Tughlaq Dynasty'
};

const ALL_CIVS = Object.keys(CIVILIZATIONS).filter(c => c !== 'RANDOM');

function allExcept(excluded) {
    return ALL_CIVS.filter(c => !excluded.includes(c));
}

// ---- Civilization Flag Icons ----
const CIV_FLAGS = {
    ABBASID: 'icons/flags/Abbasid Dynasty.webp',
    CHINESE: 'icons/flags/Chinese.webp',
    HRE: 'icons/flags/Holy Roman Empire.webp',
    ENGLAND: 'icons/flags/English.webp',
    DELHI: 'icons/flags/Delhi Sultanate.webp',
    FRENCH: 'icons/flags/French.webp',
    MONGOLS: 'icons/flags/Mongols.webp',
    RUS: 'icons/flags/Rus.webp',
    OTTOMANS: 'icons/flags/Ottomans.webp',
    MALIANS: 'icons/flags/Malians.webp',
    JEANNE_D_ARC: 'icons/flags/Jeanne Darc.webp',
    DRAGON_ORDER: 'icons/flags/Order Of The Dragon.webp',
    ZHU_XIS_LEGACY: 'icons/flags/Zhu Xis Legacy.webp',
    AYYUBIDS: 'icons/flags/Ayyubids.webp',
    JAPANESE: 'icons/flags/Japanese.webp',
    BYZANTINES: 'icons/flags/Byzantines.webp',
    KNIGHTS_TEMPLAR: 'icons/flags/Knights Templar.webp',
    HOUSE_OF_LANCASTER: 'icons/flags/House of Lancaster.webp',
    GOLDEN_HORDE: 'icons/flags/Golden Horde.webp',
    MACEDONIAN_DYNASTY: 'icons/flags/Macedonian Dynasty.webp',
    SENGOKU_DAIMYO: 'icons/flags/Sengoku Daimyo.webp',
    TUGHLAQ_DYNASTY: 'icons/flags/Tughlaq Dynasty.webp'
};

// ---- Unit Icon Mapping ----
const UNIT_ICONS = {
    VILLAGER: 'villager.png', ARCHER: 'archer.png', SPEARMAN: 'spearman.png',
    HORSEMAN: 'horseman.png', LANCER: 'lancer.png', KNIGHT: 'knight.png',
    MAN_AT_ARMS: 'man-at-arms.png', CROSSBOWMAN: 'crossbowman.png',
    HANDCANNONEER: 'handcannoneer.png', TRADER: 'trader.png', SCOUT: 'scout.png',
    FISHING_BOAT: 'fishing-boat.png', RAM: 'ram.png', SPRINGALD: 'springald.png',
    MANGONEL: 'mangonel.png', NEST_OF_BEES: 'nest-of-bees.png',
    COUNTERWEIGHT_TREBUCHET: 'counterweight-trebuchet.png', BOMBARD: 'bombard.png',
    IMPERIAL_OFFICIAL: 'imperial-official.png',
    // Jeanne
    JEANNES_RIDER: 'jeannes-rider.png', JEANNES_CHAMPION: 'jeannes-champion.png',
    // Abbasid
    CAMEL_ARCHER: 'camel-archer.png', CAMEL_RIDER: 'camel-rider.png', GHULAM: 'ghulam-3.png',
    // Chinese
    PALACE_GUARD: 'palace-guard.png', ZHUGE_NU: 'zhuge-nu.png', GRENADIER: 'grenadier.png',
    FIRE_LANCER: 'fire-lancer.png',
    // HRE
    LANDSKNECHT: 'landsknecht.png',
    // English
    LONGBOWMAN: 'longbowman.png', COUNCIL_HALL_LONGBOWMAN: 'longbowman.png',
    WYNGUARD_ARMY: 'wynguard-army.png', WYNGUARD_RAIDERS: 'wynguard-army.png',
    WYNGUARD_RANGERS: 'wynguard-army.png', WYNGUARD_FOOTMAN: 'wynguard-army.png',
    // Delhi
    GHAZI_RAIDER: 'ghazi-raider-2.png', SCHOLAR: 'imam.png',
    TOWER_ELEPHANT: 'tower-war-elephant.png', WAR_ELEPHANT: 'war-elephant.png',
    // French
    ROYAL_KNIGHT: 'royal-knight.png', ARBALETRIER: 'arbaletrier.png',
    // Mongols
    KESHIK: 'keshik-2.png', MANGUDAI: 'mangudai.png', TRACTION_TREBUCHET: 'traction-trebuchet.png',
    // Rus
    WARRIOR_MONK: 'warrior_monk.png', STRELTSY: 'streltsy.png', HORSE_ARCHER: 'horse-archer.png',
    RUS_FISHING_BOAT: 'fishing-boat.png',
    // Ottomans
    SIPAHI: 'sipahi.png', MEHTER: 'mehter.png', JANISSARY: 'janissary.png',
    AKINJI: 'sipahi.png', GREAT_BOMBARD: 'great_bombard.png',
    // Malians
    CATTLE: 'cattle.png', DONSO: 'donso.png', SOFA: 'sofa.png',
    MUSOFADI_WARRIOR: 'musofadi-warrior.png', JAVELIN_THROWER: 'javelin_thrower.png',
    MUSOFADI_GUNNER: 'musofadi-gunner.png', WARRIOR_SCOUT: 'warrior_scout.png',
    // Dragon Order
    DRAGON_ORDER_VILLAGER: 'villager.png',
    GILDED_ARCHER: 'gilded-archer.png', GILDED_SPEARMAN: 'gilded-spearman.png',
    GILDED_HORSEMAN: 'gilded-horseman.png', GILDED_KNIGHT: 'gilded-knight.png',
    GILDED_MAN_AT_ARMS: 'gilded-man-at-arms.png', GILDED_LANDSKNECHT: 'gilded-landsknecht.png',
    GILDED_CROSSBOWMAN: 'gilded-crossbowman.png', DRAGON_HANDCANNONEER: 'dragon-handcannoneer.png',
    // Japanese
    YUMI_ASHIGARU: 'yumi-ashigaru.png', ONNA_BUGEISHA: 'onna-bugeisha.png',
    SHINOBI: 'shinobi.png', MOUNTED_SAMURAI: 'mounted-samurai.png',
    SAMURAI: 'samurai.png', ONNA_MUSHA: 'onna-musha.png', OZUTSU: 'ozutsu.png',
    // Byzantines
    LIMITANEI: 'limitanei.png', CATAPHRACT: 'cataphract.png',
    VARANGIAN_GUARD: 'varangian-guard.png', CHEIROSIPHON: 'cheirosiphon.png',
    // Zhu Xi
    YUAN_RAIDER: 'yuan-raider.png', SHAOLIN_MONK: 'shaolin-monk.png',
    IMPERIAL_GUARD: 'imperial-guard.png',
    // Ayyubids
    DESERT_RAIDER: 'desert-raider.png', CAMEL_LANCER: 'camel-lancer.png',
    DERVISH: 'dervish.png', MANJANIQ: 'mangonel.png',
    // Knights Templar
    SERJEANT: 'serjeant.png', HOSPITALLER_KNIGHT: 'hospitaller-knight.png',
    GENOESE_CROSSBOWMAN: 'genoese-crossbowman.png', HEAVY_SPEARMAN: 'heavy-spearman.png',
    CONDOTTIERO: 'condottiero.png', TEUTONIC_KNIGHT: 'teutonic-knight.png',
    CHEVALIER_CONFRERE: 'chevalier-confrere.png', GENITOUR: 'genitour.png',
    TEMPLAR_BROTHER: 'templar-brother.png', SZLACHTA_CAVALRY: 'szlachta-cavalry.png',
    VENETIAN_TRADER: 'venetian-trader.png',
    // House of Lancaster
    YEOMAN: 'longbowman.png', HOBELAR: 'horseman.png', EARLS_GUARD: 'man-at-arms.png',
    // Tughlaq
    RAIDER_ELEPHANT: 'war-elephant.png', BALLISTA_ELEPHANT: 'ballista-elephant-3.png',
    // Sengoku
    NAGINATA_SAMURAI: 'samurai.png', KANABO_SAMURAI: 'samurai.png',
    TANEGASHIMA_ASHIGARU: 'handcannoneer.png', YARI_CAVALRY: 'horseman.png',
    SENGOKU_MOUNTED_SAMURAI: 'mounted-samurai.png',
    // Macedonian
    ATGEIRMADR: 'spearman.png', BOGMADR: 'archer.png', RIDDARI: 'knight.png',
    // Golden Horde
    GOLDEN_HORDE_VILLAGER: 'villager.png', GOLDEN_HORDE_SPEARMAN: 'spearman.png',
    GOLDEN_HORDE_ARCHER: 'archer.png', GOLDEN_HORDE_MAN_AT_ARMS: 'man-at-arms.png',
    KHARASH: 'kharash-2.png', GOLDEN_HORDE_CROSSBOWMAN: 'crossbowman.png',
    GOLDEN_HORDE_HANDCANNONEER: 'handcannoneer.png', GOLDEN_HORDE_HORSEMAN: 'horseman.png',
    GOLDEN_HORDE_KESHIK: 'keshik-2.png', TORGUUD: 'torguud-2.png',
    KIPCHAK_ARCHER: 'kipchak-archer-3.png', GOLDEN_HORDE_SCOUT: 'scout.png',
    GOLDEN_HORDE_TRADER: 'trader.png',
    // Naval
    TRADE_SHIP: 'trade-ship.png', GALLEY: 'galley.png', DHOW: 'dhow.png',
    HULK: 'hulk.png', DEMOLITION_SHIP: 'demolition_ship.png', CARRACK: 'carrack.png',
    BAGHLAH: 'baghlah.png',
};

function getUnitIcon(unitId) {
    const file = UNIT_ICONS[unitId];
    return file ? 'icons/units/' + file : null;
}

// ---- Unit Types & Buildings ----
const UnitType = { INFANTRY: 0, CAVALRY: 1, SIEGE: 2, TRANSPORT: 3, MILITARY_SHIP: 4 };
const Building = { STABLE: 'STABLE', ARCHERY: 'ARCHERY', DOCK: 'DOCK', SIEGE_WORKSHOP: 'SIEGE_WORKSHOP', KEEP: 'KEEP' };

// ---- Common Unit Constants ----
const KNIGHT_COST = { food: 140, gold: 100, wood: 0, stone: 0 };
const KNIGHT_TIME = 35;
const MAA_COST = { food: 100, gold: 20, wood: 0, stone: 0 };
const MAA_TIME = 22.5;
const XBOW_COST = { food: 80, gold: 40, wood: 0, stone: 0 };
const XBOW_TIME = 22.5;
const SPEAR_COST = { food: 60, gold: 0, wood: 20, stone: 0 };
const SPEAR_TIME = 15;
const HORSEMAN_COST = { food: 100, gold: 0, wood: 20, stone: 0 };
const HORSEMAN_TIME = 22.5;
const LONGBOW_COST = { food: 30, gold: 0, wood: 50, stone: 0 };
const LONGBOW_TIME = 17.5;

// ---- All Units ----
const UNITS = {};

function addUnit(id, name, time, cost, types, building, civs, common, displayOrder, opts) {
    UNITS[id] = {
        id, name, productionTime: time,
        cost: { food: cost.food || 0, gold: cost.gold || 0, wood: cost.wood || 0, stone: cost.stone || 0 },
        types: types || [], building: building || null,
        civilizations: civs, common: common !== false,
        civilizationSpecificFeature: opts?.civFeature || false,
        notAffectedByModifiers: opts?.noModifiers || false,
        displayOrder: displayOrder || 0
    };
}

// -- Common Units --
addUnit('VILLAGER', 'villager', 20, {food:50,gold:0,wood:0,stone:0}, [], null,
    allExcept(['DRAGON_ORDER','GOLDEN_HORDE']), true, 300);
addUnit('ARCHER', 'archer', 15, {food:30,gold:0,wood:50,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['ABBASID','CHINESE','HRE','DELHI','FRENCH','MONGOLS','RUS','OTTOMANS','MALIANS','JEANNE_D_ARC','AYYUBIDS','BYZANTINES','KNIGHTS_TEMPLAR','TUGHLAQ_DYNASTY'], true, 600);
addUnit('SPEARMAN', 'spearman', SPEAR_TIME, SPEAR_COST, [UnitType.INFANTRY], null,
    ['ABBASID','CHINESE','HRE','ENGLAND','DELHI','FRENCH','MONGOLS','RUS','OTTOMANS','JEANNE_D_ARC','AYYUBIDS','ZHU_XIS_LEGACY','JAPANESE','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','TUGHLAQ_DYNASTY','SENGOKU_DAIMYO'], true, 1100);
addUnit('HORSEMAN', 'horseman', HORSEMAN_TIME, HORSEMAN_COST, [UnitType.CAVALRY], Building.STABLE,
    ['ABBASID','CHINESE','HRE','ENGLAND','FRENCH','MONGOLS','RUS','JEANNE_D_ARC','AYYUBIDS','ZHU_XIS_LEGACY','JAPANESE','BYZANTINES','KNIGHTS_TEMPLAR','MACEDONIAN_DYNASTY'], true, 1800);
addUnit('LANCER', 'lancer', KNIGHT_TIME, KNIGHT_COST, [UnitType.CAVALRY], Building.STABLE,
    ['ABBASID','CHINESE','DELHI','ZHU_XIS_LEGACY','TUGHLAQ_DYNASTY'], true, 2500);
addUnit('KNIGHT', 'knight', KNIGHT_TIME, KNIGHT_COST, [UnitType.CAVALRY], Building.STABLE,
    ['HRE','ENGLAND','RUS','OTTOMANS','HOUSE_OF_LANCASTER'], true, 3500);
addUnit('MAN_AT_ARMS', 'man at arms', MAA_TIME, MAA_COST, [UnitType.INFANTRY], null,
    ['HRE','ENGLAND','DELHI','FRENCH','MONGOLS','RUS','OTTOMANS','JEANNE_D_ARC','KNIGHTS_TEMPLAR','TUGHLAQ_DYNASTY'], true, 4400);
addUnit('CROSSBOWMAN', 'crossbowman', XBOW_TIME, XBOW_COST, [UnitType.INFANTRY], Building.ARCHERY,
    ['ABBASID','CHINESE','HRE','ENGLAND','DELHI','MONGOLS','RUS','OTTOMANS','AYYUBIDS','ZHU_XIS_LEGACY','BYZANTINES','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','TUGHLAQ_DYNASTY','MACEDONIAN_DYNASTY'], true, 5700);
addUnit('HANDCANNONEER', 'handcannoneer', 35, {food:120,gold:120,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['ABBASID','CHINESE','HRE','ENGLAND','DELHI','FRENCH','MONGOLS','JEANNE_D_ARC','AYYUBIDS','JAPANESE','BYZANTINES','HOUSE_OF_LANCASTER','TUGHLAQ_DYNASTY','MACEDONIAN_DYNASTY'], true, 7500);
addUnit('TRADER', 'trader', 30, {food:0,gold:60,wood:60,stone:0}, [], null,
    allExcept(['KNIGHTS_TEMPLAR','GOLDEN_HORDE']), true, 8400);
addUnit('SCOUT', 'scout', 23, {food:65,gold:0,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['ABBASID','CHINESE','HRE','ENGLAND','DELHI','FRENCH','MONGOLS','RUS','OTTOMANS','JEANNE_D_ARC','DRAGON_ORDER','AYYUBIDS','ZHU_XIS_LEGACY','JAPANESE','BYZANTINES','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','TUGHLAQ_DYNASTY'], true, 9700);
addUnit('FISHING_BOAT', 'fishing boat', 30, {food:0,gold:0,wood:75,stone:0}, [], Building.DOCK,
    allExcept(['RUS']), true, 9900);
addUnit('RAM', 'ram', 35, {food:0,gold:0,wood:200,stone:0}, [], null,
    allExcept(['BYZANTINES','MALIANS','MACEDONIAN_DYNASTY']).filter(c=>c!=='HRE'?true:true), true, 10100);
addUnit('SPRINGALD', 'springald', 20, {food:0,gold:100,wood:150,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    allExcept(['TUGHLAQ_DYNASTY']), true, 10300);
addUnit('MANGONEL', 'mangonel', 40, {food:0,gold:200,wood:400,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['ABBASID','HRE','ENGLAND','DELHI','FRENCH','MONGOLS','RUS','OTTOMANS','MALIANS','JEANNE_D_ARC','DRAGON_ORDER','JAPANESE','BYZANTINES','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','TUGHLAQ_DYNASTY','SENGOKU_DAIMYO','MACEDONIAN_DYNASTY','GOLDEN_HORDE'], true, 10400);
addUnit('NEST_OF_BEES', 'nest of bees', 40, {food:0,gold:300,wood:300,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['CHINESE','ZHU_XIS_LEGACY'], false, 10600);
addUnit('COUNTERWEIGHT_TREBUCHET', 'counterweight trebuchet', 30, {food:0,gold:150,wood:400,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    allExcept(['MONGOLS','OTTOMANS','MALIANS','GOLDEN_HORDE']).concat(['MONGOLS','OTTOMANS','MALIANS']), true, 10700);
addUnit('BOMBARD', 'bombard', 45, {food:0,gold:500,wood:350,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    allExcept(['OTTOMANS','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','SENGOKU_DAIMYO']), true, 11000);

// -- Jeanne d'Arc --
addUnit('JEANNES_RIDER', "jeanne's rider", 15, {food:180,gold:20,wood:0,stone:0}, [UnitType.CAVALRY], Building.KEEP,
    ['JEANNE_D_ARC'], false, 4200);
addUnit('JEANNES_CHAMPION', "jeanne's champion", 15, {food:160,gold:40,wood:0,stone:0}, [UnitType.INFANTRY], Building.KEEP,
    ['JEANNE_D_ARC'], false, 4300);

// -- Abbasid --
addUnit('CAMEL_ARCHER', 'camel archer', 35, {food:170,gold:0,wood:60,stone:0}, [UnitType.CAVALRY], null,
    ['ABBASID'], false, 9000);
addUnit('CAMEL_RIDER', 'camel rider', 35, {food:130,gold:45,wood:45,stone:0}, [UnitType.CAVALRY], null,
    ['ABBASID'], false, 9100);
addUnit('GHULAM', 'ghulam', 26, {food:120,gold:30,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['ABBASID','AYYUBIDS'], false, 5100);

// -- Chinese --
addUnit('PALACE_GUARD', 'palace guard', 22.5, {food:100,gold:25,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['CHINESE','ZHU_XIS_LEGACY'], false, 5000);
addUnit('ZHUGE_NU', 'zhuge nu', 15, {food:30,gold:20,wood:30,stone:0}, [UnitType.INFANTRY], null,
    ['CHINESE','ZHU_XIS_LEGACY'], false, 9200);
addUnit('GRENADIER', 'grenadier', 30, {food:100,gold:60,wood:60,stone:0}, [UnitType.INFANTRY], null,
    ['CHINESE','ZHU_XIS_LEGACY'], false, 9300);
addUnit('FIRE_LANCER', 'fire lancer', 22, {food:120,gold:20,wood:20,stone:0}, [UnitType.CAVALRY], null,
    ['CHINESE'], false, 9400);
addUnit('IMPERIAL_OFFICIAL', 'imperial official', 20, {food:100,gold:50,wood:0,stone:0}, [], null,
    ['CHINESE','ZHU_XIS_LEGACY'], false, 11200);

// -- HRE --
addUnit('LANDSKNECHT', 'landsknecht', 22, {food:60,gold:100,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['HRE'], false, 5400);

// -- English --
addUnit('LONGBOWMAN', 'longbowman', LONGBOW_TIME, LONGBOW_COST, [UnitType.INFANTRY], Building.ARCHERY,
    ['ENGLAND'], false, 1000);
addUnit('COUNCIL_HALL_LONGBOWMAN', 'longbowman (council)', LONGBOW_TIME/2, LONGBOW_COST, [UnitType.INFANTRY], Building.ARCHERY,
    ['ENGLAND'], false, 1050, {civFeature:true});
addUnit('WYNGUARD_ARMY', 'wynguard army', 55, {food:100,gold:200,wood:100,stone:0}, [UnitType.INFANTRY], null,
    ['ENGLAND','HOUSE_OF_LANCASTER'], false, 11800, {civFeature:true});
addUnit('WYNGUARD_RAIDERS', 'wynguard raiders', 25, {food:650,gold:200,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['ENGLAND'], false, 11900, {civFeature:true});
addUnit('WYNGUARD_RANGERS', 'wynguard rangers', 45, {food:0,gold:300,wood:450,stone:0}, [UnitType.INFANTRY], null,
    ['ENGLAND'], false, 12000, {civFeature:true});
addUnit('WYNGUARD_FOOTMAN', 'wynguard footmen', 45, {food:300,gold:400,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['ENGLAND'], false, 12100, {civFeature:true});

// -- Delhi --
addUnit('GHAZI_RAIDER', 'ghazi raider', 25, {food:110,gold:0,wood:30,stone:0}, [UnitType.CAVALRY], null,
    ['DELHI'], false, 2400);
addUnit('SCHOLAR', 'scholar', 30, {food:0,gold:135,wood:0,stone:0}, [], null,
    ['DELHI'], false, 2800);
addUnit('TOWER_ELEPHANT', 'tower elephant', 60, {food:400,gold:600,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['DELHI'], false, 9500);
addUnit('WAR_ELEPHANT', 'war elephant', 60, {food:400,gold:350,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['DELHI'], false, 9600);

// -- French --
addUnit('ROYAL_KNIGHT', 'royal knight', KNIGHT_TIME, KNIGHT_COST, [UnitType.CAVALRY], Building.STABLE,
    ['FRENCH','JEANNE_D_ARC'], false, 3900);
addUnit('ARBALETRIER', 'arbaletrier', XBOW_TIME, XBOW_COST, [UnitType.INFANTRY], Building.ARCHERY,
    ['FRENCH','JEANNE_D_ARC'], false, 6000);

// -- Mongols --
addUnit('KESHIK', 'keshik', 30, {food:120,gold:80,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['MONGOLS'], false, 2700);
addUnit('MANGUDAI', 'mangudai', 28, {food:90,gold:60,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['MONGOLS'], false, 8300);
addUnit('TRACTION_TREBUCHET', 'traction trebuchet', 30, {food:0,gold:100,wood:300,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['MONGOLS','GOLDEN_HORDE'], false, 10800);

// -- Rus --
addUnit('WARRIOR_MONK', 'warrior monk', 35, {food:40,gold:200,wood:0,stone:0}, [], null,
    ['RUS'], false, 3000);
addUnit('STRELTSY', 'streltsy', 35, {food:90,gold:90,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['RUS'], false, 7800);
addUnit('HORSE_ARCHER', 'horse archer', 22, {food:80,gold:0,wood:40,stone:0}, [UnitType.CAVALRY], null,
    ['RUS'], false, 8100);
addUnit('RUS_FISHING_BOAT', 'fishing boat', 46, {food:0,gold:0,wood:150,stone:0}, [], Building.DOCK,
    ['RUS'], false, 10000);

// -- Ottomans --
addUnit('SIPAHI', 'sipahi', 30, {food:120,gold:0,wood:40,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['OTTOMANS'], false, 2300);
addUnit('MEHTER', 'mehter', 28, {food:100,gold:80,wood:0,stone:0}, [], null,
    ['OTTOMANS'], false, 5300);
addUnit('JANISSARY', 'janissary', 24, {food:60,gold:100,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['OTTOMANS'], false, 7900);
addUnit('AKINJI', 'akinji', 24, {food:80,gold:0,wood:80,stone:0}, [UnitType.CAVALRY], null,
    ['OTTOMANS'], false, 8200);
addUnit('GREAT_BOMBARD', 'great bombard', 60, {food:0,gold:800,wood:450,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['OTTOMANS'], false, 11100);

// -- Malians --
addUnit('CATTLE', 'cattle', 15, {food:0,gold:90,wood:0,stone:0}, [], null,
    ['MALIANS'], false, 500);
addUnit('DONSO', 'donso', 15, {food:60,gold:0,wood:30,stone:0}, [UnitType.INFANTRY], null,
    ['MALIANS'], false, 1500);
addUnit('SOFA', 'sofa', 26, {food:120,gold:60,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['MALIANS'], false, 4100);
addUnit('MUSOFADI_WARRIOR', 'musofadi warrior', 15, {food:45,gold:30,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['MALIANS'], false, 5200);
addUnit('JAVELIN_THROWER', 'javelin thrower', 22, {food:80,gold:40,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['MALIANS'], false, 6100);
addUnit('MUSOFADI_GUNNER', 'musofadi gunner', 35, {food:110,gold:130,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['MALIANS'], false, 8000);
addUnit('WARRIOR_SCOUT', 'warrior scout', 14, {food:90,gold:0,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['MALIANS'], false, 9800);

// -- Dragon Order --
addUnit('DRAGON_ORDER_VILLAGER', 'dragon villager', 23, {food:60,gold:0,wood:0,stone:0}, [], null,
    ['DRAGON_ORDER'], false, 100);
addUnit('GILDED_ARCHER', 'gilded archer', 18, {food:60,gold:0,wood:100,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['DRAGON_ORDER'], false, 900);
addUnit('GILDED_SPEARMAN', 'gilded spearman', 18, {food:120,gold:0,wood:40,stone:0}, [UnitType.INFANTRY], null,
    ['DRAGON_ORDER'], false, 1200);
addUnit('GILDED_HORSEMAN', 'gilded horseman', 27, {food:200,gold:0,wood:40,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['DRAGON_ORDER'], false, 2200);
addUnit('GILDED_KNIGHT', 'gilded knight', 42, {food:280,gold:200,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['DRAGON_ORDER'], false, 3600);
addUnit('GILDED_MAN_AT_ARMS', 'gilded man at arms', 27, {food:200,gold:40,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['DRAGON_ORDER'], false, 4800);
addUnit('GILDED_LANDSKNECHT', 'gilded landsknecht', 27, {food:120,gold:200,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['DRAGON_ORDER'], false, 5500);
addUnit('GILDED_CROSSBOWMAN', 'gilded crossbowman', 27, {food:160,gold:80,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['DRAGON_ORDER'], false, 5800);
addUnit('DRAGON_HANDCANNONEER', 'dragon handcannoneer', 35, {food:240,gold:240,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['DRAGON_ORDER'], false, 7600);

// -- Japanese --
addUnit('YUMI_ASHIGARU', 'yumi ashigaru', 13, {food:30,gold:0,wood:35,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['JAPANESE','SENGOKU_DAIMYO'], false, 800);
addUnit('ONNA_BUGEISHA', 'onna-bugeisha', 15, {food:60,gold:20,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['JAPANESE'], false, 1600);
addUnit('SHINOBI', 'shinobi', 20, {food:50,gold:50,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['JAPANESE'], false, 1700);
addUnit('MOUNTED_SAMURAI', 'mounted samurai', 35, {food:140,gold:110,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['JAPANESE'], false, 3800);
addUnit('SAMURAI', 'samurai', 20, {food:100,gold:30,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['JAPANESE'], false, 4600);
addUnit('ONNA_MUSHA', 'onna-musha', 24, {food:80,gold:60,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['JAPANESE'], false, 5900);
addUnit('OZUTSU', 'ozutsu', 35, {food:85,gold:155,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['JAPANESE','SENGOKU_DAIMYO'], false, 7700);

// -- Byzantines --
addUnit('LIMITANEI', 'limitanei', 17, {food:80,gold:0,wood:10,stone:0}, [UnitType.INFANTRY], null,
    ['BYZANTINES'], false, 1400);
addUnit('CATAPHRACT', 'cataphract', 40, {food:180,gold:150,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['BYZANTINES'], false, 3700);
addUnit('VARANGIAN_GUARD', 'varangian guard', 25, {food:90,gold:40,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['BYZANTINES','MACEDONIAN_DYNASTY'], false, 4700);
addUnit('CHEIROSIPHON', 'cheirosiphon', 35, {food:0,gold:60,wood:200,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['BYZANTINES','MACEDONIAN_DYNASTY'], false, 10200);

// -- Zhu Xi's Legacy --
addUnit('YUAN_RAIDER', 'yuan raider', 22.5, {food:80,gold:20,wood:20,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['ZHU_XIS_LEGACY'], false, 2000);
addUnit('SHAOLIN_MONK', 'shaolin monk', 20, {food:200,gold:0,wood:0,stone:0}, [], null,
    ['ZHU_XIS_LEGACY'], false, 3100);
addUnit('IMPERIAL_GUARD', 'imperial guard', 35, {food:140,gold:140,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['ZHU_XIS_LEGACY'], false, 4000);

// -- Ayyubids --
addUnit('DESERT_RAIDER', 'desert raider', 30, {food:80,gold:50,wood:50,stone:0}, [UnitType.CAVALRY], null,
    ['AYYUBIDS'], false, 2100);
addUnit('CAMEL_LANCER', 'camel lancer', 35, {food:130,gold:110,wood:0,stone:0}, [UnitType.CAVALRY], null,
    ['AYYUBIDS'], false, 2600);
addUnit('DERVISH', 'dervish', 40, {food:60,gold:140,wood:0,stone:0}, [], null,
    ['AYYUBIDS'], false, 3400);
addUnit('MANJANIQ', 'manjaniq', 40, {food:0,gold:200,wood:400,stone:0}, [UnitType.SIEGE], Building.SIEGE_WORKSHOP,
    ['AYYUBIDS'], false, 10500);

// -- Knights Templar --
addUnit('SERJEANT', 'serjeant', 23, {food:70,gold:50,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['KNIGHTS_TEMPLAR'], false, 6500);
addUnit('HOSPITALLER_KNIGHT', 'hospitaller knight', 21, {food:50,gold:60,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['KNIGHTS_TEMPLAR'], false, 6600);
addUnit('GENOESE_CROSSBOWMAN', 'genoese crossbowman', 26, {food:80,gold:90,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['KNIGHTS_TEMPLAR'], false, 6700);
addUnit('HEAVY_SPEARMAN', 'heavy spearman', 19, {food:80,gold:30,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['KNIGHTS_TEMPLAR'], false, 6800);
addUnit('CONDOTTIERO', 'condottiero', 19, {food:0,gold:120,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['KNIGHTS_TEMPLAR'], false, 6900);
addUnit('TEUTONIC_KNIGHT', 'teutonic knight', 28, {food:80,gold:100,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['KNIGHTS_TEMPLAR'], false, 7000);
addUnit('CHEVALIER_CONFRERE', 'chevalier confrere', 26, {food:90,gold:80,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['KNIGHTS_TEMPLAR'], false, 7100);
addUnit('GENITOUR', 'genitour', 23, {food:60,gold:0,wood:60,stone:0}, [UnitType.CAVALRY], Building.ARCHERY,
    ['KNIGHTS_TEMPLAR'], false, 7200);
addUnit('TEMPLAR_BROTHER', 'templar brother', 38, {food:120,gold:140,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['KNIGHTS_TEMPLAR'], false, 7300);
addUnit('SZLACHTA_CAVALRY', 'szlachta cavalry', 40, {food:180,gold:120,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['KNIGHTS_TEMPLAR'], false, 7400);
addUnit('VENETIAN_TRADER', 'venetian trader', 20, {food:0,gold:120,wood:80,stone:0}, [], null,
    ['KNIGHTS_TEMPLAR'], false, 8500);

// -- House of Lancaster --
addUnit('YEOMAN', 'yeoman', 15, {food:50,gold:0,wood:45,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['HOUSE_OF_LANCASTER'], false, 700);
addUnit('HOBELAR', 'hobelar', 15, {food:75,gold:20,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['HOUSE_OF_LANCASTER'], false, 1900);
addUnit('EARLS_GUARD', "earl's guard", 23, {food:100,gold:20,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['HOUSE_OF_LANCASTER'], false, 4500);

// -- Tughlaq Dynasty --
addUnit('RAIDER_ELEPHANT', 'raider elephant', 25, {food:180,gold:0,wood:40,stone:0}, [UnitType.CAVALRY], null,
    ['TUGHLAQ_DYNASTY'], false, 1800);
addUnit('BALLISTA_ELEPHANT', 'ballista elephant', 45, {food:300,gold:350,wood:0,stone:0}, [UnitType.SIEGE], null,
    ['TUGHLAQ_DYNASTY'], false, 10300);

// -- Sengoku Daimyo --
addUnit('NAGINATA_SAMURAI', 'naginata samurai', 23, {food:100,gold:20,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['SENGOKU_DAIMYO'], false, 4600);
addUnit('KANABO_SAMURAI', 'kanabo samurai', 24, {food:130,gold:30,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['SENGOKU_DAIMYO'], false, 4550);
addUnit('TANEGASHIMA_ASHIGARU', 'tanegashima ashigaru', 24, {food:70,gold:70,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['SENGOKU_DAIMYO'], false, 5700);
addUnit('YARI_CAVALRY', 'yari cavalry', 23, {food:115,gold:0,wood:30,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['SENGOKU_DAIMYO'], false, 1800);
addUnit('SENGOKU_MOUNTED_SAMURAI', 'mounted samurai', 35, {food:140,gold:100,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['SENGOKU_DAIMYO'], false, 3800);

// -- Macedonian Dynasty --
addUnit('ATGEIRMADR', 'atgeirmadr', 17, {food:70,gold:0,wood:20,stone:0}, [UnitType.INFANTRY], null,
    ['MACEDONIAN_DYNASTY'], false, 1100);
addUnit('BOGMADR', 'bogmadr', 15, {food:40,gold:0,wood:50,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['MACEDONIAN_DYNASTY'], false, 600);
addUnit('RIDDARI', 'riddari', 35, {food:130,gold:110,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['MACEDONIAN_DYNASTY'], false, 2500);

// -- Golden Horde (units produced in pairs - costs are doubled) --
addUnit('GOLDEN_HORDE_VILLAGER', 'villager (x2)', 37, {food:100,gold:0,wood:0,stone:0}, [], null,
    ['GOLDEN_HORDE'], false, 300);
addUnit('GOLDEN_HORDE_SPEARMAN', 'spearman (x2)', 30, {food:120,gold:0,wood:40,stone:0}, [UnitType.INFANTRY], null,
    ['GOLDEN_HORDE'], false, 1100);
addUnit('GOLDEN_HORDE_ARCHER', 'archer (x2)', 30, {food:60,gold:0,wood:100,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['GOLDEN_HORDE'], false, 600);
addUnit('GOLDEN_HORDE_MAN_AT_ARMS', 'man at arms (x2)', 45, {food:200,gold:40,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['GOLDEN_HORDE'], false, 4400);
addUnit('KHARASH', 'kharash (x2)', 20, {food:100,gold:0,wood:0,stone:0}, [UnitType.INFANTRY], null,
    ['GOLDEN_HORDE'], false, 4350);
addUnit('GOLDEN_HORDE_CROSSBOWMAN', 'crossbowman (x2)', 45, {food:160,gold:80,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['GOLDEN_HORDE'], false, 5700);
addUnit('GOLDEN_HORDE_HANDCANNONEER', 'handcannoneer (x2)', 70, {food:240,gold:240,wood:0,stone:0}, [UnitType.INFANTRY], Building.ARCHERY,
    ['GOLDEN_HORDE'], false, 7500);
addUnit('GOLDEN_HORDE_HORSEMAN', 'horseman (x2)', 45, {food:200,gold:0,wood:40,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['GOLDEN_HORDE'], false, 1800);
addUnit('GOLDEN_HORDE_KESHIK', 'keshik (x2)', 60, {food:240,gold:160,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['GOLDEN_HORDE'], false, 2700);
addUnit('TORGUUD', 'torguud', 20, {food:75,gold:0,wood:0,stone:100}, [UnitType.CAVALRY], null,
    ['GOLDEN_HORDE'], false, 2750);
addUnit('KIPCHAK_ARCHER', 'kipchak archer (x2)', 48, {food:160,gold:0,wood:140,stone:0}, [UnitType.CAVALRY], Building.ARCHERY,
    ['GOLDEN_HORDE'], false, 8300);
addUnit('GOLDEN_HORDE_SCOUT', 'scout (x2)', 43, {food:130,gold:0,wood:0,stone:0}, [UnitType.CAVALRY], Building.STABLE,
    ['GOLDEN_HORDE'], false, 9700);
addUnit('GOLDEN_HORDE_TRADER', 'trader (x2)', 60, {food:0,gold:120,wood:120,stone:0}, [], null,
    ['GOLDEN_HORDE'], false, 8400);

// -- Naval units (common) --
addUnit('TRADE_SHIP', 'trade ship', 30, {food:0,gold:100,wood:100,stone:0}, [], Building.DOCK,
    allExcept(['GOLDEN_HORDE']), false, 12500);
addUnit('GALLEY', 'galley', 25, {food:80,gold:0,wood:150,stone:0}, [UnitType.MILITARY_SHIP], Building.DOCK,
    ['ENGLAND','FRENCH','HRE','RUS','JEANNE_D_ARC','DRAGON_ORDER','BYZANTINES','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','MACEDONIAN_DYNASTY'], false, 12700);
addUnit('DHOW', 'dhow', 25, {food:80,gold:0,wood:150,stone:0}, [UnitType.MILITARY_SHIP], Building.DOCK,
    ['OTTOMANS','ABBASID','DELHI','AYYUBIDS','TUGHLAQ_DYNASTY'], false, 12600);
addUnit('HULK', 'hulk', 30, {food:110,gold:30,wood:200,stone:0}, [UnitType.MILITARY_SHIP], Building.DOCK,
    ['OTTOMANS','ENGLAND','HRE','RUS','DRAGON_ORDER','KNIGHTS_TEMPLAR','HOUSE_OF_LANCASTER','MACEDONIAN_DYNASTY'], false, 12900);
addUnit('DEMOLITION_SHIP', 'demolition ship', 15, {food:0,gold:80,wood:80,stone:0}, [UnitType.MILITARY_SHIP], Building.DOCK,
    allExcept(['CHINESE','ZHU_XIS_LEGACY','JAPANESE','SENGOKU_DAIMYO','MONGOLS']), false, 13400);
addUnit('CARRACK', 'carrack', 45, {food:200,gold:200,wood:200,stone:0}, [UnitType.MILITARY_SHIP], Building.DOCK,
    ['OTTOMANS','ENGLAND','FRENCH','HRE','ABBASID','DELHI','JEANNE_D_ARC','DRAGON_ORDER','BYZANTINES','HOUSE_OF_LANCASTER','MACEDONIAN_DYNASTY'], false, 13600);

// Sort units list
const UNITS_LIST = Object.values(UNITS).sort((a, b) => a.displayOrder - b.displayOrder);

// ---- Gathering Rate Modifier Multipliers ----
const GR_MULTIPLIERS = {
    DOUBLE_BROADAX: 1.1, LUMBER_PRESERVATION: 1.09, CROSSCUT_SAW: 1.08,
    HORTICULTURE: 1.08, FERTILIZATION: 1.067, CROSS_BREEDING: 1.067,
    SPECIALIZED_PICK: 1.12, ACID_DISTILLATION: 1.11
};

// ---- Common Gathering Rate Modifiers ----
const COMMON_GATHERING_RATE_MODIFIERS = {
    WHEELBARROW: {
        id: 'WHEELBARROW',
        apply: (rates) => ({ food: rates.food * 1.05, wood: rates.wood * 1.05, gold: rates.gold * 1.05, stone: rates.stone * 1.05 }),
        description: 'Wheelbarrow +5%',
        source: 'tc', age: 'I'
    },
    SURVIVALTECH: {
        id: 'SURVIVALTECH',
        apply: (rates, foodSource) => {
            if (foodSource === 'FARM') return rates;
            return { ...rates, food: rates.food * 1.10 };
        },
        description: 'Survival Tech +10%',
        source: 'mill', age: 'I'
    },
    HORTICULTURE: {
        id: 'HORTICULTURE',
        apply: (rates) => ({ ...rates, food: rates.food * GR_MULTIPLIERS.HORTICULTURE }),
        description: 'Horticulture +8%',
        source: 'mill', age: 'II'
    },
    FERTILIZATION: {
        id: 'FERTILIZATION',
        apply: (rates) => ({ ...rates, food: rates.food * GR_MULTIPLIERS.FERTILIZATION }),
        description: 'Fertilization +6.7%',
        source: 'mill', age: 'III'
    },
    CROSS_BREEDING: {
        id: 'CROSS_BREEDING',
        apply: (rates) => ({ ...rates, food: rates.food * GR_MULTIPLIERS.CROSS_BREEDING }),
        description: 'Crossbreeding +6.7%',
        source: 'mill', age: 'IV'
    },
    DOUBLE_BROADAX: {
        id: 'DOUBLE_BROADAX',
        apply: (rates) => ({ ...rates, wood: rates.wood * GR_MULTIPLIERS.DOUBLE_BROADAX }),
        description: 'Double Broadax +10%',
        source: 'lumber', age: 'II'
    },
    LUMBER_PRESERVATION: {
        id: 'LUMBER_PRESERVATION',
        apply: (rates) => ({ ...rates, wood: rates.wood * GR_MULTIPLIERS.LUMBER_PRESERVATION }),
        description: 'Lumber Preservation +9%',
        source: 'lumber', age: 'III'
    },
    CROSSCUT_SAW: {
        id: 'CROSSCUT_SAW',
        apply: (rates) => ({ ...rates, wood: rates.wood * GR_MULTIPLIERS.CROSSCUT_SAW }),
        description: 'Crosscut Saw +8%',
        source: 'lumber', age: 'IV'
    },
    SPECIALIZED_PICK: {
        id: 'SPECIALIZED_PICK',
        apply: (rates) => ({ ...rates, gold: rates.gold * GR_MULTIPLIERS.SPECIALIZED_PICK, stone: rates.stone * GR_MULTIPLIERS.SPECIALIZED_PICK }),
        description: 'Specialized Pick +12%',
        source: 'mining', age: 'II'
    },
    ACID_DISTILLATION: {
        id: 'ACID_DISTILLATION',
        apply: (rates) => ({ ...rates, gold: rates.gold * GR_MULTIPLIERS.ACID_DISTILLATION, stone: rates.stone * GR_MULTIPLIERS.ACID_DISTILLATION }),
        description: 'Acid Distillation +11%',
        source: 'mining', age: 'III'
    }
};

// ---- Common Production Speed Modifiers ----
const COMMON_PRODUCTION_SPEED_MODIFIERS = {
    MILITARY_ACADEMY: {
        id: 'MILITARY_ACADEMY',
        canBeApplied: (unit) => unit.types && (unit.types.includes(UnitType.INFANTRY) || unit.types.includes(UnitType.CAVALRY) || unit.types.includes(UnitType.SIEGE)),
        productionSpeedBonus: 0.33,
        description: 'Military Academy +33%',
        source: 'blacksmith', age: 'IV'
    }
};

// ---- Common Cost Modifiers ----
const COMMON_COST_MODIFIERS = {};

// ---- Passive Income Modifiers ----
const ALL_PASSIVE_INCOME_MODIFIERS = {
    RELICS: { id: 'RELICS', food: 0, gold: 80, wood: 0, stone: 0, source: 'RELICS' },
    SACRED_SITES: { id: 'SACRED_SITES', food: 0, gold: 100, wood: 0, stone: 0, source: 'SACRED_SITES' },
    TITHE_BARN: { id: 'TITHE_BARN', food: 40, gold: 0, wood: 40, stone: 10, source: 'RELICS' },
    // Chinese / Zhu Xi
    PAGODA: { id: 'PAGODA', food: 62, gold: 100, wood: 62, stone: 25, source: 'PAGODA' },
    // Delhi
    SANCTITY: { id: 'SANCTITY', food: 0, gold: 25, wood: 0, stone: 0, source: 'SACRED_SITES' },
    // Dragon Order
    REGNITZ_CATHEDRAL: { id: 'REGNITZ_CATHEDRAL', food: 0, gold: 80, wood: 0, stone: 0, source: 'RELICS' },
    // Golden Horde
    STOCKYARD_EDICT: { id: 'STOCKYARD_EDICT', food: 0, gold: 40, wood: 0, stone: 0, source: 'STOCKYARD' },
    // House of Lancaster
    MANOR: { id: 'MANOR', food: 30, gold: 0, wood: 10, stone: 0, source: 'MANOR' },
    MANOR_VILLAGER: { id: 'MANOR_VILLAGER', food: 4, gold: 0, wood: 2, stone: 0, source: 'MANOR_VILLAGER' },
    SCUTAGE: { id: 'SCUTAGE', food: 0, gold: 30, wood: 0, stone: 0, source: 'MANOR' },
    // Japanese
    YORISHIRO_FARM_HOUSE: { id: 'YORISHIRO_FARM_HOUSE', food: 70, gold: 0, wood: 0, stone: 0, source: 'YORISHIRO_FARM_HOUSE' },
    YORISHIRO_LUMBER_CAMP: { id: 'YORISHIRO_LUMBER_CAMP', food: 0, gold: 0, wood: 70, stone: 0, source: 'YORISHIRO_LUMBER_CAMP' },
    YORISHIRO_FORGE: { id: 'YORISHIRO_FORGE', food: 0, gold: 50, wood: 0, stone: 0, source: 'YORISHIRO_FORGE' },
    // Malians
    MANSA_QUERY_GOLD: { id: 'MANSA_QUERY_GOLD', food: 0, gold: 75, wood: 0, stone: 0, source: 'MANSA_QUERY_GOLD' },
    MANSA_QUERY_STONE: { id: 'MANSA_QUERY_STONE', food: 0, gold: 0, wood: 0, stone: 75, source: 'MANSA_QUERY_STONE' },
    PIT_MINE: { id: 'PIT_MINE', food: 0, gold: 36, wood: 0, stone: 0, source: 'PIT_MINE' },
    PIT_MINE_HOUSE: { id: 'PIT_MINE_HOUSE', food: 0, gold: 7.5, wood: 0, stone: 0, source: 'PIT_MINE_HOUSE' },
    PIT_MINE_MINING_CAMP: { id: 'PIT_MINE_MINING_CAMP', food: 0, gold: 7.5, wood: 0, stone: 0, source: 'PIT_MINE_MINING_CAMP' },
    CATTLE_RANCH_CATTLE: { id: 'CATTLE_RANCH_CATTLE', food: 25, gold: 0, wood: 0, stone: 0, source: 'CATTLE_RANCH_CATTLE' },
    FULANI_CARROL_CATTLE: { id: 'FULANI_CARROL_CATTLE', food: 18, gold: 0, wood: 0, stone: 0, source: 'FULANI_CARROL_CATTLE' },
    HORTICULTURE_CATTLE: { id: 'HORTICULTURE_CATTLE', food: 2.5, gold: 0, wood: 0, stone: 0, source: 'CATTLE_RANCH_CATTLE' },
    FERTILIZATION_CATTLE: { id: 'FERTILIZATION_CATTLE', food: 2.5, gold: 0, wood: 0, stone: 0, source: 'CATTLE_RANCH_CATTLE' },
    CROSS_BREEDING_CATTLE: { id: 'CROSS_BREEDING_CATTLE', food: 2.5, gold: 0, wood: 0, stone: 0, source: 'CATTLE_RANCH_CATTLE' },
    // Ottomans
    SULTANHANI_TRADE_NETWORK: { id: 'SULTANHANI_TRADE_NETWORK', food: 0, gold: 24, wood: 0, stone: 0, source: 'SULTANHANI_TRADE_NETWORK' },
    // Sengoku Daimyo
    BOAR_YATAI: { id: 'BOAR_YATAI', food: 60, gold: 0, wood: 0, stone: 0, source: 'BOAR_YATAI' },
    DEER_YATAI: { id: 'DEER_YATAI', food: 48, gold: 0, wood: 0, stone: 0, source: 'DEER_YATAI' },
    BERRY_YATAI: { id: 'BERRY_YATAI', food: 36, gold: 0, wood: 0, stone: 0, source: 'BERRY_YATAI' },
    SHEEP_YATAI: { id: 'SHEEP_YATAI', food: 2, gold: 0, wood: 0, stone: 0, source: 'SHEEP_YATAI' },
    FARM_YATAI: { id: 'FARM_YATAI', food: 4, gold: 0, wood: 0, stone: 0, source: 'FARM_YATAI' },
    // Zhu Xi
    MEDITATION_GARDEN_BUSH: { id: 'MEDITATION_GARDEN_BUSH', food: 6, gold: 0, wood: 0, stone: 0, source: 'MEDITATION_GARDEN_BUSH' },
    MEDITATION_GARDEN_GOLD: { id: 'MEDITATION_GARDEN_GOLD', food: 0, gold: 25, wood: 0, stone: 0, source: 'MEDITATION_GARDEN_GOLD' },
    MEDITATION_GARDEN_STONE: { id: 'MEDITATION_GARDEN_STONE', food: 0, gold: 0, wood: 0, stone: 25, source: 'MEDITATION_GARDEN_STONE' },
    MEDITATION_GARDEN_TREE: { id: 'MEDITATION_GARDEN_TREE', food: 0, gold: 0, wood: 1, stone: 0, source: 'MEDITATION_GARDEN_TREE' }
};

const ALL_DYNAMIC_PASSIVE_INCOME_MODIFIERS = {
    PILGRIM: { id: 'PILGRIM', source: 'PILGRIM', food: 0, gold: 40, wood: 0, stone: 0 }
};

const ALL_LIMITED_FOOD_GATHERING_SOURCE_MODIFIERS = {
    TWIN_MINARET_MEDRESE: { id: 'TWIN_MINARET_MEDRESE', gatheringRateLimit: 262.5, foodSource: 'TWIN_MINARET_BERRY' }
};

const ALL_COST_MODIFIERS_PER_UNIT = {
    CONSECRATE: { id: 'CONSECRATE', apply: c => ({food:c.food*0.75,wood:c.wood,gold:c.gold,stone:c.stone}) },
    ORDINANCE_COMPANY: { id: 'ORDINANCE_COMPANY', apply: c => ({food:c.food*0.75,wood:c.wood*0.75,gold:c.gold*0.75,stone:c.stone}) }
};

// ---- Passive Income Sources per Civilization ----
// Defines which passive income sources (with counters) each civ can configure
const CIV_PASSIVE_INCOME_SOURCES = {
    ABBASID: [],
    CHINESE: [
        { id: 'PAGODA', label: 'Pagoda', modifiers: ['PAGODA'] }
    ],
    HRE: [],
    ENGLAND: [],
    DELHI: [],
    FRENCH: [],
    MONGOLS: [],
    RUS: [],
    OTTOMANS: [
        { id: 'SULTANHANI_TRADE_NETWORK', label: 'Sultanhani Trade Network', modifiers: ['SULTANHANI_TRADE_NETWORK'] }
    ],
    MALIANS: [
        { id: 'MANSA_QUERY_GOLD', label: 'Mansa Quarry (Gold)', modifiers: ['MANSA_QUERY_GOLD'] },
        { id: 'MANSA_QUERY_STONE', label: 'Mansa Quarry (Stone)', modifiers: ['MANSA_QUERY_STONE'] },
        { id: 'PIT_MINE', label: 'Pit Mine', modifiers: ['PIT_MINE'] },
        { id: 'PIT_MINE_HOUSE', label: 'Houses near Pit Mine', modifiers: ['PIT_MINE_HOUSE'] },
        { id: 'PIT_MINE_MINING_CAMP', label: 'Mining Camp near Pit Mine', modifiers: ['PIT_MINE_MINING_CAMP'] },
        { id: 'CATTLE_RANCH_CATTLE', label: 'Cattle (Ranch)', modifiers: ['CATTLE_RANCH_CATTLE'] },
        { id: 'FULANI_CARROL_CATTLE', label: 'Cattle (Fulani Corral)', modifiers: ['FULANI_CARROL_CATTLE'] }
    ],
    JEANNE_D_ARC: [],
    DRAGON_ORDER: [],
    ZHU_XIS_LEGACY: [
        { id: 'PAGODA', label: 'Pagoda', modifiers: ['PAGODA'] },
        { id: 'MEDITATION_GARDEN_BUSH', label: 'Meditation Garden (Bush)', modifiers: ['MEDITATION_GARDEN_BUSH'] },
        { id: 'MEDITATION_GARDEN_GOLD', label: 'Meditation Garden (Gold)', modifiers: ['MEDITATION_GARDEN_GOLD'] },
        { id: 'MEDITATION_GARDEN_STONE', label: 'Meditation Garden (Stone)', modifiers: ['MEDITATION_GARDEN_STONE'] },
        { id: 'MEDITATION_GARDEN_TREE', label: 'Meditation Garden (Tree)', modifiers: ['MEDITATION_GARDEN_TREE'] }
    ],
    AYYUBIDS: [],
    JAPANESE: [
        { id: 'YORISHIRO_FARM_HOUSE', label: 'Yorishiro Farm House', modifiers: ['YORISHIRO_FARM_HOUSE'] },
        { id: 'YORISHIRO_LUMBER_CAMP', label: 'Yorishiro Lumber Camp', modifiers: ['YORISHIRO_LUMBER_CAMP'] },
        { id: 'YORISHIRO_FORGE', label: 'Yorishiro Forge', modifiers: ['YORISHIRO_FORGE'] }
    ],
    BYZANTINES: [],
    KNIGHTS_TEMPLAR: [
        { id: 'PILGRIM', label: 'Pilgrim', modifiers: [] }
    ],
    HOUSE_OF_LANCASTER: [
        { id: 'MANOR', label: 'Manor', modifiers: ['MANOR'] },
        { id: 'MANOR_VILLAGER', label: 'Manor Villager', modifiers: ['MANOR_VILLAGER'] }
    ],
    GOLDEN_HORDE: [
        { id: 'STOCKYARD', label: 'Stockyard', modifiers: ['STOCKYARD_EDICT'] }
    ],
    MACEDONIAN_DYNASTY: [],
    SENGOKU_DAIMYO: [
        { id: 'BOAR_YATAI', label: 'Boar Yatai', modifiers: ['BOAR_YATAI'] },
        { id: 'DEER_YATAI', label: 'Deer Yatai', modifiers: ['DEER_YATAI'] },
        { id: 'BERRY_YATAI', label: 'Berry Yatai', modifiers: ['BERRY_YATAI'] },
        { id: 'SHEEP_YATAI', label: 'Sheep Yatai', modifiers: ['SHEEP_YATAI'] },
        { id: 'FARM_YATAI', label: 'Farm Yatai', modifiers: ['FARM_YATAI'] }
    ],
    TUGHLAQ_DYNASTY: []
};

// ---- Shared modifier definitions (reusable across civs) ----
const _muslimBerries = { id: 'MUSLIM_BERRIES', apply: (r, fs) => fs === 'BERRY' ? {...r, food: r.food*1.212} : r, description: 'Berries +21.2%' };
const _traderDiscount = { id: 'ABBASID_TRADER_DISCOUNT', canBeApplied: u => u.id === 'TRADER', apply: c => ({food:c.food*0.67,wood:c.wood*0.67,gold:c.gold*0.67,stone:c.stone*0.67}), description: 'Trader -33%' };
const _englishDocks = { id: 'ENGLISH_DOCKS', canBeApplied: u => u.building === 'DOCK', apply: c => ({food:c.food*0.9,wood:c.wood*0.9,gold:c.gold*0.9,stone:c.stone*0.9}), description: 'Ships -10%' };
const _schoolOfCavalry = { id: 'SCHOOL_OF_CAVALRY', canBeApplied: u => u.building === 'STABLE', productionSpeedBonus: 0.20, description: 'School of Cavalry +20%' };
const _granary = { id: 'GRANARY', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.12} : r, description: 'Granary farm +12%' };
const _chineseDocks = { id: 'CHINESE_DOCKS', canBeApplied: u => u.building === 'DOCK', productionSpeedBonus: 0.1, description: 'Docks +10%' };
const _japaneseFishingBoats = { id: 'JAPANESE_FISHING_BOATS', canBeApplied: u => u.id === 'FISHING_BOAT', apply: c => ({food:c.food*0.75,wood:c.wood*0.75,gold:c.gold*0.75,stone:c.stone*0.75}), description: 'Fishing Boat -25%' };

// Helper for military unit type filter
const _isMilitary = u => u.types && (u.types.includes(UnitType.INFANTRY) || u.types.includes(UnitType.CAVALRY) || u.types.includes(UnitType.SIEGE) || u.types.includes('TRANSPORT') || u.types.includes(UnitType.MILITARY_SHIP));

// ---- Civilization-specific modifier definitions ----

// English
const ENGLISH_MODIFIERS = {
    gatheringRate: {
        ENGLISH_DARK_AGE: { id: 'ENGLISH_DARK_AGE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.17} : r, description: 'Dark Age farm +17%' },
        ENGLISH_FEUDAL_AGE: { id: 'ENGLISH_FEUDAL_AGE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.20} : r, description: 'Feudal farm +20%' },
        ENGLISH_CASTLE_AGE: { id: 'ENGLISH_CASTLE_AGE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.24} : r, description: 'Castle farm +24%' },
        ENGLISH_IMPERIAL_AGE: { id: 'ENGLISH_IMPERIAL_AGE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.24} : r, description: 'Imperial farm +24%' }
    },
    productionSpeed: {
        ENGLISH_MMA: { id: 'ENGLISH_MMA', canBeApplied: u => u.id === 'MAN_AT_ARMS', productionSpeedBonus: 0.5, description: 'MaA +50%' }
    },
    costModifiers: {
        ENGLISH_DOCKS: _englishDocks
    },
    defaults: { gatheringRate: ['ENGLISH_DARK_AGE'], productionSpeed: ['ENGLISH_MMA'], costModifiers: ['ENGLISH_DOCKS'] }
};

// French
const FRENCH_MODIFIERS = {
    gatheringRate: {},
    productionSpeed: {
        FRENCH_DARK_AGE: { id: 'FRENCH_DARK_AGE', canBeApplied: u => u.building === 'STABLE', productionSpeedBonus: 0.05, description: 'Stable +5%' },
        FRENCH_FEUDAL_AGE: { id: 'FRENCH_FEUDAL_AGE', canBeApplied: u => u.building === 'STABLE', productionSpeedBonus: 0.10, description: 'Stable +10%' },
        FRENCH_CASTLE_AGE: { id: 'FRENCH_CASTLE_AGE', canBeApplied: u => u.building === 'STABLE', productionSpeedBonus: 0.15, description: 'Stable +15%' },
        FRENCH_IMPERIAL_AGE: { id: 'FRENCH_IMPERIAL_AGE', canBeApplied: u => u.building === 'STABLE', productionSpeedBonus: 0.20, description: 'Stable +20%' },
        SCHOOL_OF_CAVALRY: _schoolOfCavalry
    },
    costModifiers: {
        FRENCH_CASTLE: { id: 'FRENCH_CASTLE', canBeApplied: u => u.types?.includes(UnitType.CAVALRY), apply: c => ({food:c.food*0.8,wood:c.wood*0.8,gold:c.gold*0.8,stone:c.stone*0.8}), description: 'Cavalry -20%' }
    },
    defaults: { gatheringRate: [], productionSpeed: ['FRENCH_DARK_AGE'], costModifiers: [] }
};

// Abbasid Dynasty
const ABBASID_MODIFIERS = {
    gatheringRate: {
        MUSLIM_BERRIES: _muslimBerries,
        GOLDEN_AGE_1: { id: 'GOLDEN_AGE_1', apply: r => ({food:r.food*1.1,wood:r.wood*1.1,gold:r.gold*1.1,stone:r.stone*1.1}), description: 'Golden Age I: all +10%' },
        GOLDEN_AGE_2: { id: 'GOLDEN_AGE_2', apply: r => ({food:r.food*1.1,wood:r.wood*1.1,gold:r.gold*1.1,stone:r.stone*1.1}), description: 'Golden Age II: all +10%' },
        GOLDEN_AGE_3_GR: { id: 'GOLDEN_AGE_3_GR', apply: r => ({food:r.food*1.155,wood:r.wood*1.155,gold:r.gold*1.155,stone:r.stone*1.155}), description: 'Golden Age III: all +15.5%' },
        AGRICULTURE: { id: 'AGRICULTURE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.1} : r, description: 'Agriculture: farm +10%' }
    },
    productionSpeed: {
        GOLDEN_AGE_3: { id: 'GOLDEN_AGE_3', canBeApplied: () => true, productionSpeedBonus: 0.2, description: 'Golden Age III: prod +20%' }
    },
    costModifiers: {
        ABBASID_TRADER_DISCOUNT: _traderDiscount,
        FRESH_FOOD: { id: 'FRESH_FOOD', canBeApplied: u => u.id === 'VILLAGER', apply: c => ({food:c.food*0.6,wood:c.wood,gold:c.gold,stone:c.stone}), description: 'Villager food -40%' }
    },
    defaults: { gatheringRate: ['MUSLIM_BERRIES'], productionSpeed: [], costModifiers: ['ABBASID_TRADER_DISCOUNT'] }
};

// Chinese
const CHINESE_MODIFIERS = {
    gatheringRate: {
        GRANARY: _granary
    },
    productionSpeed: {
        SONG_DYNASTY: { id: 'SONG_DYNASTY', canBeApplied: u => u.id === 'VILLAGER', productionSpeedBonus: 0.33, description: 'Song Dynasty: Villager +33%' },
        CHINESE_DOCKS: _chineseDocks
    },
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: ['CHINESE_DOCKS'], costModifiers: [] }
};

// Delhi Sultanate
const DELHI_MODIFIERS = {
    gatheringRate: {
        MUSLIM_BERRIES: _muslimBerries
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: ['MUSLIM_BERRIES'], productionSpeed: [], costModifiers: [] }
};

// Holy Roman Empire (HRE) - uses Regnitz Cathedral (same as standard relics)
const HRE_MODIFIERS = {
    gatheringRate: {},
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Mongols
const MONGOLS_MODIFIERS = {
    gatheringRate: {
        IMPROVED_DOUBLE_BROADAX: { id: 'IMPROVED_DOUBLE_BROADAX', apply: (r, fs, ids) => {
            const mult = ids.includes('DOUBLE_BROADAX') ? 1.16 : 1.1*1.16;
            return {...r, wood: r.wood*mult};
        }, description: 'Improved Double Broadax: wood +16%/+28%' },
        IMPROVED_HORTICULTURE: { id: 'IMPROVED_HORTICULTURE', apply: (r, fs, ids) => {
            if (!['SHEEP','CATTLE','BERRY','FARM'].includes(fs)) return r;
            const mult = ids.includes('HORTICULTURE') ? 1.16 : 1.08*1.16;
            return {...r, food: r.food*mult};
        }, description: 'Improved Horticulture: food +16%/+25%' },
        IMPROVED_SPECIALIZED_PICK: { id: 'IMPROVED_SPECIALIZED_PICK', apply: (r, fs, ids) => {
            const mult = ids.includes('SPECIALIZED_PICK') ? 1.16 : 1.12*1.16;
            return {...r, gold: r.gold*mult, stone: r.stone*mult};
        }, description: 'Improved Specialized Pick: gold/stone +16%/+30%' }
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Rus
const RUS_MODIFIERS = {
    gatheringRate: {
        BOUNTY_100: { id: 'BOUNTY_100', apply: r => ({...r, food: r.food*1.03}), description: 'Bounty 100: food +3%' },
        BOUNTY_250: { id: 'BOUNTY_250', apply: r => ({...r, food: r.food*1.07}), description: 'Bounty 250: food +7%' },
        BOUNTY_500: { id: 'BOUNTY_500', apply: r => ({...r, food: r.food*1.11}), description: 'Bounty 500: food +11%' }
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Ottomans
const OTTOMANS_MODIFIERS = {
    gatheringRate: {
        ANATOLIAN_HILLS: { id: 'ANATOLIAN_HILLS', apply: r => ({...r, gold: r.gold*1.1, stone: r.stone*1.1}), description: 'Anatolian Hills: gold/stone +10%' }
    },
    productionSpeed: {
        OTTOMANS_BLACKSMITH_AGE_2: { id: 'OTTOMANS_BLACKSMITH_AGE_2', canBeApplied: _isMilitary, productionSpeedBonus: 0.2, description: 'Blacksmith II: military +20%' },
        OTTOMANS_BLACKSMITH_AGE_3: { id: 'OTTOMANS_BLACKSMITH_AGE_3', canBeApplied: _isMilitary, productionSpeedBonus: 0.3, description: 'Blacksmith III: military +30%' },
        OTTOMANS_BLACKSMITH_AGE_4: { id: 'OTTOMANS_BLACKSMITH_AGE_4', canBeApplied: _isMilitary, productionSpeedBonus: 0.4, description: 'Blacksmith IV: military +40%' },
        ISTANBUL_OBSERVATORY: { id: 'ISTANBUL_OBSERVATORY', canBeApplied: _isMilitary, productionSpeedBonus: 1.0, description: 'Istanbul Observatory: military +100%' }
    },
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Malians
const MALIANS_MODIFIERS = {
    gatheringRate: {},
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Jeanne d'Arc
const JEANNE_D_ARC_MODIFIERS = {
    gatheringRate: {},
    productionSpeed: {
        SCHOOL_OF_CAVALRY: _schoolOfCavalry
    },
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Order of the Dragon
const DRAGON_ORDER_MODIFIERS = {
    gatheringRate: {
        DRAGON_VILLAGER: { id: 'DRAGON_VILLAGER', apply: (r, fs) => {
            let fm = 1;
            if (fs === 'BERRY' || fs === 'DEER') fm = 1.045;
            else if (fs === 'SHEEP' || fs === 'FARM') fm = 1.015;
            return { food: r.food*(fm+0.21), wood: r.wood*1.215, gold: r.gold*1.245, stone: r.stone*1.245 };
        }, description: 'Dragon Villager: all resources boosted' }
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: ['DRAGON_VILLAGER'], productionSpeed: [], costModifiers: [] }
};

// Zhu Xi's Legacy
const ZHU_XIS_LEGACY_MODIFIERS = {
    gatheringRate: {
        GRANARY: _granary
    },
    productionSpeed: {
        CHINESE_DOCKS: _chineseDocks
    },
    costModifiers: {
        ZHU_XIS_LEGACY_YUAN_DYNASTY: { id: 'ZHU_XIS_LEGACY_YUAN_DYNASTY', canBeApplied: () => true, apply: c => ({food:c.food*0.9,wood:c.wood*0.9,gold:c.gold*0.9,stone:c.stone*0.9}), description: 'Yuan Dynasty: all -10%' }
    },
    defaults: { gatheringRate: [], productionSpeed: ['CHINESE_DOCKS'], costModifiers: [] }
};

// Ayyubids
const AYYUBIDS_MODIFIERS = {
    gatheringRate: {
        MUSLIM_BERRIES: _muslimBerries,
        AYYUBIDS_GOLDEN_AGE_1: { id: 'AYYUBIDS_GOLDEN_AGE_1', apply: r => ({food:r.food*1.067,wood:r.wood*1.067,gold:r.gold*1.067,stone:r.stone*1.067}), description: 'Golden Age I: all +6.7%' }
    },
    productionSpeed: {
        AYYUBIDS_GOLDEN_AGE_3: { id: 'AYYUBIDS_GOLDEN_AGE_3', canBeApplied: () => true, productionSpeedBonus: 0.2, description: 'Golden Age III: prod +20%' }
    },
    costModifiers: {
        ABBASID_TRADER_DISCOUNT: _traderDiscount,
        AYYUBIDS_GOLDEN_AGE_4: { id: 'AYYUBIDS_GOLDEN_AGE_4', canBeApplied: u => u.types?.includes(UnitType.SIEGE), apply: c => ({food:c.food*0.8,wood:c.wood*0.8,gold:c.gold*0.8,stone:c.stone*0.8}), description: 'Golden Age IV: siege -20%' }
    },
    defaults: { gatheringRate: ['MUSLIM_BERRIES'], productionSpeed: [], costModifiers: ['ABBASID_TRADER_DISCOUNT'] }
};

// Japanese
const JAPANESE_MODIFIERS = {
    gatheringRate: {
        DAIMYO_MANOR: { id: 'DAIMYO_MANOR', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.16} : r, description: 'Daimyo Manor: farm +16%' },
        DAIMYO_PALACE: { id: 'DAIMYO_PALACE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.32} : r, description: 'Daimyo Palace: farm +32%' },
        SHOGUNATE_CASTLE: { id: 'SHOGUNATE_CASTLE', apply: (r, fs) => fs === 'FARM' ? {...r, food: r.food*1.48} : r, description: 'Shogunate Castle: farm +48%' }
    },
    productionSpeed: {},
    costModifiers: {
        JAPANESE_FISHING_BOATS: _japaneseFishingBoats
    },
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: ['JAPANESE_FISHING_BOATS'] }
};

// Byzantines
const BYZANTINES_MODIFIERS = {
    gatheringRate: {
        CISTERN_LEVEL_1: { id: 'CISTERN_LEVEL_1', apply: r => ({food:r.food*1.067,wood:r.wood*1.067,gold:r.gold*1.067,stone:r.stone*1.067}), description: 'Cistern Lv1: all +6.7%' },
        CISTERN_LEVEL_2: { id: 'CISTERN_LEVEL_2', apply: r => ({food:r.food*1.093,wood:r.wood*1.093,gold:r.gold*1.093,stone:r.stone*1.093}), description: 'Cistern Lv2: all +9.3%' },
        CISTERN_LEVEL_3: { id: 'CISTERN_LEVEL_3', apply: r => ({food:r.food*1.12,wood:r.wood*1.12,gold:r.gold*1.12,stone:r.stone*1.12}), description: 'Cistern Lv3: all +12%' },
        CISTERN_LEVEL_4: { id: 'CISTERN_LEVEL_4', apply: r => ({food:r.food*1.146,wood:r.wood*1.146,gold:r.gold*1.146,stone:r.stone*1.146}), description: 'Cistern Lv4: all +14.6%' },
        CISTERN_LEVEL_5: { id: 'CISTERN_LEVEL_5', apply: r => ({food:r.food*1.173,wood:r.wood*1.173,gold:r.gold*1.173,stone:r.stone*1.173}), description: 'Cistern Lv5: all +17.3%' }
    },
    productionSpeed: {
        CONSCRIPTIO_1: { id: 'CONSCRIPTIO_1', canBeApplied: _isMilitary, productionSpeedBonus: 0.2, description: 'Conscriptio I: +20%' },
        CONSCRIPTIO_2: { id: 'CONSCRIPTIO_2', canBeApplied: _isMilitary, productionSpeedBonus: 0.4, description: 'Conscriptio II: +40%' },
        CONSCRIPTIO_3: { id: 'CONSCRIPTIO_3', canBeApplied: _isMilitary, productionSpeedBonus: 0.6, description: 'Conscriptio III: +60%' },
        CONSCRIPTIO_4: { id: 'CONSCRIPTIO_4', canBeApplied: _isMilitary, productionSpeedBonus: 0.8, description: 'Conscriptio IV: +80%' },
        CONSCRIPTIO_5: { id: 'CONSCRIPTIO_5', canBeApplied: _isMilitary, productionSpeedBonus: 1.0, description: 'Conscriptio V: +100%' }
    },
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Knights Templar
const KNIGHTS_TEMPLAR_MODIFIERS = {
    gatheringRate: {
        KNIGHTS_TEMPLAR_DARK_AGE: { id: 'KNIGHTS_TEMPLAR_DARK_AGE', apply: r => ({...r, wood: r.wood*1.0403}), description: 'Dark Age: wood +4%' },
        KNIGHTS_TEMPLAR_FEUDAL_AGE: { id: 'KNIGHTS_TEMPLAR_FEUDAL_AGE', apply: r => ({...r, wood: r.wood*1.1822}), description: 'Feudal: wood +18%' },
        KNIGHTS_TEMPLAR_CASTLE_AGE: { id: 'KNIGHTS_TEMPLAR_CASTLE_AGE', apply: r => ({...r, wood: r.wood*1.1497}), description: 'Castle: wood +15%' },
        KNIGHTS_TEMPLAR_IMPERIAL_AGE: { id: 'KNIGHTS_TEMPLAR_IMPERIAL_AGE', apply: r => ({...r, wood: r.wood*1.1406}), description: 'Imperial: wood +14%' }
    },
    productionSpeed: {
        KINGDOM_OF_FRANCE: { id: 'KINGDOM_OF_FRANCE', canBeApplied: _isMilitary, productionSpeedBonus: 0.15, description: 'Kingdom of France: military +15%' }
    },
    costModifiers: {
        KNIGHTS_TEMPLAR_SIEGE: { id: 'KNIGHTS_TEMPLAR_SIEGE', canBeApplied: u => u.types?.includes(UnitType.SIEGE), apply: c => ({food:c.food,wood:c.wood*0.75,gold:c.gold,stone:c.stone}), description: 'Siege wood -25%' },
        KINGDOM_OF_FRANCE_COST: { id: 'KINGDOM_OF_FRANCE_COST', canBeApplied: _isMilitary, apply: c => ({food:c.food,wood:c.wood,gold:c.gold*0.95,stone:c.stone}), description: 'Military gold -5%' }
    },
    disabledCommonMods: ['DOUBLE_BROADAX', 'LUMBER_PRESERVATION', 'CROSSCUT_SAW'],
    defaults: { gatheringRate: ['KNIGHTS_TEMPLAR_DARK_AGE'], productionSpeed: [], costModifiers: ['KNIGHTS_TEMPLAR_SIEGE'] }
};

// House of Lancaster
const HOUSE_OF_LANCASTER_MODIFIERS = {
    gatheringRate: {
        HOUSE_OF_LANCASTER_SHEEP: { id: 'HOUSE_OF_LANCASTER_SHEEP', apply: (r, fs) => fs === 'SHEEP' ? {...r, food: r.food*1.2} : r, description: 'Sheep +20%' }
    },
    productionSpeed: {},
    costModifiers: {
        ENGLISH_DOCKS: _englishDocks,
        BURGUNDIANS_IMPORTS: { id: 'BURGUNDIANS_IMPORTS', canBeApplied: u => u.id === 'HANDCANNONEER', apply: c => ({food:c.food*0.75,wood:c.wood*0.75,gold:c.gold*0.75,stone:c.stone*0.75}), description: 'Handcannoneer -25%' }
    },
    defaults: { gatheringRate: ['HOUSE_OF_LANCASTER_SHEEP'], productionSpeed: [], costModifiers: ['ENGLISH_DOCKS'] }
};

// Golden Horde
const GOLDEN_HORDE_MODIFIERS = {
    gatheringRate: {
        ROTATION_GRAZING: { id: 'ROTATION_GRAZING', apply: (r, fs) => fs === 'STOCKYARD' ? {...r, food: r.food*1.097} : r, description: 'Rotation Grazing: stockyard +10%' },
        OVER_GRAZING: { id: 'OVER_GRAZING', apply: (r, fs) => fs === 'STOCKYARD' ? {...r, food: r.food*1.095} : r, description: 'Over Grazing: stockyard +10%' }
    },
    productionSpeed: {
        PRODUCTION_SPEED_EDICT: { id: 'PRODUCTION_SPEED_EDICT', canBeApplied: _isMilitary, productionSpeedBonus: 0.2, description: 'Edict: military +20%' },
        INCREASED_SUPPLIES: { id: 'INCREASED_SUPPLIES', canBeApplied: _isMilitary, productionSpeedBonus: 0.5, description: 'Increased Supplies: military +50%' }
    },
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: ['PRODUCTION_SPEED_EDICT'], costModifiers: [] }
};

// Macedonian Dynasty
const MACEDONIAN_DYNASTY_MODIFIERS = {
    gatheringRate: {
        MACEDONIAN_DYNASTY_GRAND_WINERY: { id: 'MACEDONIAN_DYNASTY_GRAND_WINERY', apply: r => ({...r, food: r.food*1.23}), description: 'Grand Winery: food +23%' }
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

// Sengoku Daimyo
const SENGOKU_DAIMYO_MODIFIERS = {
    gatheringRate: {},
    productionSpeed: {},
    costModifiers: {
        JAPANESE_FISHING_BOATS: _japaneseFishingBoats
    },
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: ['JAPANESE_FISHING_BOATS'] }
};

// Tughlaq Dynasty
const TUGHLAQ_DYNASTY_MODIFIERS = {
    gatheringRate: {
        MUSLIM_BERRIES: _muslimBerries,
        TUGHLAQ_ECO_1: { id: 'TUGHLAQ_ECO_1', apply: r => ({food:r.food*1.0385,wood:r.wood*1.032,gold:r.gold*1.0385,stone:r.stone*1.0385}), description: 'Eco upgrade I: all +3-4%' },
        TUGHLAQ_ECO_2: { id: 'TUGHLAQ_ECO_2', apply: r => ({food:r.food*1.0385,wood:r.wood*1.032,gold:r.gold*1.0385,stone:r.stone*1.0385}), description: 'Eco upgrade II: all +3-4%' },
        TUGHLAQ_ECO_3: { id: 'TUGHLAQ_ECO_3', apply: r => ({food:r.food*1.0385,wood:r.wood*1.032,gold:r.gold*1.0385,stone:r.stone*1.0385}), description: 'Eco upgrade III: all +3-4%' }
    },
    productionSpeed: {},
    costModifiers: {},
    defaults: { gatheringRate: ['MUSLIM_BERRIES'], productionSpeed: [], costModifiers: [] }
};

// ---- Civilization Modifiers Registry ----
const CIV_MODIFIERS = {
    ENGLAND: ENGLISH_MODIFIERS,
    FRENCH: FRENCH_MODIFIERS,
    ABBASID: ABBASID_MODIFIERS,
    CHINESE: CHINESE_MODIFIERS,
    DELHI: DELHI_MODIFIERS,
    HRE: HRE_MODIFIERS,
    MONGOLS: MONGOLS_MODIFIERS,
    RUS: RUS_MODIFIERS,
    OTTOMANS: OTTOMANS_MODIFIERS,
    MALIANS: MALIANS_MODIFIERS,
    JEANNE_D_ARC: JEANNE_D_ARC_MODIFIERS,
    DRAGON_ORDER: DRAGON_ORDER_MODIFIERS,
    ZHU_XIS_LEGACY: ZHU_XIS_LEGACY_MODIFIERS,
    AYYUBIDS: AYYUBIDS_MODIFIERS,
    JAPANESE: JAPANESE_MODIFIERS,
    BYZANTINES: BYZANTINES_MODIFIERS,
    KNIGHTS_TEMPLAR: KNIGHTS_TEMPLAR_MODIFIERS,
    HOUSE_OF_LANCASTER: HOUSE_OF_LANCASTER_MODIFIERS,
    GOLDEN_HORDE: GOLDEN_HORDE_MODIFIERS,
    MACEDONIAN_DYNASTY: MACEDONIAN_DYNASTY_MODIFIERS,
    SENGOKU_DAIMYO: SENGOKU_DAIMYO_MODIFIERS,
    TUGHLAQ_DYNASTY: TUGHLAQ_DYNASTY_MODIFIERS,
};

// Default empty modifiers for civs without specific ones
const EMPTY_MODIFIERS = {
    gatheringRate: {}, productionSpeed: {}, costModifiers: {},
    defaults: { gatheringRate: [], productionSpeed: [], costModifiers: [] }
};

function getCivModifiers(civ) {
    return CIV_MODIFIERS[civ] || EMPTY_MODIFIERS;
}

function getCivPassiveIncomeSources(civ) {
    return CIV_PASSIVE_INCOME_SOURCES[civ] || [];
}
