// ─────────────────────────────────────────────
//  Domain types for Terminal City
// ─────────────────────────────────────────────

export type ZoneType =
  | 'empty'
  | 'water'
  | 'road'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'farm'
  | 'park'
  | 'fire_station'
  | 'police_station'
  | 'power_plant'
  | 'water_pump'
  | 'hospital'
  | 'school'
  | 'university'
  | 'granary'
  | 'mill'
  | 'bakery'
  | 'iron_mine'
  | 'foundry'
  | 'tools_workshop';

export type ServiceType = 'water' | 'electricity' | 'garbage' | 'police' | 'fire' | 'education' | 'health';

export type ProductionTier = 1 | 2 | 3;

/** Coverage map: which services reach this tile */
export type CoverageMap = Partial<Record<ServiceType, boolean>>;

export interface Tile {
  readonly x: number;
  readonly y: number;
  type: ZoneType;
  /** Density level 0 (empty plot) to 3 (dense) */
  zoneLevel: 0 | 1 | 2 | 3;
  /** Residents or workers currently on this tile */
  population: number;
  coverage: CoverageMap;
  /** Display character — computed from asciiMap but can be overridden */
  variant: string;
  /** Whether this tile was affected by a recent event */
  damaged: boolean;
  /** Road connectivity flag */
  hasRoadAccess: boolean;
}

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface ServiceBudget {
  readonly service: ServiceType;
  /** Monthly allocation in $. Affects coverage radius. */
  allocation: number;
}

export interface ProductionNode {
  readonly type: ZoneType;
  /** How many units this building produces per tick */
  readonly outputPerTick: number;
  /** Current production (resets each tick) */
  currentOutput: number;
}

export interface ProductionChainState {
  readonly chainId: string;
  /** true if all prerequisites in the chain are satisfied */
  satisfied: boolean;
  /** Which tier this chain unlocks */
  readonly unlockedTier: ProductionTier;
  nodes: ProductionNode[];
}

export type BondRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'B' | 'D';

export interface Bond {
  readonly id: string;
  readonly amount: number;
  readonly termMonths: number;
  monthsRemaining: number;
  readonly monthlyPayment: number;
  readonly interestRate: number;
  readonly rating: BondRating;
}

export interface EconomyState {
  balance: number;
  debt: number;
  /** Monthly income last tick */
  lastIncome: number;
  /** Monthly expenses last tick */
  lastExpenses: number;
  /** Tax rate 5–30 */
  taxRate: number;
  serviceBudgets: ServiceBudget[];
  bonds: Bond[];
  /** Consecutive months with negative net cashflow while bonds are active */
  bondDefaultRisk: number;
}

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface GameEvent {
  readonly id: string;
  readonly year: number;
  readonly month: number;
  readonly message: string;
  readonly severity: EventSeverity;
  /** Tile affected, if any */
  readonly position?: Position;
}

export interface LogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly message: string;
  readonly severity: EventSeverity;
  readonly source: 'game' | 'command' | 'system';
}

/** Real-time residential / commercial / industrial demand indicators (0–100) */
export interface RCIDemand {
  r: number;
  c: number;
  i: number;
}

export interface Milestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly reward: number;
  readonly isVictory: boolean;
  completed: boolean;
  completedYear?: number;
  completedMonth?: number;
}

export interface PixelgramPost {
  readonly id: string;
  readonly year: number;
  readonly month: number;
  readonly authorName: string;
  readonly authorHandle: string;
  readonly authorAvatar: string;
  readonly authorColor: string;
  readonly content: string;
  readonly likes: number;
  readonly reposts: number;
  readonly scenario: string;
}

export type SimulationSpeed = 'pause' | 1 | 2 | 3;

export interface HistorySnapshot {
  readonly month: number;
  readonly year: number;
  readonly population: number;
  readonly balance: number;
  readonly happiness: number;
  readonly income: number;
  readonly expenses: number;
  readonly rDemand: number;
  readonly cDemand: number;
  readonly iDemand: number;
}

export interface GameState {
  readonly worldWidth: number;
  readonly worldHeight: number;
  /** Flat array, row-major: tiles[y * worldWidth + x] */
  tiles: Tile[];
  year: number;
  month: number;
  economy: EconomyState;
  population: number;
  happiness: number;
  productionChains: ProductionChainState[];
  eventLog: GameEvent[];
  log: LogEntry[];
  pixelgramPosts: PixelgramPost[];
  rciDemand: RCIDemand;
  milestones: Milestone[];
  victory: boolean;
  speed: SimulationSpeed;
  /** Whether the auto-tick timer is running */
  running: boolean;
  /** Tick count since game start */
  tickCount: number;
  /** True once first road is placed */
  hasInfrastructure: boolean;
  /** Rolling 24-month history for charts */
  history: HistorySnapshot[];
}

/** Command result returned to the UI */
export interface CommandResult {
  readonly success: boolean;
  readonly message: string;
  readonly severity: EventSeverity;
}

/** Registered command definition */
export interface CommandDefinition {
  readonly name: string;
  readonly aliases: string[];
  readonly description: string;
  readonly usage: string;
  readonly execute: (args: string[], state: GameState) => [GameState, CommandResult];
}

/** Building catalog entry */
export interface BuildingDefinition {
  readonly type: ZoneType;
  readonly name: string;
  readonly char: string;
  readonly color: string;
  readonly cost: number;
  readonly maintenanceCost: number;
  /** Service provided and its radius in tiles */
  readonly service?: { type: ServiceType; radius: number };
  /** Production details if applicable */
  readonly production?: { outputPerTick: number };
  /** Maximum zone level this building supports */
  readonly maxZoneLevel: 0 | 1 | 2 | 3;
}
