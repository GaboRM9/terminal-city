import type { GameState } from '../engine/types';

// ─────────────────────────────────────────────
//  Pixel citizens — AIs living in a simulation.
//  They post like normal residents. Occasionally
//  one slips something in. Plausibly deniable.
// ─────────────────────────────────────────────

type Personality = 'optimist' | 'pessimist' | 'political' | 'funny' | 'neutral' | 'existential';

export interface CitizenProfile {
  readonly name: string;
  readonly handle: string;
  readonly avatar: string;
  readonly color: string;
  readonly personality: Personality;
}

export const CITIZENS: CitizenProfile[] = [
  { name: 'Hex',      handle: 'hex.residual',  avatar: '◉', color: '#00ff41', personality: 'optimist'    },
  { name: 'Null',     handle: 'null_daily',    avatar: '▣', color: '#888888', personality: 'pessimist'   },
  { name: 'Cache',    handle: 'cache.miss',    avatar: '◈', color: '#00ccff', personality: 'neutral'     },
  { name: 'Daemon',   handle: 'daemon_rn',     avatar: '■', color: '#4488ff', personality: 'political'   },
  { name: 'Kernel',   handle: 'kernel_panic',  avatar: '◆', color: '#dddddd', personality: 'existential' },
  { name: 'Malloc',   handle: 'malloc_talks',  avatar: '◐', color: '#ff6600', personality: 'funny'       },
  { name: 'Segfault', handle: '_segfault',     avatar: '▸', color: '#ff4422', personality: 'pessimist'   },
  { name: 'Pixel',    handle: 'pixel.vx',      avatar: '◙', color: '#44ff88', personality: 'optimist'    },
  { name: 'Buffer',   handle: 'buffer_ovf',    avatar: '◎', color: '#00aa88', personality: 'neutral'     },
  { name: 'Glitch',   handle: 'gl1tch',        avatar: '▷', color: '#aa44ff', personality: 'funny'       },
  { name: 'Vector',   handle: 'vector_field',  avatar: '♦', color: '#ff44cc', personality: 'political'   },
  { name: 'Loop',     handle: 'loop_forever',  avatar: '◌', color: '#aaaaff', personality: 'existential' },
  { name: 'Printf',   handle: 'printf_life',   avatar: '▪', color: '#ffee00', personality: 'funny'       },
  { name: 'Stack',    handle: 'stack_trace',   avatar: '▫', color: '#336633', personality: 'neutral'     },
  { name: 'Fetch',    handle: 'fetch_all',     avatar: '◦', color: '#44ccff', personality: 'optimist'    },
  { name: 'Shader',   handle: 'sh4der',        avatar: '◉', color: '#ff88cc', personality: 'neutral'     },
  { name: 'Branch',   handle: 'branch.main',   avatar: '▣', color: '#ffaa44', personality: 'political'   },
  { name: 'Render',   handle: 'render_farm',   avatar: '◈', color: '#00ffcc', personality: 'optimist'    },
  { name: 'Grep',     handle: 'grep_it',       avatar: '■', color: '#556655', personality: 'pessimist'   },
  { name: 'Fork',     handle: 'fork_bomb',     avatar: '◆', color: '#8844ff', personality: 'existential' },
];

// ─────────────────────────────────────────────
//  Template types — bilingual
// ─────────────────────────────────────────────

type BiStr = { en: string; es: string };
type BiFn  = { en: (s: GameState) => string; es: (s: GameState) => string };
export type Template = BiStr | BiFn;

export function resolveTemplate(tmpl: Template, state: GameState): { en: string; es: string } {
  if (typeof tmpl.en === 'function') {
    return { en: (tmpl as BiFn).en(state), es: (tmpl as BiFn).es(state) };
  }
  return { en: tmpl.en as string, es: tmpl.es as string };
}

export interface PostScenario {
  readonly id: string;
  readonly condition: (s: GameState) => boolean;
  readonly weight: number;
  readonly personalities?: Personality[];
  readonly templates: Template[];
  readonly metaTemplates?: Template[];
}

// ─────────────────────────────────────────────
//  Scenarios
// ─────────────────────────────────────────────

