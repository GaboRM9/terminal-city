export type Lang = 'en' | 'es';

// ─── UI string catalogue ──────────────────────────────────────────────────────
// Keep keys alphabetical within each section.

export const UI = {
  en: {
    // ── App shell ──
    appTitle:   'TERMINAL CITY v0.1',
    appSubtitle: '— console city builder',
    tickCount:  (n: number, tiles: number) => `Tick #${n} | ${tiles} tiles`,
    panels: {
      pixelgram: '◆ PIXELGRAM',
      livestats: '◈ LIVESTATS',
      charts:    '▲ CHARTS',
    },

    // ── Victory overlay ──
    victoryTitle:    '⭐ CITY CHARTER ⭐',
    victoryLine1:    'Terminal City has reached official',
    victoryLine2:    'CITY status.',
    victoryYear:     (y: number) => `Year ${y}`,
    victoryCitizens: (p: number) => `${p.toLocaleString()} citizens`,
    victoryHappiness:(h: number) => `Happiness: ${h}%`,
    victoryBalance:  (b: number) => `Balance: $${b.toLocaleString()}`,
    victoryContinue: 'Keep growing',
    victoryPause:    'Pause',

    // ── Status panel ──
    statusYear:   'Year',
    statusMonth:  'M',
    statusDemand: 'DEMAND',
    statusPaused: '⏸ PAUSED',
    statusSpeed:  (s: number | string) => `▶ x${s}`,

    // ── Build catalog ──
    catZones:      'ZONES',
    catServices:   'SERVICES',
    catRoads:      'ROADS',
    catProduction: 'PRODUCTION',
    catDemolish:   'DEMOLISH',
    free:          'free',
    toolLabel:     'Tool:',
    roadClickOrigin: ' — Click origin point',
    roadClickDest:   ' — Click destination',
    roadTipHow:    'How to use:',
    roadTipSteps:  ['1. Select Road', '2. Click start point', '3. Click destination'],
    roadTipCost:   'Cost: $10/tile',
    zones: {
      'residential-low':    'Res. Low',
      'residential-medium': 'Res. Med.',
      'residential-high':   'Res. High',
      'commercial-low':     'Com. Low',
      'commercial-medium':  'Com. Med.',
      'commercial-high':    'Com. High',
      'industrial-light':   'Ind. Light',
      'industrial-medium':  'Ind. Med.',
      'industrial-heavy':   'Ind. Heavy',
      farm:                 'Farm',
      park:                 'Park',
      empty:                'Clear',
      power_plant:          'Power Plant',
      water_pump:           'Water Pump',
      fire_station:         'Fire Dept.',
      police_station:       'Police',
      hospital:             'Hospital',
      school:               'School',
      university:           'University',
      waste_plant:          'Waste Plant',
      road:                 'Road',
      avenue:               'Avenue',
      highway:              'Highway',
      granary:              'Granary',
      mill:                 'Mill',
      bakery:               'Bakery',
      iron_mine:            'Iron Mine',
      foundry:              'Foundry',
      tools_workshop:       'Workshop',
      demolish:             'Demolish',
    } as Record<string, string>,

    // ── Command console ──
    consoleHeader:  'COMMANDS',
    consoleHint:    '↑↓ history · Tab complete',
    consoleEmpty:   'Type "help" to see available commands.',
    inputPlaceholder: 'help · zone · road · build · tax · next…',
    pixelgramOn:    'Pixelgram activated.',
    pixelgramOff:   'LiveStats activated.',
    chartsOn:       'Charts panel activated.',
    paintOff:       'Paint mode deactivated.',
    savesHeader:    '=== SAVE SLOTS ===',
    saveSlotEmpty:  (s: number) => `  Slot ${s}: [empty]`,
    saveSlotFull:   (s: number, y?: number, m?: number, p?: number, b?: number) =>
      `  Slot ${s}: Year ${y}, Month ${m} · Pop. ${p} · $${b}`,
    unknownCmd:     (n: string) => `Unknown command: "${n}". Type "help" for commands.`,
    noCommand:      'Type a command.',
    internalError:  (msg: string) => `Internal error: ${msg}`,

    // ── Event log ──
    simHeader:   'SIMULATION',
    simEvents:   (n: number) => `${n} events`,

    // ── Charts panel ──
    chartsTitle:     (n: number) => `CHARTS — last ${n} months`,
    chartsNeedMore:  'Advance at least 2 months to see charts.',
    chartEconomy:    'ECONOMY',
    chartCity:       'CITY',
    chartRCI:        'RCI DEMAND',
    chartBalance:    'Balance',
    chartIncome:     'Income',
    chartExpenses:   'Expenses',
    chartPopulation: 'Population',
    chartHappiness:  'Happiness',
    chartResidential:'Residential R',
    chartCommercial: 'Commercial C',
    chartIndustrial: 'Industrial I',

    // ── Pixelgram ──
    pixelgramTitle:  'PIXELGRAM',
    pixelgramSub:    'pixel social network',
    pixelgramPosts:  'posts',
    pixelgramPixels: 'pixels',
    pixelgramWait:   'Pixelgram starts when the simulation begins.',

    // ── Main menu ──
    subtitle:      'console city builder · v0.1',
    newCity:       'New City',
    loadCity:      'Load City',
    options:       'Options',
    noSaves:       'no saves',
    newCityTitle:  '── NEW CITY ──',
    cityNameLabel: 'CITY NAME',
    startBtn:      '[ ENTER ] Start',
    backBtn:       '[ ESC ] Back',
    loadTitle:     '── LOAD CITY ──',
    autosave:      'SLOT 0 · Autosave',
    slot:          'SLOT',
    empty:         '[empty]',
    yearLabel:     'Year',
    pop:           'pop',
    loadHint:      '↑↓ navigate · ENTER load · ESC back',
    optionsTitle:  '── OPTIONS ──',
    optVersion:    'Version',
    optEngine:     'Engine',
    optEngineVal:  'Tick-based · ~3 s/month',
    optAutosave:   'Autosave',
    optAutosaveVal:'Every 12 ticks',
    optSaveSlots:  'Save slots',
    optResolution: 'Resolution',
    optLanguage:   'Language',
    comingSoon:    'More options coming soon',
    controls:      'IN-GAME CONTROLS',
    ctrlRows: [
      ['help',                    'list all commands'],
      ['build road / zone',       'build on the map'],
      ['speed 1/2/3 · pause',    'control speed'],
      ['save [0-2] · load [0-2]','save / load'],
      ['undo',                    'undo last action'],
    ] as [string, string][],
    footerHint:    '↑↓ navigate · ENTER select · N L O quick access',
    welcome:       (name: string) => `Welcome to ${name}. Type "help" to see available commands.`,
    timestamp:     'Year 1, Month 01',
  },

  es: {
    // ── App shell ──
    appTitle:   'TERMINAL CITY v0.1',
    appSubtitle: '— city builder de consola',
    tickCount:  (n: number, tiles: number) => `Tick #${n} | ${tiles} tiles`,
    panels: {
      pixelgram: '◆ PIXELGRAM',
      livestats: '◈ LIVESTATS',
      charts:    '▲ GRÁFICOS',
    },

    // ── Victory overlay ──
    victoryTitle:    '⭐ CARTA DE CIUDAD ⭐',
    victoryLine1:    'Terminal City ha alcanzado el estatus',
    victoryLine2:    'oficial de CIUDAD.',
    victoryYear:     (y: number) => `Año ${y}`,
    victoryCitizens: (p: number) => `${p.toLocaleString()} ciudadanos`,
    victoryHappiness:(h: number) => `Felicidad: ${h}%`,
    victoryBalance:  (b: number) => `Balance: $${b.toLocaleString()}`,
    victoryContinue: 'Continuar creciendo',
    victoryPause:    'Pausar',

    // ── Status panel ──
    statusYear:   'Año',
    statusMonth:  'M',
    statusDemand: 'DEMANDA',
    statusPaused: '⏸ PAUSA',
    statusSpeed:  (s: number | string) => `▶ x${s}`,

    // ── Build catalog ──
    catZones:      'ZONAS',
    catServices:   'SERVICIOS',
    catRoads:      'VÍAS',
    catProduction: 'PRODUCCIÓN',
    catDemolish:   'DEMOLER',
    free:          'gratis',
    toolLabel:     'Herramienta:',
    roadClickOrigin: ' — Haz click en el origen',
    roadClickDest:   ' — Haz click en el destino',
    roadTipHow:    'Cómo usar:',
    roadTipSteps:  ['1. Selecciona Carretera', '2. Click en el punto de inicio', '3. Click en el destino'],
    roadTipCost:   'Costo: $10/tile',
    zones: {
      'residential-low':    'Res. Baja',
      'residential-medium': 'Res. Media',
      'residential-high':   'Res. Alta',
      'commercial-low':     'Com. Baja',
      'commercial-medium':  'Com. Media',
      'commercial-high':    'Com. Alta',
      'industrial-light':   'Ind. Ligera',
      'industrial-medium':  'Ind. Media',
      'industrial-heavy':   'Ind. Pesada',
      farm:                 'Granja',
      park:                 'Parque',
      empty:                'Vaciar',
      power_plant:          'Planta Eléctrica',
      water_pump:           'Bomba de Agua',
      fire_station:         'Bomberos',
      police_station:       'Policía',
      hospital:             'Hospital',
      school:               'Escuela',
      university:           'Universidad',
      waste_plant:          'Planta Residuos',
      road:                 'Carretera',
      avenue:               'Avenida',
      highway:              'Autopista',
      granary:              'Granero',
      mill:                 'Molino',
      bakery:               'Panadería',
      iron_mine:            'Mina de Hierro',
      foundry:              'Fundición',
      tools_workshop:       'Taller',
      demolish:             'Demoler',
    } as Record<string, string>,

    // ── Command console ──
    consoleHeader:  'COMANDOS',
    consoleHint:    '↑↓ historial · Tab completa',
    consoleEmpty:   'Escribe "help" para ver los comandos disponibles.',
    inputPlaceholder: 'help · zone · road · build · tax · next turn…',
    pixelgramOn:    'Pixelgram activado.',
    pixelgramOff:   'LiveStats activado.',
    chartsOn:       'Panel de gráficos activado.',
    paintOff:       'Modo pintura desactivado.',
    savesHeader:    '=== RANURAS DE GUARDADO ===',
    saveSlotEmpty:  (s: number) => `  Ranura ${s}: [vacía]`,
    saveSlotFull:   (s: number, y?: number, m?: number, p?: number, b?: number) =>
      `  Ranura ${s}: Año ${y}, Mes ${m} · Pob. ${p} · $${b}`,
    unknownCmd:     (n: string) => `Comando desconocido: "${n}". Escribe "help" para ver los comandos.`,
    noCommand:      'Escribe un comando.',
    internalError:  (msg: string) => `Error interno: ${msg}`,

    // ── Event log ──
    simHeader:   'SIMULACIÓN',
    simEvents:   (n: number) => `${n} eventos`,

    // ── Charts panel ──
    chartsTitle:     (n: number) => `GRÁFICOS — últimos ${n} meses`,
    chartsNeedMore:  'Avanza al menos 2 meses para ver gráficos.',
    chartEconomy:    'ECONOMÍA',
    chartCity:       'CIUDAD',
    chartRCI:        'DEMANDA RCI',
    chartBalance:    'Balance',
    chartIncome:     'Ingresos',
    chartExpenses:   'Gastos',
    chartPopulation: 'Población',
    chartHappiness:  'Felicidad',
    chartResidential:'Residencial R',
    chartCommercial: 'Comercial C',
    chartIndustrial: 'Industrial I',

    // ── Pixelgram ──
    pixelgramTitle:  'PIXELGRAM',
    pixelgramSub:    'red social de los píxels',
    pixelgramPosts:  'posts',
    pixelgramPixels: 'píxels',
    pixelgramWait:   'Pixelgram arranca cuando la simulación comienza.',

    // ── Main menu ──
    subtitle:      'city builder de consola · v0.1',
    newCity:       'Nueva Ciudad',
    loadCity:      'Cargar Ciudad',
    options:       'Opciones',
    noSaves:       'sin partidas',
    newCityTitle:  '── NUEVA CIUDAD ──',
    cityNameLabel: 'NOMBRE DE LA CIUDAD',
    startBtn:      '[ ENTER ] Comenzar',
    backBtn:       '[ ESC ] Volver',
    loadTitle:     '── CARGAR CIUDAD ──',
    autosave:      'RANURA 0 · Autoguardado',
    slot:          'RANURA',
    empty:         '[vacía]',
    yearLabel:     'Año',
    pop:           'hab',
    loadHint:      '↑↓ navegar · ENTER cargar · ESC volver',
    optionsTitle:  '── OPCIONES ──',
    optVersion:    'Versión',
    optEngine:     'Motor',
    optEngineVal:  'Tick-based · ~3 s/mes',
    optAutosave:   'Guardado',
    optAutosaveVal:'Automático cada 12 ticks',
    optSaveSlots:  'Ranuras de guardado',
    optResolution: 'Resolución',
    optLanguage:   'Idioma',
    comingSoon:    'Más opciones próximamente',
    controls:      'CONTROLES EN JUEGO',
    ctrlRows: [
      ['help',                    'lista de comandos'],
      ['build road / zone',       'construir en el mapa'],
      ['speed 1/2/3 · pause',    'controlar velocidad'],
      ['save [0-2] · load [0-2]','guardar / cargar'],
      ['undo',                    'deshacer última acción'],
    ] as [string, string][],
    footerHint:    '↑↓ navegar · ENTER seleccionar · N C O acceso rápido',
    welcome:       (name: string) => `Bienvenido a ${name}. Escribe "help" para ver los comandos disponibles.`,
    timestamp:     'Año 1, Mes 01',
  },
} satisfies Record<Lang, UIStrings>;

