import type { GameState } from '../engine/types';

// ─────────────────────────────────────────────
//  Pixelgram — citizen profiles & post scenarios
// ─────────────────────────────────────────────

export type Personality = 'optimist' | 'pessimist' | 'political' | 'funny' | 'neutral';

export interface CitizenProfile {
  readonly name: string;
  readonly handle: string;
  readonly avatar: string;
  readonly color: string;
  readonly personality: Personality;
}

export const CITIZENS: CitizenProfile[] = [
  { name: 'Catalina', handle: 'cata_vox',     avatar: '◉', color: '#00ff41', personality: 'optimist'  },
  { name: 'Marcos',   handle: 'marcos_bit',    avatar: '▣', color: '#ff6600', personality: 'political' },
  { name: 'Sofía',    handle: 'sofi_nano',     avatar: '◈', color: '#ffb000', personality: 'funny'     },
  { name: 'Diego',    handle: 'dgrid_px',      avatar: '■', color: '#4488ff', personality: 'pessimist' },
  { name: 'Luna',     handle: 'luna_pixel',    avatar: '◆', color: '#44cc00', personality: 'neutral'   },
  { name: 'Andrés',   handle: 'andy_byte',     avatar: '◐', color: '#00aaff', personality: 'optimist'  },
  { name: 'Rosa',     handle: 'rosa_chip',     avatar: '▸', color: '#ff4488', personality: 'political' },
  { name: 'Pablo',    handle: 'pablo_data',    avatar: '◙', color: '#888888', personality: 'pessimist' },
  { name: 'Elena',    handle: 'elena_vx',      avatar: '◎', color: '#ffee00', personality: 'funny'     },
  { name: 'Miguel',   handle: 'miguelhex',     avatar: '▷', color: '#00cc88', personality: 'neutral'   },
  { name: 'Valentina',handle: 'val_raster',    avatar: '♦', color: '#ff44cc', personality: 'optimist'  },
  { name: 'Tomás',    handle: 'tomy_shader',   avatar: '◌', color: '#aa88ff', personality: 'political' },
  { name: 'Isa',      handle: 'isa_flop',      avatar: '▪', color: '#ffaa44', personality: 'funny'     },
  { name: 'Emilio',   handle: 'emi_lag',       avatar: '▫', color: '#00ffcc', personality: 'pessimist' },
  { name: 'Nadia',    handle: 'nadia_ram',     avatar: '◦', color: '#ff8844', personality: 'neutral'   },
];

type Template = string | ((s: GameState) => string);

export interface PostScenario {
  readonly id: string;
  readonly condition: (s: GameState) => boolean;
  readonly weight: number;
  readonly personalities?: Personality[];
  readonly templates: Template[];
}

function t(str: string): string { return str; }
function tf(fn: (s: GameState) => string): (s: GameState) => string { return fn; }

