import type { GameState, Milestone } from '../engine/types';
import { serviceCoverageRatio } from '../engine/services';

// ─────────────────────────────────────────────
//  Milestone definitions — conditions + rewards + posts
// ─────────────────────────────────────────────

export interface MilestoneDef {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly reward: number;
  readonly isVictory: boolean;
  readonly condition: (state: GameState) => boolean;
  /** Optional Pixelgram post text when milestone is achieved */
  readonly pixelgramPost: string;
}

export const MILESTONE_DEFS: MilestoneDef[] = [
  {
    id: 'first_road',
    title: 'Primera Carretera',
    description: 'Traza la primera vía de la ciudad',
    reward: 1_000,
    isVictory: false,
    condition: (s) => s.hasInfrastructure,
    pixelgramPost:
      '¡Alguien trazó la primera carretera! Ahora SÍ empieza la ciudad 🛣️ #PrimerPaso',
  },
  {
    id: 'first_residents',
    title: '¡Llegan los Vecinos!',
    description: 'Alcanza 20 residentes en la ciudad',
    reward: 2_000,
    isVictory: false,
    condition: (s) => s.population >= 20,
    pixelgramPost:
      'Ya somos 20 vecinos 🎉 Pequeño pero nuestro. #ComunidadTerminal',
  },
  {
    id: 'lights_on',
    title: 'La Ciudad Ilumina',
    description: 'Cubre el 60% de zonas residenciales con electricidad',
    reward: 2_500,
    isVictory: false,
    condition: (s) => serviceCoverageRatio(s, 'electricity') >= 0.6,
    pixelgramPost:
      'Finalmente hay luz en más de la mitad de la ciudad ⚡ Pequeñas victorias que se celebran',
  },
  {
    id: 'first_business',
    title: 'Primer Negocio',
    description: 'Una zona comercial supera los 10 trabajadores',
    reward: 1_500,
    isVictory: false,
    condition: (s) => s.tiles.some((t) => t.type === 'commercial' && t.population >= 10),
    pixelgramPost:
      'El primer negocio local ya tiene empleados. La economía empieza a rodar 💼 #LocalBusiness',
  },
  {
    id: 'production_chain',
    title: 'Motor Productivo',
    description: 'Completa tu primera cadena de producción',
    reward: 3_000,
    isVictory: false,
    condition: (s) => s.productionChains.some((c) => c.satisfied),
    pixelgramPost:
      'La cadena de producción funciona end-to-end 🏭 Del campo a la mesa, como debe ser',
  },
  {
    id: 'first_tier2',
    title: 'Ciudad en Crecimiento',
    description: 'Un barrio alcanza nivel 2 de densidad',
    reward: 4_000,
    isVictory: false,
    condition: (s) => s.tiles.some((t) => t.type === 'residential' && t.zoneLevel >= 2),
    pixelgramPost:
      'Mi barrio subió a densidad nivel 2. Los edificios crecen hacia arriba 🏢 #Densificación',
  },
  {
    id: 'hundred_residents',
    title: 'Ciudad de Cien',
    description: 'Alcanza 100 residentes',
    reward: 5_000,
    isVictory: false,
    condition: (s) => s.population >= 100,
    pixelgramPost:
      'SOMOS 100 PIXELS 🎊🎊🎊 Esto ya es una ciudad de verdad. Gracias a todos',
  },
  {
    id: 'safe_city',
    title: 'Ciudad Segura',
    description: '70% de cobertura de policía Y bomberos',
    reward: 3_500,
    isVictory: false,
    condition: (s) =>
      serviceCoverageRatio(s, 'police') >= 0.7 &&
      serviceCoverageRatio(s, 'fire') >= 0.7,
    pixelgramPost:
      'Por primera vez en meses dormiré tranquila 🛡️ Cobertura de seguridad al 70%. Gracias alcalde',
  },
  {
    id: 'tier3_district',
    title: 'Metrópolis en Ciernes',
    description: 'Un barrio alcanza nivel 3 de densidad máxima',
    reward: 8_000,
    isVictory: false,
    condition: (s) => s.tiles.some((t) => t.type === 'residential' && t.zoneLevel >= 3),
    pixelgramPost:
      'Nivel 3 de densidad. Desde el piso 8 se ve toda la ciudad. Esto ya es una metrópolis 🌆',
  },
  {
    id: 'traffic_master',
    title: 'Maestro del Tráfico',
    description: 'Mantén congestión promedio < 50% con ≥200 habitantes',
    reward: 6_000,
    isVictory: false,
    condition: (s) => s.population >= 200 && (s.avgTrafficLoad ?? 0) < 50,
    pixelgramPost:
      'Increíble — 200+ vecinos y el tráfico fluye sin atascos. Eso es planificación urbana de verdad 🚦✨',
  },
  {
    id: 'city_charter',
    title: '⭐ CARTA DE CIUDAD',
    description: '500 residentes + 75% felicidad + $25,000 en balance',
    reward: 20_000,
    isVictory: true,
    condition: (s) =>
      s.population >= 500 && s.happiness >= 75 && s.economy.balance >= 25_000,
    pixelgramPost:
      '¡¡¡CARTA DE CIUDAD OTORGADA!!! Terminal City es oficialmente reconocida como CIUDAD ⭐🎊🏆 #CartaDeCiudad #Historia',
  },
];

/** Return the initial Milestone[] for GameState (all incomplete) */
export function createInitialMilestones(): Milestone[] {
  return MILESTONE_DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    reward: def.reward,
    isVictory: def.isVictory,
    completed: false,
  }));
}