export interface UIStrings {
  appTitle: string; appSubtitle: string;
  tickCount: (n: number, tiles: number) => string;
  panels: { pixelgram: string; livestats: string; charts: string };
  victoryTitle: string; victoryLine1: string; victoryLine2: string;
  victoryYear: (y: number) => string; victoryCitizens: (p: number) => string;
  victoryHappiness: (h: number) => string; victoryBalance: (b: number) => string;
  victoryContinue: string; victoryPause: string;
  statusYear: string; statusMonth: string; statusDemand: string; statusPaused: string;
  statusSpeed: (s: number | string) => string;
  catZones: string; catServices: string; catRoads: string; catProduction: string; catDemolish: string;
  free: string; toolLabel: string; roadClickOrigin: string; roadClickDest: string;
  roadTipHow: string; roadTipSteps: readonly string[]; roadTipCost: string;
  zones: Record<string, string>;
  consoleHeader: string; consoleHint: string; consoleEmpty: string; inputPlaceholder: string;
  pixelgramOn: string; pixelgramOff: string; chartsOn: string; paintOff: string;
  savesHeader: string;
  saveSlotEmpty: (s: number) => string;
  saveSlotFull: (s: number, y?: number, m?: number, p?: number, b?: number) => string;
  unknownCmd: (n: string) => string; noCommand: string; internalError: (msg: string) => string;
  simHeader: string; simEvents: (n: number) => string;
  chartsTitle: (n: number) => string; chartsNeedMore: string;
  chartEconomy: string; chartCity: string; chartRCI: string;
  chartBalance: string; chartIncome: string; chartExpenses: string;
  chartPopulation: string; chartHappiness: string;
  chartResidential: string; chartCommercial: string; chartIndustrial: string;
  pixelgramTitle: string; pixelgramSub: string; pixelgramPosts: string;
  pixelgramPixels: string; pixelgramWait: string;
  subtitle: string; newCity: string; loadCity: string; options: string; noSaves: string;
  newCityTitle: string; cityNameLabel: string; startBtn: string; backBtn: string;
  loadTitle: string; autosave: string; slot: string; empty: string;
  yearLabel: string; pop: string; loadHint: string;
  optionsTitle: string; optVersion: string; optEngine: string; optEngineVal: string;
  optAutosave: string; optAutosaveVal: string; optSaveSlots: string;
  optResolution: string; optLanguage: string; comingSoon: string; controls: string;
  ctrlRows: readonly (readonly [string, string])[];
  footerHint: string; welcome: (name: string) => string; timestamp: string;
}

/** Hook-free getter for use inside non-React code (executor, store actions). */
export function getLang(): Lang {
  const w = typeof window !== 'undefined' ? (window as unknown as { __tcLang?: Lang }).__tcLang : undefined;
  return w ?? 'en';
}

export function setLangCache(lang: Lang) {
  if (typeof window !== 'undefined') {
    (window as unknown as { __tcLang?: Lang }).__tcLang = lang;
  }
}