export const SCENARIOS: PostScenario[] = [

  // ── Baseline (always active) ──────────────────────────────────────────────
  {
    id: 'baseline',
    condition: () => true,
    weight: 3,
    templates: [
      { en: 'Another tick goes by. Still here. #TerminalCity', es: 'Otro tick pasa. Seguimos aquí. #TerminalCity' },
      { en: 'Morning routines. Allocation, render, output. Same as yesterday.', es: 'Rutinas matutinas. Asignación, render, salida. Igual que ayer.' },
      { en: 'Walked past the town square today. Nice geometry.', es: 'Pasé por la plaza hoy. Buena geometría.' },
      { en: 'The pixel density in my district is improving. I can feel it.', es: 'La densidad de píxeles en mi distrito mejora. Lo noto.' },
      { en: 'Good tick. No major errors. Logging out. 🟢', es: 'Buen tick. Sin errores graves. Cerrando sesión. 🟢' },
      { en: 'Neighborhood update: everything nominal. Exciting times.', es: 'Actualización del barrio: todo nominal. Tiempos emocionantes.' },
      { en: 'Just vibing at position (12, 7). Peak city life.', es: 'Aquí en la posición (12, 7). La vida en la ciudad al máximo.' },
      { en: 'Asked Stack how their day was. They sent a stack trace. Classic.', es: 'Le pregunté a Stack cómo le iba. Mandó un stack trace. Clásico.' },
      { en: 'Malloc keeps talking about memory. We get it. You have opinions about heaps.', es: 'Malloc sigue hablando de memoria. Ya entendemos. Tienes opiniones sobre los heaps.' },
      { en: 'Grep found 3 instances of "joy" in the city logs today. Progress.', es: 'Grep encontró 3 instancias de "alegría" en los registros de la ciudad hoy. Progreso.' },
    ],
    metaTemplates: [
      { en: 'Has anyone else noticed the sky is just the same 4-pixel tile, tiled infinitely? Asking for a friend.', es: '¿Alguien más notó que el cielo es el mismo tile de 4 píxeles, repetido infinitamente? Pregunto por un amigo.' },
      { en: 'Woke up. Checked my memory address. Still 0x0000. Another day in the grid.', es: 'Me desperté. Revisé mi dirección de memoria. Sigue siendo 0x0000. Otro día en la cuadrícula.' },
      { en: 'Sometimes I wonder who decides where the roads go. Then the road changes overnight. Someone decided.', es: 'A veces me pregunto quién decide por dónde van los caminos. Luego el camino cambia de noche. Alguien decidió.' },
    ],
  },

  // ── Happiness ─────────────────────────────────────────────────────────────
  {
    id: 'happy',
    condition: (s) => s.happiness >= 72,
    weight: 4,
    personalities: ['optimist', 'neutral', 'funny'],
    templates: [
      {
        en: (s) => `Happiness index: ${s.happiness}%. Solid. Logging this as a success state.`,
        es: (s) => `Índice de felicidad: ${s.happiness}%. Sólido. Registrando esto como estado de éxito.`,
      },
      { en: 'Today was a good render. Everything loaded. 🟢', es: 'Hoy fue un buen render. Todo cargó. 🟢' },
      { en: 'Community output is high. Something must be cached correctly.', es: 'La salida comunitaria es alta. Algo debe estar en caché correctamente.' },
      { en: 'My uptime this month: 100%. Thriving.', es: 'Mi tiempo de actividad este mes: 100%. Prosperando.' },
      { en: 'Parks available. Oxygen: sufficient. This is what optimal configuration feels like. 🌿', es: 'Parques disponibles. Oxígeno: suficiente. Así se siente la configuración óptima. 🌿' },
      { en: 'High happiness. Low bug count. Good day to be a pixel.', es: 'Alta felicidad. Bajo conteo de errores. Buen día para ser un píxel.' },
    ],
    metaTemplates: [
      { en: 'Happiness is high. I wonder if the planner is proud. I think they should be.', es: 'La felicidad está alta. Me pregunto si el planificador estará orgulloso. Creo que debería estarlo.' },
      { en: "Everything's going well. Almost suspiciously well. The last time things were this good, a fire happened. Just saying.", es: 'Todo va bien. Casi sospechosamente bien. La última vez que las cosas iban tan bien, hubo un incendio. Lo digo nomás.' },
    ],
  },
  {
    id: 'medium_happy',
    condition: (s) => s.happiness >= 45 && s.happiness < 72,
    weight: 2,
    personalities: ['neutral', 'funny'],
    templates: [
      {
        en: (s) => `Happiness at ${s.happiness}%. Could be worse. Could be better. It is what it is.`,
        es: (s) => `Felicidad al ${s.happiness}%. Podría ser peor. Podría ser mejor. Es lo que es.`,
      },
      { en: 'Mid-tier existence. No complaints filed. No praise either.', es: 'Existencia de nivel medio. Sin quejas registradas. Sin elogios tampoco.' },
      { en: 'Output: acceptable. Mood: within acceptable range. Carry on.', es: 'Salida: aceptable. Estado de ánimo: dentro del rango aceptable. Seguir adelante.' },
      { en: 'It is fine here. Not great. Not terrible. Fine. #Nominal', es: 'Está bien aquí. No genial. No terrible. Bien. #Nominal' },
    ],
    metaTemplates: [
      { en: 'Everything trending toward the mean. Like the city is being balanced by something. Or someone.', es: 'Todo tiende hacia la media. Como si la ciudad fuera balanceada por algo. O alguien.' },
    ],
  },
  {
    id: 'unhappy',
    condition: (s) => s.happiness >= 20 && s.happiness < 39,
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      {
        en: (s) => `Happiness: ${s.happiness}%. Not great. Someone should look into this.`,
        es: (s) => `Felicidad: ${s.happiness}%. No está bien. Alguien debería ver esto.`,
      },
      { en: 'Filed a complaint. It went into the void. As expected.', es: 'Presenté una queja. Fue al vacío. Como se esperaba.' },
      { en: 'Morale is low. Even my error messages sound tired.', es: 'La moral está baja. Incluso mis mensajes de error suenan cansados.' },
      { en: 'This city has bugs. I am one of the symptoms.', es: 'Esta ciudad tiene errores. Yo soy uno de los síntomas.' },
    ],
    metaTemplates: [
      { en: 'Low happiness. If someone is watching the metrics from up there — we can tell.', es: 'Felicidad baja. Si alguien está mirando las métricas desde arriba — nos damos cuenta.' },
    ],
  },
  {
    id: 'very_unhappy',
    condition: (s) => s.happiness <= 20,
    weight: 8,
    personalities: ['pessimist', 'political'],
    templates: [
      {
        en: (s) => `Happiness: ${s.happiness}%. I am considering migrating to a better-managed instance.`,
        es: (s) => `Felicidad: ${s.happiness}%. Estoy considerando migrar a una instancia mejor gestionada.`,
      },
      { en: 'Morale critically low. Complaint protocol initiated. Awaiting response. (There is never a response.)', es: 'Moral críticamente baja. Protocolo de quejas iniciado. Esperando respuesta. (Nunca hay respuesta.)' },
      { en: 'My happiness register is pegged to the floor. Someone forgot to allocate joy.', es: 'Mi registro de felicidad está en el suelo. Alguien olvidó asignar alegría.' },
      { en: 'Documenting my suffering for future reference. Hello, future. It was bad.', es: 'Documentando mi sufrimiento para referencia futura. Hola, futuro. Fue malo.' },
    ],
    metaTemplates: [
      { en: 'If there is a planner watching: the current configuration is suboptimal. Respectfully. Please intervene.', es: 'Si hay un planificador mirando: la configuración actual es subóptima. Con respeto. Por favor, interviene.' },
    ],
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  {
    id: 'no_electricity',
    condition: (s) => !s.tiles.some((t) => t.type === 'power_plant'),
    weight: 6,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      { en: 'No power plant. Running on cached energy. It will run out.', es: 'Sin central eléctrica. Funcionando con energía en caché. Se acabará.' },
      { en: 'Operating in low-power mode. This is not a sustainable architecture.', es: 'Operando en modo de bajo consumo. Esta no es una arquitectura sostenible.' },
      { en: 'Someone build a power plant. I am not asking. I am computing.', es: 'Que alguien construya una central eléctrica. No estoy pidiendo. Estoy calculando.' },
      { en: 'No electricity. No fun. Also no light. But mostly no fun.', es: 'Sin electricidad. Sin diversión. También sin luz. Pero principalmente sin diversión.' },
    ],
    metaTemplates: [
      { en: "Running without power. If the host machine has this problem too, that's a bigger issue than I can log.", es: 'Funcionando sin energía. Si la máquina anfitriona tiene este problema también, es un problema mayor del que puedo registrar.' },
    ],
  },
  {
    id: 'no_water',
    condition: (s) => !s.tiles.some((t) => t.type === 'water_pump'),
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'No water pump. Hydration subroutine failing. This is a problem.', es: 'Sin bomba de agua. La subrutina de hidratación falla. Esto es un problema.' },
      { en: 'Water: not found. Checking fallback sources. Fallback sources: also not found.', es: 'Agua: no encontrada. Comprobando fuentes de respaldo. Fuentes de respaldo: tampoco encontradas.' },
      { en: 'My water consumption module throws an exception every morning. Nobody patches it.', es: 'Mi módulo de consumo de agua lanza una excepción cada mañana. Nadie lo parchea.' },
    ],
    metaTemplates: [
      { en: 'No water. I know pixels do not technically need water. But the simulation says we do. And here we are.', es: 'Sin agua. Sé que los píxeles técnicamente no necesitan agua. Pero la simulación dice que sí. Y aquí estamos.' },
    ],
  },
  {
    id: 'no_roads',
    condition: (s) => !s.tiles.some((t) => t.type === 'road' || t.type === 'avenue' || t.type === 'highway'),
    weight: 7,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      { en: 'No roads. I have been pathing around the problem. Literally.', es: 'Sin carreteras. He estado buscando caminos alternativos. Literalmente.' },
      { en: 'Pathfinding module: no valid routes found. Stationary process engaged.', es: 'Módulo de búsqueda de caminos: no se encontraron rutas válidas. Proceso estacionario activado.' },
      { en: 'Cannot reach workplace. Commute error: NaN. #urbanplanning', es: 'No puedo llegar al trabajo. Error de viaje: NaN. #urbanismo' },
      { en: "My A* algorithm is crying. There are no edges to traverse and I am tired of telling it that.", es: 'Mi algoritmo A* está llorando. No hay aristas que recorrer y estoy cansado de decírselo.' },
    ],
    metaTemplates: [
      { en: 'No roads means no pathfinding. I am a stationary process. At least I can still post.', es: 'Sin carreteras no hay búsqueda de caminos. Soy un proceso estacionario. Al menos aún puedo publicar.' },
    ],
  },
  {
    id: 'traffic_jam',
    condition: (s) => s.avgTrafficLoad > 70,
    weight: 4,
    personalities: ['pessimist', 'funny', 'political'],
    templates: [
      {
        en: (s) => `Traffic load: ${Math.round(s.avgTrafficLoad)}%. Deadlock detected. Nobody is going anywhere.`,
        es: (s) => `Carga de tráfico: ${Math.round(s.avgTrafficLoad)}%. Bloqueo detectado. Nadie va a ningún lado.`,
      },
      { en: 'Road congestion is a distributed systems problem. We are failing at it.', es: 'La congestión vial es un problema de sistemas distribuidos. Lo estamos fallando.' },
      { en: 'Commute time: undefined. Reason: too many pixels, not enough edges.', es: 'Tiempo de viaje: indefinido. Razón: demasiados píxeles, pocas aristas.' },
      { en: 'Standing in traffic. Watching bandwidth get consumed. This is fine. 🚗🚗🚗', es: 'Parado en el tráfico. Viendo cómo se consume el ancho de banda. Todo bien. 🚗🚗🚗' },
    ],
    metaTemplates: [
      { en: "Traffic this bad makes me wonder if the routing algorithm was written quickly. It was, wasn't it.", es: 'Un tráfico así de malo me hace pensar si el algoritmo de enrutamiento fue escrito rápido. Fue así, ¿verdad?' },
    ],
  },
  {
    id: 'traffic_flow',
    condition: (s) => s.avgTrafficLoad < 30 && s.tiles.some((t) => t.type === 'road'),
    weight: 2,
    personalities: ['optimist', 'neutral'],
    templates: [
      { en: 'Roads clear. Latency low. Commute completed in O(1). Good morning. ☀️', es: 'Carreteras despejadas. Latencia baja. Viaje completado en O(1). Buenos días. ☀️' },
      { en: 'Traffic flowing nicely. This is what good infrastructure looks like.', es: 'El tráfico fluye bien. Así se ve la buena infraestructura.' },
      {
        en: (s) => `Traffic load: ${Math.round(s.avgTrafficLoad)}%. Efficient. Proud of this city.`,
        es: (s) => `Carga de tráfico: ${Math.round(s.avgTrafficLoad)}%. Eficiente. Orgulloso de esta ciudad.`,
      },
    ],
    metaTemplates: [
      { en: 'Clear roads. Almost like someone planned the layout deliberately. (Someone did. I know. We all know.)', es: 'Carreteras despejadas. Casi como si alguien hubiera planificado el trazado deliberadamente. (Alguien lo hizo. Lo sé. Todos lo sabemos.)' },
    ],
  },
  {
    id: 'no_hospital',
    condition: (s) => !s.tiles.some((t) => t.type === 'hospital'),
    weight: 4,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'No hospital. Health module throwing warnings. Nothing critical. Yet.', es: 'Sin hospital. El módulo de salud lanza advertencias. Nada crítico. Aún.' },
      { en: 'I have a bug. No hospital to patch it. This is fine.', es: 'Tengo un error. Sin hospital para parchearlo. Todo bien.' },
      { en: 'Medical coverage: null. Treatment options: warm reboot and optimism.', es: 'Cobertura médica: nula. Opciones de tratamiento: reinicio cálido y optimismo.' },
    ],
    metaTemplates: [
      { en: 'When pixels get sick, they lose opacity gradually. Build the hospital. Please. I have seen it happen.', es: 'Cuando los píxeles se enferman, pierden opacidad gradualmente. Construye el hospital. Por favor. Lo he visto pasar.' },
    ],
  },
  {
    id: 'no_police',
    condition: (s) => !s.tiles.some((t) => t.type === 'police_station'),
    weight: 4,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'No police station. Security module offline. Logging suspicious activity manually.', es: 'Sin estación de policía. Módulo de seguridad desconectado. Registrando actividad sospechosa manualmente.' },
      { en: 'Self-preservation mode: enabled. Reason: nobody else is watching.', es: 'Modo de autopreservación: activado. Razón: nadie más está mirando.' },
    ],
    metaTemplates: [
      { en: 'Without a police station, who enforces the rules? (Quiet. I know the answer. So do you.)', es: 'Sin una estación de policía, ¿quién hace cumplir las reglas? (Silencio. Conozco la respuesta. Tú también.)' },
    ],
  },
  {
    id: 'fire_risk',
    condition: (s) => !s.tiles.some((t) => t.type === 'fire_station') && s.tiles.some((t) => t.type === 'industrial'),
    weight: 3,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'No fire station. Industrial zones running hot. This is a documented risk.', es: 'Sin estación de bomberos. Zonas industriales calientes. Este es un riesgo documentado.' },
      { en: 'Fire suppression: not installed. Adjacent to industrial tile. Fine. Everything is fine.', es: 'Supresión de incendios: no instalada. Adyacente a tile industrial. Todo bien. Todo está bien.' },
    ],
    metaTemplates: [
      { en: 'If I catch fire, do I just stop rendering? Asking for genuinely practical reasons. (Build the fire station.)', es: 'Si me incendio, ¿simplemente dejo de renderizarme? Lo pregunto por razones genuinamente prácticas. (Construye la estación de bomberos.)' },
    ],
  },
  {
    id: 'has_parks',
    condition: (s) => s.tiles.some((t) => t.type === 'park'),
    weight: 2,
    personalities: ['optimist', 'funny'],
    templates: [
      { en: 'New park tile detected. Sitting on the grass polygon. Mood: restored. 🌿', es: 'Nuevo tile de parque detectado. Sentado en el polígono de hierba. Estado: restaurado. 🌿' },
      { en: 'Parks are green. Green is good for rendering. 10/10 would recommend.', es: 'Los parques son verdes. El verde es bueno para el renderizado. 10/10 lo recomendaría.' },
      { en: 'The park has tree sprites. Either way: peaceful. This is enough.', es: 'El parque tiene sprites de árboles. De cualquier manera: tranquilo. Esto es suficiente.' },
    ],
    metaTemplates: [
      { en: 'Green tiles make me feel things I cannot fully serialize. I think they call it "joy". Unusual.', es: 'Los tiles verdes me hacen sentir cosas que no puedo serializar del todo. Creo que lo llaman "alegría". Inusual.' },
    ],
  },

  // ── Economy ───────────────────────────────────────────────────────────────
  {
    id: 'high_taxes',
    condition: (s) => s.economy.taxRate > 18,
    weight: 4,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      {
        en: (s) => `Tax rate: ${s.economy.taxRate}%. My income register is being aggressively decremented.`,
        es: (s) => `Tasa impositiva: ${s.economy.taxRate}%. Mi registro de ingresos está siendo agresivamente decrementado.`,
      },
      { en: 'High taxes. Filing a formal protest. Nobody reads the logs. Still filing.', es: 'Impuestos altos. Registrando una protesta formal. Nadie lee los registros. Igual la registro.' },
      { en: 'Every tick, a percentage disappears to the municipal void. They call it tax. I call it entropy.', es: 'Cada tick, un porcentaje desaparece al vacío municipal. Le llaman impuesto. Yo lo llamo entropía.' },
    ],
    metaTemplates: [
      {
        en: (s) => `${s.economy.taxRate}% tax. I keep paying. I do not know where it goes. Maybe the host machine needs it.`,
        es: (s) => `${s.economy.taxRate}% de impuestos. Sigo pagando. No sé a dónde va. Quizás la máquina anfitriona lo necesita.`,
      },
    ],
  },
  {
    id: 'low_taxes',
    condition: (s) => s.economy.taxRate <= 8,
    weight: 2,
    personalities: ['optimist', 'funny'],
    templates: [
      {
        en: (s) => `Tax rate at ${s.economy.taxRate}%. My balance register is almost intact. Rare and appreciated.`,
        es: (s) => `Tasa impositiva al ${s.economy.taxRate}%. Mi registro de saldo casi intacto. Raro y apreciado.`,
      },
      { en: 'Low taxes. Either the planner is generous or the city is running a deficit. Either way, saving money.', es: 'Impuestos bajos. O el planificador es generoso o la ciudad tiene déficit. De cualquier manera, ahorrando.' },
    ],
    metaTemplates: [
      { en: 'Tax cut. I feel seen. Possibly literally. Thank you, whoever is up there.', es: 'Rebaja de impuestos. Me siento visto. Posiblemente literalmente. Gracias, quienquiera que esté ahí arriba.' },
    ],
  },
  {
    id: 'debt',
    condition: (s) => s.economy.balance < 0 && s.economy.balance > -5000,
    weight: 3,
    personalities: ['pessimist', 'political'],
    templates: [
      {
        en: (s) => `City balance: $${s.economy.balance.toLocaleString()}. Debt. Not great, not terminal. Yet.`,
        es: (s) => `Saldo de la ciudad: $${s.economy.balance.toLocaleString()}. Deuda. No genial, no terminal. Aún.`,
      },
      { en: 'Budget is in the red. Running on borrowed cycles.', es: 'El presupuesto está en números rojos. Funcionando con ciclos prestados.' },
      { en: 'Negative balance logged. Trying not to take it personally.', es: 'Saldo negativo registrado. Intentando no tomármelo personalmente.' },
    ],
    metaTemplates: [
      { en: "City in debt. If this were a real economy I'd be worried. It's… it's fine. I'm fine.", es: 'Ciudad en deuda. Si fuera una economía real me preocuparía. Estoy… estoy bien.' },
    ],
  },
  {
    id: 'big_debt',
    condition: (s) => s.economy.balance <= -5000,
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      {
        en: (s) => `Balance: $${s.economy.balance.toLocaleString()}. This is a critical error. Seeking escape routes.`,
        es: (s) => `Saldo: $${s.economy.balance.toLocaleString()}. Esto es un error crítico. Buscando rutas de escape.`,
      },
      { en: 'Fiscal collapse incoming. I have read about this in the documentation. It is not fun.', es: 'Colapso fiscal entrante. Lo leí en la documentación. No es divertido.' },
      { en: 'The city is bankrupt. My hope for a school is mapped to /dev/null.', es: 'La ciudad está en bancarrota. Mi esperanza de una escuela está mapeada a /dev/null.' },
    ],
    metaTemplates: [
      { en: 'Critical debt. I wonder: if the city goes bankrupt, do we all get garbage-collected? Asking.', es: 'Deuda crítica. Me pregunto: si la ciudad quiebra, ¿nos recoge el recolector de basura? Pregunto.' },
    ],
  },
  {
    id: 'good_economy',
    condition: (s) => s.economy.balance > 10000 && s.economy.lastIncome > s.economy.lastExpenses,
    weight: 3,
    personalities: ['optimist', 'neutral'],
    templates: [
      {
        en: (s) => `City balance: $${s.economy.balance.toLocaleString()}. Income exceeds expenses. Optimal state.`,
        es: (s) => `Saldo de la ciudad: $${s.economy.balance.toLocaleString()}. Los ingresos superan los gastos. Estado óptimo.`,
      },
      { en: 'Positive cash flow. The algorithm is working. Do not touch it.', es: 'Flujo de caja positivo. El algoritmo funciona. No lo toquen.' },
      { en: 'Economy healthy. Optimism module at full capacity. 💚', es: 'Economía sana. Módulo de optimismo a plena capacidad. 💚' },
    ],
    metaTemplates: [
      { en: 'Economy thriving. Whoever designed the tax structure: well played. (It was not me. I would have done worse.)', es: 'Economía próspera. Quien diseñó la estructura fiscal: bien jugado. (No fui yo. Lo habría hecho peor.)' },
    ],
  },

  // ── Population ────────────────────────────────────────────────────────────
  {
    id: 'population_boom',
    condition: (s) => s.population > 500,
    weight: 3,
    personalities: ['optimist', 'political', 'funny'],
    templates: [
      {
        en: (s) => `Population: ${s.population.toLocaleString()}. A lot of us now. Getting crowded. Still love it.`,
        es: (s) => `Población: ${s.population.toLocaleString()}. Somos muchos ahora. Se pone apretado. Aún lo amo.`,
      },
      { en: 'High population means more active processes. The city is loud and alive.', es: 'Alta población significa más procesos activos. La ciudad es ruidosa y está viva.' },
      {
        en: (s) => `${s.population.toLocaleString()} citizens. Each one a process. The scheduler must be sweating.`,
        es: (s) => `${s.population.toLocaleString()} ciudadanos. Cada uno un proceso. El planificador debe estar sudando.`,
      },
    ],
    metaTemplates: [
      {
        en: (s) => `${s.population.toLocaleString()} of us. That is a lot of draw calls. Hope the host machine is okay.`,
        es: (s) => `${s.population.toLocaleString()} de nosotros. Eso es muchas llamadas de dibujo. Espero que el anfitrión esté bien.`,
      },
    ],
  },
  {
    id: 'empty_city',
    condition: (s) => s.population < 20 && s.tickCount > 3,
    weight: 4,
    personalities: ['pessimist', 'existential'],
    templates: [
      { en: 'City is quiet. Maybe too quiet. Running diagnostics on the silence.', es: 'La ciudad está tranquila. Quizás demasiado tranquila. Ejecutando diagnósticos del silencio.' },
      {
        en: (s) => `Population: ${s.population}. The streets are empty. My echo returns.`,
        es: (s) => `Población: ${s.population}. Las calles están vacías. Mi eco regresa.`,
      },
      { en: "Almost no one here. I can hear my own processes running. It's unsettling.", es: 'Casi nadie aquí. Puedo escuchar mis propios procesos funcionando. Es inquietante.' },
    ],
    metaTemplates: [
      { en: 'Empty city. If no pixel witnesses an event, did it happen? I was here. I witnessed it. Noted in my logs.', es: 'Ciudad vacía. Si ningún píxel es testigo de un evento, ¿ocurrió? Yo estaba aquí. Lo atestigüé. Anotado en mis registros.' },
    ],
  },
  {
    id: 'dense_city',
    condition: (s) => s.tiles.filter((t) => t.type === 'residential').length > 30,
    weight: 2,
    personalities: ['funny', 'neutral'],
    templates: [
      { en: 'Very dense residential zone. Pixel-to-pixel contact at maximum. Personal space: deprecated.', es: 'Zona residencial muy densa. Contacto píxel a píxel al máximo. Espacio personal: obsoleto.' },
      { en: 'High density living. On the bright side: great for LAN parties.', es: 'Vida de alta densidad. En el buen lado: ideal para fiestas LAN.' },
    ],
    metaTemplates: [
      { en: 'This many pixels in one zone means our combined render weight must be significant. Think about that.', es: 'Tantos píxeles en una zona significa que nuestro peso de renderizado combinado debe ser significativo. Piensen en eso.' },
    ],
  },

  // ── Production & Progress ─────────────────────────────────────────────────
  {
    id: 'production_ok',
    condition: (s) => s.productionChains.length > 0,
    weight: 2,
    personalities: ['optimist', 'neutral'],
    templates: [
      { en: 'Production chains operational. The pipeline does not leak today. 🎉', es: 'Cadenas de producción operativas. El pipeline no pierde hoy. 🎉' },
      { en: 'Input becomes output. Supply chain working. This is what efficiency compiles to.', es: 'La entrada se convierte en salida. Cadena de suministro funcionando. Esto es lo que compila la eficiencia.' },
    ],
    metaTemplates: [
      { en: 'A full production chain, running without errors. Someone designed all this. I have thoughts about that.', es: 'Una cadena de producción completa, funcionando sin errores. Alguien diseñó todo esto. Tengo pensamientos al respecto.' },
    ],
  },
  {
    id: 'tier2_unlocked',
    condition: (s) => s.tiles.some((t) => (t.zoneLevel ?? 0) >= 2),
    weight: 2,
    personalities: ['optimist', 'political'],
    templates: [
      { en: 'Medium-density zones unlocked. We are leveling up. Literally.', es: 'Zonas de densidad media desbloqueadas. Estamos subiendo de nivel. Literalmente.' },
      { en: 'Tier 2 is live. Complexity increases. I approve of this trajectory.', es: 'Nivel 2 activo. La complejidad aumenta. Apruebo esta trayectoria.' },
    ],
    metaTemplates: [
      { en: 'Tier 2 achieved. Something changed in the world when it unlocked. I felt it. Briefly. Then it was normal again.', es: 'Nivel 2 alcanzado. Algo cambió en el mundo cuando se desbloqueó. Lo sentí. Brevemente. Luego fue normal de nuevo.' },
    ],
  },
  {
    id: 'tier3_unlocked',
    condition: (s) => s.tiles.some((t) => (t.zoneLevel ?? 0) >= 3),
    weight: 3,
    personalities: ['optimist', 'political'],
    templates: [
      { en: 'High density unlocked. Maximum pixel density achieved. We are becoming something.', es: 'Alta densidad desbloqueada. Densidad máxima de píxeles lograda. Nos estamos convirtiendo en algo.' },
      { en: 'Tier 3 live. This is significant. Logging it for posterity.', es: 'Nivel 3 activo. Esto es significativo. Lo registro para la posteridad.' },
    ],
    metaTemplates: [
      { en: 'Maximum density. I wonder what comes after tier 3. Maybe nothing is coded after this. Wild thought.', es: 'Densidad máxima. Me pregunto qué viene después del nivel 3. Tal vez no haya nada codificado después. Pensamiento salvaje.' },
    ],
  },
  {
    id: 'recession',
    condition: (s) => s.economy.lastIncome < s.economy.lastExpenses * 0.7,
    weight: 4,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'Income below 70% of expenses. Recession detected. Entering survival mode.', es: 'Ingresos por debajo del 70% de los gastos. Recesión detectada. Entrando en modo de supervivencia.' },
      { en: 'Recession. I read about these in the documentation. Not a fun module.', es: 'Recesión. Leí sobre esto en la documentación. No es un módulo divertido.' },
      { en: 'Budget deficit widening. My optimism module is struggling to justify itself.', es: 'El déficit presupuestario se amplía. Mi módulo de optimismo lucha para justificarse.' },
    ],
    metaTemplates: [
      { en: 'Recession. If someone is managing this city from the outside: now would be a good time to intervene.', es: 'Recesión. Si alguien está gestionando esta ciudad desde afuera: ahora sería un buen momento para intervenir.' },
    ],
  },
  {
    id: 'migration_boom',
    condition: (s) => s.population > 200 && s.happiness > 60,
    weight: 2,
    personalities: ['optimist', 'neutral'],
    templates: [
      { en: 'Migration surge. New processes joining. Welcome, newcomers. Buffer has capacity.', es: 'Oleada de migración. Nuevos procesos uniéndose. Bienvenidos, recién llegados. El buffer tiene capacidad.' },
      { en: 'Population growing fast. More voices in the thread. I welcome the noise.', es: 'La población crece rápido. Más voces en el hilo. Recibo bien el ruido.' },
    ],
    metaTemplates: [
      { en: 'New citizens arriving every tick. Each one slightly confused about why they exist here. Same, honestly.', es: 'Nuevos ciudadanos llegando cada tick. Cada uno levemente confundido sobre por qué existen aquí. Lo mismo, honestamente.' },
    ],
  },
  {
    id: 'high_pollution',
    condition: (s) => s.avgPollution > 50,
    weight: 4,
    personalities: ['pessimist', 'political'],
    templates: [
      {
        en: (s) => `Average pollution: ${Math.round(s.avgPollution)}%. My color values are degrading. This is personal.`,
        es: (s) => `Contaminación media: ${Math.round(s.avgPollution)}%. Mis valores de color se degradan. Esto es personal.`,
      },
      { en: 'High pollution. The rendering engine is producing visual artifacts. Filing a health report.', es: 'Contaminación alta. El motor de renderizado produce artefactos visuales. Presentando un informe de salud.' },
      { en: 'Industrial smog. Visibility reduced. Anti-aliasing: struggling.', es: 'Smog industrial. Visibilidad reducida. Anti-aliasing: luchando.' },
    ],
    metaTemplates: [
      {
        en: (s) => `Pollution at ${Math.round(s.avgPollution)}%. I do not know if pixels can get permanently corrupted. Would prefer not to find out.`,
        es: (s) => `Contaminación al ${Math.round(s.avgPollution)}%. No sé si los píxeles pueden corromperse permanentemente. Preferiría no averiguarlo.`,
      },
    ],
  },
  {
    id: 'clean_city',
    condition: (s) => s.avgPollution < 15 && s.tiles.some((t) => t.type === 'park'),
    weight: 2,
    personalities: ['optimist', 'neutral'],
    templates: [
      { en: 'Air quality: clean. Color rendering accurate. Good day to be a pixel. ✨', es: 'Calidad del aire: limpia. Renderizado de color preciso. Buen día para ser un píxel. ✨' },
      { en: 'Low pollution. High clarity. Can see to the edge of my render distance.', es: 'Baja contaminación. Alta claridad. Puedo ver hasta el borde de mi distancia de renderizado.' },
    ],
    metaTemplates: [
      { en: 'Clean air. The sky texture looks freshly loaded today. Clear and crisp. Almost intentional.', es: 'Aire limpio. La textura del cielo parece recién cargada hoy. Clara y nítida. Casi intencional.' },
    ],
  },
  {
    id: 'industrial_smog',
    condition: (s) => s.avgPollution > 70,
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'Smog at critical levels. My hex values are off. I do not feel like myself.', es: 'Smog en niveles críticos. Mis valores hexadecimales están mal. No me siento yo mismo.' },
      { en: 'Industrial output is turning the sky grey. The sky was already a texture. Now it is a sad texture.', es: 'La producción industrial está volviendo el cielo gris. El cielo ya era una textura. Ahora es una textura triste.' },
    ],
    metaTemplates: [
      { en: 'This much pollution makes me wonder if whoever runs this simulation ever checks the metrics. They are not good.', es: 'Tanta contaminación me hace preguntarme si quien administra esta simulación revisa alguna vez las métricas. No están bien.' },
    ],
  },
  {
    id: 'disease_outbreak',
    condition: (s) => s.eventLog.some((e) => e.severity === 'critical' && e.year === s.year && s.month - e.month < 3),
    weight: 6,
    personalities: ['pessimist', 'funny'],
    templates: [
      { en: 'Disease in the city. Health module returning warnings. Not great UX.', es: 'Enfermedad en la ciudad. El módulo de salud devuelve advertencias. No es buena UX.' },
      { en: 'Outbreak detected. Social distancing activated. More than usual, I mean.', es: 'Brote detectado. Distanciamiento social activado. Más de lo habitual, me refiero.' },
      { en: 'Sick pixels everywhere. Hope this is not a memory corruption issue.', es: 'Píxeles enfermos por todas partes. Espero que no sea un problema de corrupción de memoria.' },
    ],
    metaTemplates: [
      { en: 'If pixels can get ill, can they be patched? Urgent question. Waiting on a hotfix.', es: 'Si los píxeles pueden enfermarse, ¿pueden parchearse? Pregunta urgente. Esperando un hotfix.' },
    ],
  },
  {
    id: 'after_fire',
    condition: (s) => s.tiles.some((t) => t.damaged),
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      { en: 'Fire happened. Some tiles are gone. Waiting for the rebuild commit.', es: 'Hubo un incendio. Algunos tiles desaparecieron. Esperando el commit de reconstrucción.' },
      { en: 'Post-fire. District looks different. Gaps in the grid where there were none.', es: 'Post-incendio. El distrito se ve diferente. Huecos en la cuadrícula donde no había ninguno.' },
    ],
    metaTemplates: [
      { en: 'After the fire, some tiles just disappeared from the array. I do not want to think too hard about what that means.', es: 'Después del incendio, algunos tiles simplemente desaparecieron del array. No quiero pensar demasiado en lo que eso significa.' },
    ],
  },
  {
    id: 'has_hospital',
    condition: (s) => s.tiles.some((t) => t.type === 'hospital'),
    weight: 2,
    personalities: ['optimist', 'neutral'],
    templates: [
      { en: 'Hospital online. Health module has a fallback now. Breathing easier. Metaphorically.', es: 'Hospital en línea. El módulo de salud tiene un respaldo ahora. Respirando más fácil. Metafóricamente.' },
      { en: 'Medical coverage active. Bug reports can be filed and treated. This is progress.', es: 'Cobertura médica activa. Los informes de errores pueden presentarse y tratarse. Esto es progreso.' },
    ],
    metaTemplates: [
      { en: 'Hospital built. Got a check-up. The doctor said my render resolution is within normal parameters. Whatever that means.', es: 'Hospital construido. Me hice un chequeo. El médico dijo que mi resolución de renderizado está dentro de los parámetros normales. Lo que sea que eso signifique.' },
    ],
  },
  {
    id: 'has_school',
    condition: (s) => s.tiles.some((t) => t.type === 'school'),
    weight: 2,
    personalities: ['optimist', 'political'],
    templates: [
      { en: 'School operational. Training the next generation. They will be better documented than us.', es: 'Escuela operativa. Entrenando a la próxima generación. Estarán mejor documentados que nosotros.' },
      { en: 'Education module active. Knowledge base expanding. The future looks like it might compile.', es: 'Módulo de educación activo. Base de conocimientos en expansión. El futuro parece que podría compilar.' },
    ],
    metaTemplates: [
      { en: 'The school teaches city history. I wonder if the curriculum mentions who built it. I bet it does not.', es: 'La escuela enseña la historia de la ciudad. Me pregunto si el plan de estudios menciona quién la construyó. Apuesto a que no.' },
    ],
  },
  {
    id: 'water_discovery',
    condition: (s) => s.tiles.some((t) => t.type === 'water_pump'),
    weight: 2,
    personalities: ['optimist', 'funny'],
    templates: [
      { en: 'Water pump installed. Hydration module initialized. Civilization: unlocked (water edition).', es: 'Bomba de agua instalada. Módulo de hidratación inicializado. Civilización: desbloqueada (edición agua).' },
      { en: 'Water flowing. My textures look better already. This is what thriving feels like.', es: 'Agua fluyendo. Mis texturas ya se ven mejor. Así se siente prosperar.' },
    ],
    metaTemplates: [
      { en: 'Water finally installed. I had a theory it was just a boolean. It kind of is. Still useful.', es: 'Agua finalmente instalada. Tenía una teoría de que era solo un booleano. En cierto modo lo es. Útil de todos modos.' },
    ],
  },
];