export const SCENARIOS: PostScenario[] = [

  // ── Baseline (always active) ───────────────────────────────────
  {
    id: 'baseline',
    condition: () => true,
    weight: 3,
    templates: [
      t('Buenos días desde mi pixel-ventana ☀️ #TerminalCity'),
      t('El café de la esquina abrió temprano hoy. Así empieza la semana bien ☕'),
      t('¿Alguien más sintió ese temblor de tierra anoche? O era yo que me caí de la cama'),
      t('Recordatorio: sean buenos vecinos. Mantengan limpias sus cuadras 🌿'),
      t('Pixel-selfie del domingo 📸 #ciudadanodelmes'),
      t('HOT TAKE: necesitamos más bicicletas y menos carreteras. Dennle RT si están de acuerdo'),
      t('Acabo de ver una ardilla en el tejado. Cuatro pisos. No se cómo llegó hasta ahí'),
      t('Mi mamá dice que antes la ciudad era un terreno baldío. Los tiempos cambian 🏙️'),
      t('Propuesta seria: que el alcalde venga a vivir una semana en mi barrio. A ver qué opina'),
      t('Nuevo récord personal: llegué al trabajo sin pisar un bache. Festejando con moderación'),
      t('El señor del quinto piso está tocando la trompeta otra vez. Son las 7am. #NoQuejasFormal'),
      t('Tip de vida: conoce a tus vecinos antes de necesitarlos. Vale la pena 🤝'),
      t('¿Existe el concepto de "lunes" en una ciudad sin reloj? Pregunto para un amigo'),
      t('Los niños jugando en la calle = señal de que el barrio está vivo. Me alegra verlo'),
      t('Hoy descubrí que mi vecino tiene el mismo nombre que yo. Complicado. Muy complicado'),
    ],
  },

  // ── Happy city ────────────────────────────────────────────────
  {
    id: 'happy',
    condition: (s) => s.happiness >= 72,
    weight: 4,
    personalities: ['optimist', 'neutral', 'funny'],
    templates: [
      t('Pensé en mudarme el año pasado. Me alegra haber aguantado ❤️ #TerminalCity'),
      t('Mis vecinos de enfrente acaban de llegar. Les dije que tomaron la mejor decisión de su vida 😄'),
      t('Hay días que salgo a la calle y pienso: esto está funcionando. Hoy fue uno de esos días'),
      t('Le mostré fotos de la ciudad a mi prima que vive en otro lugar. Casi se viene corriendo 🏃'),
      t('Los servicios funcionan, las calles están limpias, la gente sonríe. ¿Qué más se puede pedir?'),
      tf((s) => `Felicidad ciudadana: ${s.happiness}%. Eso no se improvisa, se construye. Chapeau 👏`),
      t('Por primera vez en meses dormí sin escuchar sirenas. La paz tiene un sabor especial 😴'),
      t('Mi hijo preguntó si podíamos mudarnos. Le dije que aquí ya estamos perfectamente. Caso cerrado'),
      t('Una turista me preguntó si vivía aquí. Le dije que sí. Se notó la envidia 😎 #OrgulloLocal'),
    ],
  },

  // ── Medium happiness ────────────────────────────────────────────
  {
    id: 'medium_happy',
    condition: (s) => s.happiness >= 45 && s.happiness < 72,
    weight: 2,
    personalities: ['neutral', 'funny'],
    templates: [
      t('Las cosas no están mal... tampoco están bien. El clásico "podría ser peor" 🤷'),
      t('Encuesta informal: ¿están conformes con la ciudad? Yo digo 6/10. Comenten'),
      t('Hay potencial. No lo estamos aprovechando al 100% pero hay potencial. Sigo esperando'),
      t('Hoy vi a alguien quejarse de la ciudad. Pero también vi a alguien arreglar algo. Me quedo con lo segundo'),
      t('Ni modo. En otras ciudades está peor. Seguimos. #ResilienciaPixel'),
    ],
  },

  // ── Unhappy ────────────────────────────────────────────────────
  {
    id: 'unhappy',
    condition: (s) => s.happiness < 40 && s.happiness > 20,
    weight: 5,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      t('Otra reunión vecinal, otras quejas sin respuesta. Esto ya es tradición 😤'),
      t('Llevamos meses así y nadie hace nada. Alguien que me explique qué está pasando'),
      t('Mi índice personal de felicidad está en mínimos históricos. Gracias ciudad. Muy amable'),
      t('Vi el informe municipal. Luego fui al baño. Relación causa-efecto directa'),
      t('¿Alguien más está buscando apartamento en otra ciudad? Pregunto por... razones'),
      t('Este mes fue horrible. El próximo mes diremos lo mismo. El ciclo de la vida en Terminal City 🔄'),
      tf((s) => `Año ${s.year}, mes ${s.month}. Seguimos igual. Mi diario podría escribirlo solo ya`),
      t('Mis plantas están más marchitas que mi fe en esta administración 🌵'),
    ],
  },

  // ── Very unhappy ──────────────────────────────────────────────
  {
    id: 'very_unhappy',
    condition: (s) => s.happiness <= 20,
    weight: 8,
    personalities: ['pessimist', 'political'],
    templates: [
      t('Ya empaqué. Me voy. No aguanto más. Alguien que me haga una fiesta de despedida 👋'),
      t('HILO: razones por las que esta ciudad está en decadencia total. Respondo a todos los comentarios'),
      t('No tengo palabras. Bueno sí tengo pero son irreproducibles en una red social pública'),
      t('Esto ya no es vivir. Esto es sobrevivir. Hay diferencia. Mucha diferencia'),
      tf((s) => `${s.happiness}% de felicidad. Nunca pensé que vería números tan bajos fuera de una crisis global`),
      t('Mi abuela vivió la Gran Recesión. Dice que esto es peor. Confío en su criterio 👴'),
      t('Si esto fuera un videojuego ya habría cerrado la aplicación y pedido reembolso'),
      t('La ciudad básicamente me dijo: "hey, vete". Y aquí sigo. Por terquedad pura'),
    ],
  },

  // ── No electricity ────────────────────────────────────────────
  {
    id: 'no_electricity',
    condition: (s) => !s.tiles.some((t) => t.type === 'power_plant'),
    weight: 6,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      t('¿Otra vez sin luz? Esto es el quinto apagón esta semana. Perdí la cuenta 😤 #SinElectricidad'),
      t('Estoy escribiendo esto desde mi teléfono con el 3% de batería porque NO HAY LUZ. Urgente'),
      t('Trabajando a la luz de velas en pleno siglo XXI. Gracias al alcalde por el ambiente romántico ✨'),
      t('Mi nevera lleva 6 horas apagada. El queso ya tomó decisiones propias. No nos comunicamos'),
      t('El alcalde nos prometió electricidad "pronto". Eso fue hace 3 meses. Sigo esperando. Con linterna'),
      t('Propongo que la administración trabaje sin electricidad un día completo. Solo para que sepan'),
      t('Sin luz no hay progreso. Sin progreso no hay futuro. Sin futuro ¿para qué vivir aquí? 💔'),
      t('Mi abuelo dice que él sí vivió sin electricidad. Y que no era divertido. Gracias abuelo, ya lo sé'),
    ],
  },

  // ── No water ──────────────────────────────────────────────────
  {
    id: 'no_water',
    condition: (s) => !s.tiles.some((t) => t.type === 'water_pump'),
    weight: 6,
    personalities: ['pessimist', 'political'],
    templates: [
      t('Día 12 sin agua corriente. Contando. #SinAgua #CiudadEnEmergencia'),
      t('¿Cómo se supone que vivamos sin agua? Alguien que me explique el plan porque yo no lo veo'),
      t('Fui a buscar agua. Caminé 8 cuadras. Esto no es una ciudad, es un ejercicio de resistencia'),
      t('Sin agua no hay higiene. Sin higiene no hay salud. Esta cadena termina muy mal 🦠'),
      t('Mi vecino cavó un pozo en el patio. Lo llamamos "la solución del pueblo" porque el gobierno no llega'),
      t('Tercer aviso al Departamento de Obras: NECESITAMOS UNA BOMBA DE AGUA. Con mayúsculas y todo'),
      t('Bañarse con agua embotellada es un privilegio caro. No debería ser así en 2024 💧'),
    ],
  },

  // ── No police / crime ────────────────────────────────────────
  {
    id: 'crime',
    condition: (s) =>
      s.tiles.filter((t) => t.type === 'residential' && t.population > 0 && !t.coverage.police)
        .length > 3,
    weight: 5,
    personalities: ['pessimist', 'political', 'neutral'],
    templates: [
      t('Me robaron el pixel-scooter. Tercera vez este mes. Sin policía no hay paz 😡'),
      t('Ola de crímenes en mi barrio y el comisionado ni se inmuta. ¿Dónde están? 🚔'),
      t('Mi mamá tiene miedo de salir de noche. Eso no debería pasar en ninguna ciudad. Punto'),
      t('Hilo: incidentes de seguridad en mi calle esta semana. Es largo. Muy largo'),
      t('¿Alguien más notó que no hay patrullas desde hace semanas? Solo pregunto'),
      t('El crimen sube cuando no hay presencia policial. Esto no es opinión, es matemática básica'),
      t('Mi vecino instaló 4 cámaras de seguridad. El barrio parece un set de spy movie. Triste necesidad'),
      t('Reunión de vecinos esta noche para organizarnos. Si el gobierno no llega, llegamos nosotros 💪'),
    ],
  },

  // ── Fire risk ─────────────────────────────────────────────────
  {
    id: 'fire_risk',
    condition: (s) =>
      s.tiles.some((t) => t.type === 'industrial') &&
      !s.tiles.some((t) => t.type === 'fire_station'),
    weight: 5,
    personalities: ['pessimist', 'political', 'neutral'],
    templates: [
      t('Hay fábricas por todos lados y CERO estaciones de bomberos. ¿Alguien pensó en esto? 🔥'),
      t('Vivir al lado de una planta industrial sin cobertura de bomberos me parece una apuesta arriesgada'),
      t('Si mañana hay un incendio industrial ¿quién apaga? ¿Los vecinos con baldes? Serio'),
      t('La planta de la calle 12 echa humo desde ayer. Nadie responde el teléfono de emergencias. Normal'),
      t('Propongo: antes de construir más fábricas, construyamos una ESTACIÓN DE BOMBEROS. Firmen aquí'),
      t('Mis hijos preguntan qué hacemos si hay un incendio. Les dije que corramos. No tenía otra respuesta'),
    ],
  },

  // ── Traffic jam ──────────────────────────────────────────────
  {
    id: 'traffic_jam',
    condition: (s) => (s.avgTrafficLoad ?? 0) >= 80,
    weight: 8,
    personalities: ['pessimist', 'political', 'neutral', 'funny'],
    templates: [
      tf((s) => `Congestión urbana al ${s.avgTrafficLoad ?? 0}%. Llegué al trabajo en taxi y tardé lo mismo a pie. Alguien construya una avenida ya 🚗`),
      t('El tráfico está tan mal que los coches se mueven más despacio que yo caminando. Y yo camino despacio 🐢'),
      t('Propuesta: renombrar la ciudad a "Terminal Parking". Es más honesto con la situación actual'),
      t('Reunión de emergencia municipal: el alcalde llegó tarde. Por el tráfico. La ironía es demasiado intensa'),
      t('Mi coche lleva 40 minutos en el mismo semáforo. Le he puesto nombre: La Trampa. Relación complicada'),
      t('Si alguien del ayuntamiento lee esto: necesitamos avenidas. No pistas de baile, AVENIDAS. Con doble carril 🛣️'),
    ],
  },

  // ── Clean traffic flow ────────────────────────────────────────
  {
    id: 'traffic_flow',
    condition: (s) => (s.avgTrafficLoad ?? 0) < 30 && s.population >= 100,
    weight: 3,
    personalities: ['optimist', 'neutral'],
    templates: [
      t('Vine del centro al trabajo en 8 minutos. OCHO. Esta ciudad tiene algo especial 🚗💨'),
      t('Las avenidas nuevas cambiaron todo. De una hora a quince minutos. Eso es planificación bien hecha'),
      t('Tráfico fluido con 100+ vecinos. No creía que fuera posible. El alcalde hizo los deberes esta vez 🚦✅'),
      t('La autopista del norte vacía a las 9am. Sigo sin creerlo. Parece que alguien leyó el plan de movilidad'),
    ],
  },

  // ── After fire event ─────────────────────────────────────────
  {
    id: 'after_fire',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.severity === 'critical' && e.message.includes('INCENDIO') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 2,
      ),
    weight: 8,
    personalities: ['pessimist', 'political', 'funny', 'neutral'],
    templates: [
      t('LA FÁBRICA ESTÁ EN LLAMAS 🔥🔥🔥 ¿ALGUIEN LLAMÓ A BOMBEROS? ¿ALGUIEN SABE DÓNDE ESTÁN?'),
      t('Veinte minutos esperando a los bomberos. Resultó que la estación más cercana estaba en otro barrio'),
      t('El incendio de ayer nos recordó cuán precaria es nuestra infraestructura de emergencias'),
      t('Vivo a 200 metros del incendio. Estoy bien. La planta no está bien. El alcalde tampoco debería estarlo'),
      t('Foto del incendio de anoche. No subo la foto del alcalde porque me da vergüenza ajena'),
      t('Perdí un mes de trabajo por el incendio. ¿Habrá compensación? Pregunta retórica, ya sé la respuesta'),
      t('La próxima vez que alguien proponga más fábricas sin bomberos, que venga a ver mis fotos de ayer 📸'),
    ],
  },

  // ── High taxes ────────────────────────────────────────────────
  {
    id: 'high_taxes',
    condition: (s) => s.economy.taxRate > 22,
    weight: 4,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      tf((s) => `El ${s.economy.taxRate}% de impuestos es un ROBO con guantes blancos. Histórico en el peor sentido`),
      t('Acabo de ver mi recibo de impuestos. Primero reí, luego lloré, luego archivé una queja formal 😭💸'),
      t('Fui al trabajo, gané dinero, el gobierno se quedó con casi todo. La vida 🙃 #ImpuestosAltos'),
      t('Con lo que pago de impuestos podrías pagarme el alquiler. Solo digo'),
      t('El alcalde subió los impuestos otra vez. ¿A cuánto llegamos? No quiero saber pero ya sé'),
      t('Encuesta: ¿cuántos impuestos es "demasiado"? Respondo: los actuales. Claramente'),
      t('Mis hijos heredarán las deudas fiscales que estoy acumulando. Qué gran legado les dejo 🎁'),
    ],
  },

  // ── Low taxes ─────────────────────────────────────────────────
  {
    id: 'low_taxes',
    condition: (s) => s.economy.taxRate <= 10,
    weight: 3,
    personalities: ['optimist', 'funny', 'neutral'],
    templates: [
      tf((s) => `¡Solo ${s.economy.taxRate}% de impuestos! Más dinero en mi bolsillo, menos en las arcas públicas. Equilibrio raro pero lo acepto 💰`),
      t('Bajaron los impuestos. Mi vecino compró un scooter nuevo. Yo invertí en queso bueno. Prioridades'),
      t('Impuestos bajos = más gasto privado = más actividad = ¿economía funcionando? Vamos a ver'),
      t('No sé si los impuestos bajos son sostenibles pero hoy me alegro. El futuro que se cuide solo'),
      t('¡Tax cut! Primera vez en años que sonrío abriendo el correo 📬'),
    ],
  },

  // ── City in debt ─────────────────────────────────────────────
  {
    id: 'debt',
    condition: (s) => s.economy.debt > 0,
    weight: 5,
    personalities: ['pessimist', 'political'],
    templates: [
      tf((s) => `Deuda municipal: $${s.economy.debt.toLocaleString()}. Y seguimos gastando. Anoté esto para la posteridad`),
      t('La ciudad está en números rojos y el alcalde habla de "inversión estratégica". Creatividad fiscal'),
      t('¿Cómo vamos a pagar esa deuda? Con más impuestos, obvio. La respuesta siempre es impuestos'),
      t('Mi abuela guardaba dinero debajo del colchón. Empiezo a entender por qué 🛏️'),
      t('Deuda = dinero del futuro gastado hoy. Nuestros hijos van a tener opiniones muy fuertes sobre esto'),
      t('Propuesta: el alcalde que generó la deuda que la pague con su sueldo. Matemáticas aplicadas'),
      t('Llevamos X meses en deuda. No voy a decir cuántos porque me daría depresión contarlos'),
    ],
  },

  // ── Big debt ─────────────────────────────────────────────────
  {
    id: 'big_debt',
    condition: (s) => s.economy.debt > 8000,
    weight: 7,
    personalities: ['pessimist', 'political'],
    templates: [
      tf((s) => `$${s.economy.debt.toLocaleString()} de deuda. Esta ciudad no está administrada, está hipotecada`),
      t('ALERTA: la deuda superó lo imaginable. Adjunto screenshoot por si alguien lo niega después'),
      t('Ya no es una crisis financiera. Es una obra de teatro absurda de dos actos: gastar y endeudarse'),
      t('Vivir en una ciudad quebrada tiene su encanto. Si cierras los ojos muy fuerte, casi parece normal'),
      t('Mi inversión más inteligente fue no invertir en esta ciudad. Dramático pero real'),
    ],
  },

  // ── Good economy ─────────────────────────────────────────────
  {
    id: 'good_economy',
    condition: (s) => s.economy.lastIncome > 0 && s.economy.lastIncome >= s.economy.lastExpenses * 1.3 && s.economy.debt === 0,
    weight: 4,
    personalities: ['optimist', 'neutral'],
    templates: [
      tf((s) => `Ingresos: $${s.economy.lastIncome} | Gastos: $${s.economy.lastExpenses}. Esto se llama superávit. Me gusta como suena`),
      t('La economía está funcionando. Me niego a añadir un "por ahora". Dejemos vivir el momento ✨'),
      t('Conseguí trabajo en el nuevo comercio del barrio. El mercado laboral está ACTIVO 🎉'),
      t('Mi jefe habló de subir sueldos. Primera vez que escucho eso en mucho tiempo. Llorando un poco'),
      t('Abrieron tres negocios nuevos en mi calle esta semana. El barrio está evolucionando, siento el cambio'),
      t('Cuando la economía va bien la gente sonríe más. Teoría comprobada empíricamente hoy en el mercado'),
    ],
  },

  // ── Population boom ──────────────────────────────────────────
  {
    id: 'population_boom',
    condition: (s) => s.population > 50 && s.happiness >= 70,
    weight: 3,
    personalities: ['optimist', 'neutral', 'funny'],
    templates: [
      t('Llegaron como 40 familias nuevas esta semana. ¡Bienvenidos! Ya les explicaré las reglas del edificio 👋'),
      tf((s) => `Somos ${s.population} ciudadanos. Cuando llegué éramos 10. Los tiempos cambian 🏙️`),
      t('La ciudad creció tanto que ya no recuerdo las caras de mis vecinos originales. Cosas de ciudad grande'),
      t('Nueva familia se mudó al 4B. Les traje un pastel. Me devolvieron el molde. Buena señal 🎂'),
      t('Los nuevos vecinos llegaron de LejoCity porque aquí la vida es mejor. Orgullo local 💪 #TerminalCity'),
      t('Crecimiento = más gente = más ideas = más energía. O eso dice la teoría. La práctica ya veremos'),
    ],
  },

  // ── Empty city ───────────────────────────────────────────────
  {
    id: 'empty_city',
    condition: (s) => s.population === 0,
    weight: 4,
    personalities: ['neutral', 'funny', 'optimist'],
    templates: [
      t('Soy literalmente el primer habitante registrado. La historia comienza aquí. Presión 😅'),
      t('La ciudad está vacía pero tiene potencial infinito. O eso me digo para dormir'),
      t('Tweet desde el primer edificio del nuevo asentamiento. Año cero. Día uno. Vamos'),
      t('Primer reporte ciudadano: todo es tierra y posibilidades. El optimismo es gratis, lo aprovecho'),
      t('Mis vecinos: el viento, una ardilla sospechosa y el señor que construyó la primera carretera 🏗️'),
    ],
  },

  // ── No roads ─────────────────────────────────────────────────
  {
    id: 'no_roads',
    condition: (s) => !s.hasInfrastructure,
    weight: 5,
    personalities: ['pessimist', 'political', 'funny'],
    templates: [
      t('Llevo semanas esperando que conecten mi barrio a la red vial. ¿Soy invisible? 🛤️'),
      t('Para ir al trabajo cruzo tres lotes baldíos. El alcalde los llama "senderos naturales". Los llamo "no hay carretera"'),
      t('Sin carreteras no hay conexión. Sin conexión no hay comunidad. Sin comunidad... ¿qué somos? 🤔'),
      t('Mi vecino tiene un carro. No puede usarlo porque no hay calle. El absurdo hecho ciudad'),
      t('La primera carretera que construyan me parece bien. La primera. Ya iré al acto inaugural 🎊'),
    ],
  },

  // ── Parks ────────────────────────────────────────────────────
  {
    id: 'has_parks',
    condition: (s) => s.tiles.some((t) => t.type === 'park'),
    weight: 3,
    personalities: ['optimist', 'neutral', 'funny'],
    templates: [
      t('El parque nuevo quedó HERMOSO. Necesitamos más zonas verdes. Seguimos luchando 🌳'),
      t('Me fui a correr al parque. Me crucé con 4 vecinos. Esta comunidad tiene alma, se los juro'),
      t('Foto de los árboles del parque al atardecer. Mi feed necesitaba más verde 🌿 #PixelGreen'),
      t('Los niños del edificio ya tienen donde jugar. Pequeñas victorias que valen mucho'),
      t('El parque es el tercer pulmón de esta ciudad. El primero y segundo los perdí buscándolos, pero este lo tenemos'),
      t('Me senté en el parque a no hacer nada. Altamente recomendado como actividad ciudadana 🪑'),
    ],
  },

  // ── Production chain complete ────────────────────────────────
  {
    id: 'production_ok',
    condition: (s) => s.productionChains.some((c) => c.satisfied),
    weight: 3,
    personalities: ['neutral', 'optimist'],
    templates: [
      t('La cadena de producción está funcionando. Del campo a la mesa sin interrupciones. Civilización 🌾'),
      t('Los artesanos de la calle 7 me vendieron herramientas de primera calidad. Eso antes no pasaba 🔨'),
      t('Pasé por la panadería. Pan fresco, hecho con trigo local, molido aquí. Orgullo productivo'),
      t('Nuestros granjeros abastecen a toda la ciudad. La próxima vez que comas, da las gracias ♠'),
      t('La cadena productiva funcionando = empleos = ingresos = futuro. La teoría hecha realidad'),
    ],
  },

  // ── Tier 2 unlocked ──────────────────────────────────────────
  {
    id: 'tier2_unlocked',
    condition: (s) => s.productionChains.some((c) => c.chainId === 'food-advanced' && c.satisfied),
    weight: 4,
    personalities: ['optimist', 'neutral'],
    templates: [
      t('¡Ascendí a trabajador oficial! 🎉 Gracias a la nueva panadería y el molino del barrio'),
      t('Mi familia lleva dos generaciones de agricultores. Yo soy la primera obrera. Orgullo familiar grande'),
      t('El molino empezó a producir. El pan ya no escasea. Pequeña revolución culinaria local 🍞'),
      t('La cadena Granja → Molino → Panadería funcionando = la ciudad creció un nivel. Nosotros también'),
      t('Primer día como obrera. El alcalde no me mandó flores pero mis vecinos sí me aplaudieron 👏'),
    ],
  },

  // ── Tier 3 unlocked ──────────────────────────────────────────
  {
    id: 'tier3_unlocked',
    condition: (s) => s.productionChains.some((c) => c.chainId === 'tools-production' && c.satisfied),
    weight: 5,
    personalities: ['optimist', 'neutral', 'funny'],
    templates: [
      t('¡ARTESANA OFICIAL! 🎊 Mina → Fundición → Taller. Tres pasos, una vida cambiada'),
      t('Las herramientas del nuevo taller son de una calidad que no había visto. Progreso tangible ⚒️'),
      t('Mi abuelo era agricultor, mi padre obrero, yo artesana. Así se construye una ciudad 🏗️'),
      t('El taller de herramientas abrió. Fila de 40 personas el primer día. La gente quería trabajar 💪'),
      t('Tier 3 desbloqueado. En términos de videojuego eso significa que llegamos al mid-game. ¿Qué sigue?'),
      t('La fundición huele horrible pero produce las mejores herramientas. Trade-offs de la industria 🔩'),
    ],
  },

  // ── Recession ─────────────────────────────────────────────────
  {
    id: 'recession',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.message.includes('Recesión') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 3,
      ),
    weight: 9,
    personalities: ['pessimist', 'political', 'neutral'],
    templates: [
      t('Recesión confirmada. Estaba prevista por todos menos por los que tenían que prevenirla 📉'),
      t('Mi jefe habló de "ajustes". Ya sabemos qué significa eso. Actualizando el CV por si acaso'),
      t('En recesión hay que ser creativo. Hoy cené lo que encontré en la alacena. Arte culinario involuntario'),
      t('Las recesiones "no duran para siempre" dicen. Ok. ¿Cuánto dura esta exactamente? Solo quiero saber'),
      t('HILO sobre la recesión actual: qué causó, quién avisó y quién no escuchó. Respuestas obvias a los tres'),
      t('Mi cartera llora pero mi espíritu sigue en pie. La pobreza no rompe el carácter, solo lo pone a prueba 💪'),
      t('Recesión económica + impuestos altos + deuda municipal = combinación ganadora para el desastre. Enhorabuena'),
    ],
  },

  // ── Migration boom event ─────────────────────────────────────
  {
    id: 'migration_boom',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.message.includes('Migración masiva') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 2,
      ),
    weight: 6,
    personalities: ['optimist', 'funny', 'neutral'],
    templates: [
      t('¡¡MIGRACIÓN MASIVA!! La gente se entera de lo bien que vivimos aquí 😍 Bienvenidos todos'),
      t('Llegaron tantos vecinos nuevos que se acabó el café del kiosko. Problema de ricos. Los acepto'),
      t('La ciudad creció de golpe. La fila del supermercado también. Todo tiene su precio 😅'),
      t('Nuevos vecinos por todas partes. Le prestamos la ciudad, ellos la hacen más grande. Trueque justo'),
      t('Mi edificio está lleno. Mi barrio está lleno. La ciudad está llena. PERFECTO 🎉 #VenganTodos'),
    ],
  },

  // ── Dense residential ─────────────────────────────────────────
  {
    id: 'dense_city',
    condition: (s) => s.tiles.some((t) => t.type === 'residential' && t.zoneLevel === 3),
    weight: 3,
    personalities: ['neutral', 'funny', 'optimist'],
    templates: [
      t('Mi edificio ya tiene 3 pisos. Cuando llegué había una casita. Esto es crecimiento literal 🏢'),
      t('Desde el tercer piso se ve toda la ciudad. Pequeña pero prometedora. Me quedo 🌆'),
      t('La densidad urbana tiene sus pros: más vecinos, más vida, más ruido, menos sueño. Balance'),
      t('Vivo en la torre más alta del barrio. Vista privilegiada de problemas no resueltos 🔭'),
      t('El barrio densificó. Ahora el ascensor siempre está ocupado. Civilización en toda su expresión'),
    ],
  },

  // ── No hospital / health risk ────────────────────────────────
  {
    id: 'no_hospital',
    condition: (s) =>
      s.population > 20 &&
      !s.tiles.some((t) => t.type === 'hospital'),
    weight: 5,
    personalities: ['pessimist', 'political', 'neutral'],
    templates: [
      t('Me corté cocinando. Fui al "centro médico". Era una carpa con aspirinas. ¿Tenemos hospital? Pregunta seria'),
      t('Ciudad sin hospital = ciudad que apuesta a que nadie se enferme. Estrategia audaz, no lo negaré'),
      t('Mi abuela necesita atención médica. Lo más cercano es a 3 horas. Esto no es una ciudad, es un campamento'),
      t('¿Cuándo construimos el hospital? Mientras el alcalde piensa, yo me vacuno con lo que consigo 💉'),
      t('Sin cobertura sanitaria los más vulnerables sufren primero. No es política, es matemática básica'),
      t('Hilo: por qué una ciudad sin hospital no es ciudad. Respuesta corta: porque la gente se muere más fácil'),
    ],
  },

  // ── Disease outbreak event ────────────────────────────────────
  {
    id: 'disease_outbreak',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.message.includes('Brote de enfermedad') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 3,
      ),
    weight: 9,
    personalities: ['pessimist', 'political', 'neutral', 'funny'],
    templates: [
      t('¡BROTE CONFIRMADO! Vecinos enfermos, sin hospital, sin plan. Esto es lo que pasa cuando ignoramos la sanidad 😷'),
      t('Llevo tres días con fiebre. El "médico" del barrio es el señor que estudió enfermería en 1987. Dios nos cuide'),
      t('El brote empezó en mi calle. Cinco vecinos con síntomas. La alcaldía mandó... un comunicado. Gracias'),
      t('Epidemia en curso. Nota al alcalde: un hospital no es un gasto, es una inversión en no morirnos todos'),
      t('Mi barrio parece escena de película apocalíptica. Todos tosiendo, nadie sabe qué hacer 🤒'),
      t('Antes del brote decíamos "algún día construiremos el hospital". Ese día era hoy. Tarde nos damos cuenta'),
      t('Positivo de la situación: por fin el alcalde mencionó la palabra "sanidad". Progreso, supongo 🙄'),
    ],
  },

  // ── Hospital exists ────────────────────────────────────────────
  {
    id: 'has_hospital',
    condition: (s) => s.tiles.some((t) => t.type === 'hospital'),
    weight: 3,
    personalities: ['optimist', 'neutral'],
    templates: [
      t('¡Inauguraron el hospital! 🏥 Primera vez en la historia de esta ciudad que tenemos sanidad real. Emocionada'),
      t('Fui al hospital nuevo a hacerme un chequeo. El personal es amable, el edificio está limpio. Esto sí'),
      t('Con hospital la ciudad se siente diferente. Más segura. Como si alguien pensara en nosotros'),
      t('Mi vecina tuvo el bebé en el hospital nuevo. Los dos están bien. Con el anterior ni nos arriesgamos 👶'),
      t('Dato: las ciudades con buena sanidad crecen más rápido. Acabamos de dar el paso más importante'),
    ],
  },

  // ── School / education ────────────────────────────────────────
  {
    id: 'has_school',
    condition: (s) => s.tiles.some((t) => t.type === 'school' || t.type === 'university'),
    weight: 3,
    personalities: ['optimist', 'neutral', 'political'],
    templates: [
      t('¡Abren la escuela! 📚 Mis hijos ya tienen donde estudiar. Esta ciudad crece de verdad'),
      t('Primera clase en la escuela nueva. Los niños del barrio llegaron con mochilas. Imagen que no olvidaré'),
      t('Con escuela viene educación, con educación viene futuro. Cadena de causalidad que me gusta mucho'),
      t('La universidad acepta inscripciones. Primera vez que no tengo que salir de la ciudad para estudiar 🎓'),
      t('Inversión en educación = inversión en la próxima generación. Gracias a quien tomó esa decisión'),
      t('Fui de visita a la escuela. Los niños aprendiendo, los maestros motivados. Así se construye una ciudad 📖'),
    ],
  },

  // ── High pollution / industrial smog ─────────────────────────
  {
    id: 'high_pollution',
    condition: (s) => s.avgPollution > 50,
    weight: 6,
    personalities: ['pessimist', 'political', 'neutral'],
    templates: [
      tf((s) => `Contaminación urbana en ${s.avgPollution}/100. Esto ya no es un problema menor, es una emergencia de salud pública 😷`),
      t('Abro la ventana y huele a fábrica. Cierro la ventana y huele a fábrica adentro. Hay que hacer algo'),
      t('El aire de esta ciudad me está enfermando literalmente. Datos > opiniones: ve la calidad del aire #SmogCity'),
      t('¿Saben qué tienen en común los vecinos de mi calle? Todos tosemos. Todos. El alcalde no tose, él vive lejos'),
      t('Mis plantas de interior murieron. MIS PLANTAS DE INTERIOR. El aire exterior las mató desde adentro'),
      t('Propongo que el alcalde visite el barrio industrial un día. Sin mascarilla. Que respire lo que respiramos 🏭'),
    ],
  },

  // ── Clean city ────────────────────────────────────────────────
  {
    id: 'clean_city',
    condition: (s) => s.avgPollution < 10 && s.tiles.some((t) => t.type === 'industrial'),
    weight: 3,
    personalities: ['optimist', 'neutral'],
    templates: [
      t('Hay industria pero el aire está limpio. Esto es lo que pasa cuando la planificación urbana funciona 🌿'),
      t('Respiré hondo esta mañana. Huele a... nada. Limpio. ¿Cuándo fue la última vez que eso fue posible? Hoy 🍃'),
      t('Ciudad industrial y cielo azul. No creía que fuera posible aquí. Los parques y la planta de residuos hacen su trabajo'),
      t('Calidad del aire: excelente. Salud de mis hijos: bien. Esto es lo que exigimos. Que esto dure 💚'),
    ],
  },

  // ── Smog event ────────────────────────────────────────────────
  {
    id: 'industrial_smog',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.message.includes('smog') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 2,
      ),
    weight: 9,
    personalities: ['pessimist', 'political', 'neutral', 'funny'],
    templates: [
      t('¡ALERTA DE SMOG EMITIDA! Por fin reconocen lo que llevamos meses respirando. Gracias por la confirmación oficial 🙄'),
      t('Alerta de smog. Mis pulmones ya lo sabían desde enero, pero bueno, que la ciencia también lo diga'),
      t('El smog llegó al nivel crítico. Puse una foto del cielo: naranja a las 10am. Arte urbano involuntario'),
      t('Me dijeron que construyeran parques. Me dijeron que era "exagerado". Alerta de smog. Me deben una disculpa 🌳'),
      t('Smog warning en mi teléfono. Tercer mes seguido. Propongo cambiar el nombre: Ciudad del Smog. Más honesto'),
      t('Vivo cerca de tres fábricas y cero parques. La alerta de smog me tomó completamente por sorpresa. Totalmente 🙃'),
    ],
  },

  // ── Water discovery event ────────────────────────────────────
  {
    id: 'water_discovery',
    condition: (s) =>
      s.eventLog.some(
        (e) => e.message.includes('agua subterránea') &&
               e.year === s.year && Math.abs(e.month - s.month) <= 2,
      ),
    weight: 7,
    personalities: ['optimist', 'funny', 'neutral'],
    templates: [
      t('¡DESCUBRIERON AGUA SUBTERRÁNEA! 💧 Esto cambia todo. Alguien que construya una bomba YA'),
      t('Agua bajo nuestros pies todo este tiempo y no lo sabíamos. La metáfora es obvia, no la diré'),
      t('Noticia: agua hallada. Reacción del alcalde: silencio. Reacción ciudadana: efusiva. Como siempre'),
      t('El vecino del 3A dijo que él "ya lo sabía". El vecino del 3A siempre lo sabe todo después 🙄'),
      t('Agua subterránea = oportunidad. Alguien con visión que la aproveche antes de que la privaticen'),
    ],
  },
];
