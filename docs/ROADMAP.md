# Terminal City — Feature Roadmap

Ordered by **dependency and impact**. Each feature has its own branch. Work top to bottom — later features build on earlier ones.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped and merged to `main` |
| ⬜ | Not started |

---

## Implementation Order

### Phase 1 — Foundation Layer ✅ COMPLETE

| # | Feature | Branch | Status |
|---|---------|--------|--------|
| 1 | Healthcare & Education buildings | `feature/healthcare-education` | ✅ merged |
| 2 | Undo / Save Slots | `feature/undo-save-slots` | ✅ merged |
| 3 | Municipal Bonds / Loans | `feature/municipal-bonds` | ✅ merged |
| 4 | Statistics Panel (Sparklines) | `feature/statistics-sparklines` | ✅ merged |

---

### Phase 2 — Core Simulation Depth ✅ COMPLETE

| # | Feature | Branch | Status |
|---|---------|--------|--------|
| 5 | Pollution System | `feature/pollution-system` | ✅ merged |
| 6 | Advanced Zoning Density | `feature/advanced-zoning-density` | ✅ merged |
| 7 | Real Traffic Simulation | `feature/traffic-simulation` | ✅ merged |
| 8 | District System | `feature/district-system` | ✅ merged |

---

### Phase 3 — Economy & Transport
*All three can start now — independent of each other.*

| # | Feature | Branch | Depends On | Status |
|---|---------|--------|------------|--------|
| 9  | Public Transportation | `feature/public-transportation` | #7 ✅ | ⬜ |
| 10 | Trade & Export Economy | `feature/trade-export-economy` | production chains (in main) | ⬜ |
| 11 | Expanded Natural Disasters | `feature/expanded-disasters` | #1 ✅, #5 ✅ | ⬜ |

---

### Phase 4 — Late Game & Replayability

| # | Feature | Branch | Depends On | Status |
|---|---------|--------|------------|--------|
| 12 | Tourism System | `feature/tourism-system` | #8 ✅, #9 | ⬜ |
| 13 | Unique Landmark Buildings | `feature/landmark-buildings` | #12 | ⬜ |
| 14 | Citizen Simulation | `feature/citizen-simulation` | #8 ✅, Pixelgram ✅ | ⬜ |
| 15 | Scenario / Challenge Mode | `feature/scenario-mode` | all prior phases | ⬜ |

---

## What Was Actually Shipped (Phase 1–2)

### 1 · Healthcare & Education ✅

- `hospital` (radius 7, $3K, $150 maint) — covers `health` service
- `school` (radius 5, $1.5K, $75 maint) — covers `education` service
- `university` (radius 8, $8K, $400 maint) — tier-3 unlock
- 7 total services wired into happiness formula (+10 each); base 30
- Without hospital: residential capped at level 2
- Events: `disease_outbreak` (health coverage < 40% → pop loss)
- Pixelgram scenarios: `no_hospital`, `has_hospital`, `has_school`, `disease_outbreak`

**Files:** `engine/types.ts`, `engine/tick.ts`, `engine/economy.ts`, `engine/events.ts`, `data/buildings.ts`, `data/pixelgramScenarios.ts`, `components/BuildCatalog.tsx`

---

### 2 · Undo / Save Slots ✅

- `actionHistory: GameState[]` in store (max 10) for undo
- `undo` command → `__UNDO__` signal
- 3 save slots in localStorage (`terminal-city-save-0/1/2`)
- `save <slot>` / `load <slot>` / `saves` commands
- Auto-save every 12 ticks to slot 0

**Files:** `store/gameStore.ts`, `commands/commands.ts`, `components/CommandConsole.tsx`

---

### 3 · Municipal Bonds ✅

- `bonds: Bond[]` + `bondDefaultRisk: number` in `EconomyState`
- Bond rating AAA→D from debt-to-annual-income ratio
- Interest rates: AAA 3% → B 15%; D = unavailable
- `bond <amount>` command — 20-year amortized loan issued at current rating
- Monthly bond payments auto-deducted each tick
- Bond default event after 3 consecutive months negative cashflow with active bonds
- `view bonds` command — table with rating, monthly obligations, months remaining

**Files:** `engine/types.ts`, `engine/economy.ts`, `engine/tick.ts`, `commands/commands.ts`, `engine/events.ts`

---

### 4 · Statistics Sparklines ✅

- `history: HistorySnapshot[]` on GameState — pushed every tick, max 24 entries
  - Fields: `month`, `year`, `population`, `balance`, `happiness`, `income`, `expenses`, `rDemand`, `cDemand`, `iDemand`
- `view charts` → `__CHARTS__` signal; charts panel renders ASCII sparklines (`▁▂▃▄▅▆▇█`)
- `livestats` → `__LIVESTATS__` signal (inline live stats overlay)

**Files:** `engine/types.ts`, `engine/tick.ts`, `commands/commands.ts`, `components/CommandConsole.tsx`, `components/ChartsPanel.tsx`

---

### 5 · Pollution System ✅

- `pollution: number` (0–100) per tile; `avgPollution: number` on GameState
- Emitters (Chebyshev diffusion): `industrial` 35/r4, `power_plant` 50/r5, `foundry` 60/r4, `iron_mine` 25/r3
- Industrial emission scales by densityCap: light=0.5×, medium=1.0×, heavy=1.5×
- Reducers: `park` −20/r3; `waste_plant` −40/r5 ($4K, $200 maint)
- Happiness penalty: −0.5/point above 30 (halved with hospital coverage)
- Population cap multiplier: `1 − (pollution−50)/100` when pollution > 50
- Event: `smog_warning` (avgPollution ≥ 60, throttled 6 ticks → happiness −10)
- Visual: orange tint overlay proportional to pollution level
- `waste_plant` added as new ZoneType (not a modifier overlay — fits existing zone system)
- Pixelgram scenarios: `high_pollution`, `clean_city`, `industrial_smog`

**Files:** `engine/types.ts`, `engine/pollution.ts` (new), `engine/tick.ts`, `engine/events.ts`, `data/buildings.ts`, `renderer/asciiMap.ts`, `renderer/MapRenderer.tsx`, `data/pixelgramScenarios.ts`

---

### 6 · Advanced Zoning Density ✅

- `densityCap: 1|2|3` per tile (no new ZoneTypes — avoids combinatorial explosion)
- `DensityTool` union: `residential-low|medium|high`, `commercial-low|medium|high`, `industrial-light|medium|heavy`
- High-density (cap=3): requires pollution <30 AND all 7 services; falls back to level 2 otherwise
- Level-0 residential shows `·` / `∙` / `.` by densityCap
- `DENSITY_INCOME_MULT = {1: 0.7, 2: 1.0, 3: 1.3}` for commercial/industrial
- `view density` command: tile overlay showing densityCap
- BuildCatalog ZONES: 9 items (3 zones × 3 densities) with L/M/H badges

**Files:** `engine/types.ts`, `engine/tick.ts`, `engine/economy.ts`, `commands/commands.ts`, `store/gameStore.ts`, `renderer/asciiMap.ts`, `components/BuildCatalog.tsx`

---

### 7 · Real Traffic Simulation ✅

- `trafficLoad: number` (0–100) per road tile; `avgTrafficLoad: number` on GameState
- New ZoneTypes: `avenue` (capacity 60, $30/tile), `highway` (capacity 200, $80/tile)
- Load generation: residential 0.12/pop, commercial 1.2/level, industrial 0.8/level
- Density traffic mult: low=1.5×, medium=1.0×, high=0.65×
- 30% load diffuses to road neighbors (1 pass); normalised per road capacity
- Congestion effects: ≥70% → happiness −3; ≥90% → happiness −8; ≥95% → C/I income ×0.7
- `avenue` / `highway` commands
- `view traffic` → `__TRAFFIC__` signal toggles heatmap overlay (green→red)
- Pixel cars: highway ×1.67 speed; congestion ≥95% → near-stopped animation
- Event: `traffic_jam` (avgTrafficLoad ≥ 80, throttled 6 ticks)
- Milestone: `traffic_master` (avgTrafficLoad <50% at pop ≥200, $6K reward)
- Pixelgram scenarios: `traffic_jam`, `traffic_flow`

**Files:** `engine/types.ts`, `engine/traffic.ts` (new), `engine/tick.ts`, `engine/economy.ts`, `engine/events.ts`, `commands/commands.ts`, `renderer/MapRenderer.tsx`, `renderer/pixelCars.ts`, `renderer/asciiMap.ts`, `data/buildings.ts`, `data/milestoneDefs.ts`, `data/pixelgramScenarios.ts`

---

### 8 · District System ✅

- `District` + `DistrictPolicies` + `SpendingPriority` interfaces in `types.ts`
- `districts: District[]` on GameState; max 4 (city_hall in #13 raises to 8)
- `engine/districts.ts` (new): `createDistrict`, `paintDistrictTile` (toggle), `renameDistrict`, `deleteDistrict`, `findDistrictByName`, `getTileDistrict`, `isZoneBanned`, `districtCentroid`, `buildDistrictMap` (O(n) index→District map)
- Paint mode: `district create <name>` → `__DISTRICT_PAINT__:<id>` signal; tile clicks toggle membership; `district stop` → `__DISTRICT_PAINT_OFF__`
- Policies (all pure, applied each tick):
  - `district policy tax <name> <1–30>` — per-district tax rate override
  - `district policy ban <name> <zone>` — zone command refuses placement; stored in `bannedZones[]`
  - `district policy priority <name> services` — service building radius ×1.2
  - `district policy priority <name> infrastructure` — maintenance costs ×0.8
  - `district policy priority <name> growth` — population growth ×1.2
- `district rename`, `district delete` commands
- `view districts` — lists districts with tile count, color, and active policies
- Canvas: semi-transparent fill + edge borders + name label at centroid; paint-mode hover tints tile with district color
- Note: spec had `allowedZones`; shipped `bannedZones` instead (opt-out is more ergonomic)

**Files:** `engine/types.ts`, `engine/districts.ts` (new), `engine/economy.ts`, `engine/tick.ts`, `engine/world.ts`, `commands/commands.ts`, `components/CommandConsole.tsx`, `renderer/MapRenderer.tsx`, `store/gameStore.ts`

---

## Feature Specs — Remaining (#9–#15)

### 9 · Public Transportation (`feature/public-transportation`) ⬜

**Goal:** Reduce traffic, enable high-density zones, force infrastructure planning.

- New tile types: `bus_stop`, `metro_station`, `metro_tunnel`
- `busline create <name>` → enter stop-placement mode; click road tiles to add stops in order
- `busline delete <name>`, `busline view` commands
- Bus mechanics per tick:
  - Ridership = sum of population within radius 3 of each stop × demand factor
  - Capacity = stops × 50 passengers/month
  - Each passenger-trip removes 1 traffic unit from road network
  - Monthly cost = $50 × number of stops
- Metro: $500/tile (tunnel), $800/station; radius 5; ridership × 3 capacity vs bus
- `view transit` toggle: coverage radius overlay in MapRenderer
- High-density zones (densityCap=3) require transit access within radius 4 (tick enforcement — builds on #6)
- Pixelgram scenarios: `new_metro`, `bus_delay`, `city_connected`
- Milestones: `first_bus_line`, `metro_city` (3+ metro stations + pop ≥ 300)

**Files:** `engine/types.ts`, `engine/tick.ts`, `commands/commands.ts`, `renderer/asciiMap.ts`, `renderer/MapRenderer.tsx`, `data/buildings.ts`, `data/pixelgramScenarios.ts`, `data/milestoneDefs.ts`

---

### 10 · Trade & Export Economy (`feature/trade-export-economy`) ⬜

**Goal:** Give production chains a real economic purpose beyond tier unlocking.

- Add `tradeBalance: number` and `tradeRoutes: TradeRoute[]` to GameState
- 4 AI neighbor cities as trade partners (intro EventLog sequence)
- Satisfied chain with surplus → auto-export: income += `outputPerTick × exportPrice`
- Unsatisfied chain → auto-import at 1.5× export price
- `trade <resource> export|import|auto` command
- Trade disruption event: 10% chance/year, route interrupted 3 months
- `view trade` command: resource table with monthly income/cost

**Files:** `engine/types.ts`, `engine/economy.ts`, `engine/tick.ts`, `engine/events.ts`, `engine/production.ts`, `commands/commands.ts`

---

### 11 · Expanded Natural Disasters (`feature/expanded-disasters`) ⬜

**Goal:** More variety, more tension, more Pixelgram drama.

- `earthquake` — 1%/year after year 3; destroys 3×3, happiness −20
- `flood` — 2%/year if water tiles exist; inundates adjacent non-road tiles 3 months
- `disease_outbreak` — 3% chance if health coverage < 40%; pop loss 5%/month × 3 months
- `labor_strike` — 5% chance if happiness < 40% AND industrial present; industrial income −80% × 2 months
- `tornado` — 0.5%/year; 1-tile-wide path across map, demolishes everything in path
- Disaster insurance: budget slider $0–$1K/month; reduces all damage by `budget/1000 × 60%`
- `view disasters` command: disaster history + current insurance level
- All disasters trigger Pixelgram citizen reactions

**Files:** `engine/types.ts`, `engine/events.ts`, `engine/tick.ts`, `data/balanceConfig.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts`

---

### 12 · Tourism System (`feature/tourism-system`) ⬜

**Goal:** New income stream independent of population growth.

- `tourismDemand: number` on GameState; `T` added to RCI display
- Formula: `happiness × parkDensity × landmarkCount × transitAccess × (1 − avgPollution/100)`
- New zone type: `hotel` — commercial variant, income from tourism demand not population
- Tourism income: `tourismDemand × hotelCount × taxRate / 100`
- New buildings (milestone-unlocked): `stadium` ($20K), `museum` ($15K), `convention_center` ($25K) — each +15 tourismDemand within radius 8
- Seasonal modifier: summer (months 6–8) ×1.4; winter (months 12–2) ×0.7
- Event: `tourism_boom`
- `view tourism` command: demand breakdown, hotel revenue, seasonal forecast
- Pixelgram scenarios: `tourist_town`, `hotel_opening`, `museum_inauguration`

**Files:** `engine/types.ts`, `engine/tick.ts`, `engine/economy.ts`, `engine/events.ts`, `data/buildings.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts`, `data/milestoneDefs.ts`

---

### 13 · Unique Landmark Buildings (`feature/landmark-buildings`) ⬜

**Goal:** Milestone-unlocked buildings that transform city strategy.

10 landmarks, each unlocked by a specific prior milestone:

| Landmark | Unlocked By | Effect | Cost |
|----------|------------|--------|------|
| `city_hall` | `city_charter` milestone | Raises MAX_DISTRICTS 4 → 8 (patch `districts.ts:27`) | $30K |
| `central_park` | 3×3 cleared area | Happiness +15 citywide, pollution −20 radius 6 | $50K |
| `tech_campus` | `tier3_district` + university | High-income office zoning, +C demand 20 | $40K |
| `port` | Water-adjacent tile | Maritime trade ×2 export income | $35K |
| `airport` | Highway access + pop ≥ 300 | Tourism +40, monthly migration boom | $60K |
| `sports_arena` | pop ≥ 200 + commercial ≥ 10 | Happiness +10, tourism +20 | $25K |
| `cathedral` | pop ≥ 150 | Happiness +8, milestone reward event | $15K |
| `research_lab` | university + tier3 | Disaster probability −30% | $45K |
| `green_energy_plant` | parks ≥ 5, no coal events | Replaces power_plant pollution with zero emission | $55K |
| `grand_station` | metro + bus lines active | Transit capacity +50% citywide, tourism +25 | $50K |

- `build <x> <y> <landmark>` command
- Landmarks rendered with `★` prefix on map
- `view landmarks` command: unlocked/locked list with requirements

**Files:** `data/buildings.ts`, `data/milestoneDefs.ts`, `engine/tick.ts`, `renderer/asciiMap.ts`, `commands/commands.ts`

---

### 14 · Citizen Simulation (`feature/citizen-simulation`) ⬜

**Goal:** Make the city feel inhabited. Extend Pixelgram into a persistent NPC layer.

- 30 persistent named citizens (extend current 15 Pixelgram profiles)
- Each citizen: `homeZone: {x,y}`, `workZone: {x,y}|null`, `happiness: number`, `yearsResiding: number`
- Citizens assigned homes on residential zone growth; jobs from commercial/industrial
- Per-tick updates:
  - Home tile damaged → unhappy (−30), may emigrate after 2 months
  - Work tile demolished → unemployed, happiness −10/month
  - Transit covers home → commute satisfaction +10
  - Pollution > 50 at home → health risk, happiness −15
- Pixelgram posts use citizen's real game state (not just scenario templates)
- Mayoral approval = average citizen happiness (StatusPanel)
- `view citizens` command: top 10 happiest + 5 most at-risk
- Emigrating citizen → farewell Pixelgram post

**Files:** `engine/types.ts`, `engine/tick.ts`, `engine/pixelgram.ts`, `data/pixelgramScenarios.ts`, `commands/commands.ts`, `components/StatusPanel.tsx`

---

### 15 · Scenario / Challenge Mode (`feature/scenario-mode`) ⬜

**Goal:** Replayability through preset starting conditions and unique win conditions.

6 scenarios selectable at `new game <scenario>`:

| Scenario | Starting State | Win Condition |
|----------|--------------|---------------|
| `sandbox` | Default | `city_charter` milestone |
| `industrial_town` | 3 factories, pollution 40, $8K | 300 pop + happiness ≥ 60% |
| `island_city` | Water surrounds edges, no roads | Port built + 200 pop + positive trade |
| `debt_crisis` | $50K debt, no buildings | Surplus ≥ $10K + pop ≥ 100 within 20 years |
| `migration_boom` | 200 pop arrives month 1, no services | Happiness ≥ 60% for 12 consecutive months |
| `disaster_recovery` | 40% map damaged | Rebuild to 500 pop within 15 years |

- Each scenario has a 3–4 post Pixelgram intro thread with backstory
- Win/loss conditions checked every tick (separate from sandbox milestones)
- `view scenario` command: objectives, progress bars, time remaining

**Files:** `engine/types.ts`, `engine/world.ts`, `engine/tick.ts`, `store/gameStore.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts` + new `data/scenarios.ts`

---

## Branch Quick Reference

```
main
├── feature/healthcare-education      ✅ merged
├── feature/undo-save-slots           ✅ merged
├── feature/municipal-bonds           ✅ merged
├── feature/statistics-sparklines     ✅ merged
├── feature/pollution-system          ✅ merged
├── feature/advanced-zoning-density   ✅ merged
├── feature/traffic-simulation        ✅ merged
├── feature/district-system           ✅ merged
├── feature/public-transportation     ⬜ start now (needs #7 ✅)
├── feature/trade-export-economy      ⬜ start now (independent)
├── feature/expanded-disasters        ⬜ start now (needs #1 ✅, #5 ✅)
├── feature/tourism-system            ⬜ needs #9
├── feature/landmark-buildings        ⬜ needs #12
├── feature/citizen-simulation        ⬜ start now (needs #8 ✅)
└── feature/scenario-mode             ⬜ last
```

## Current `main` State Summary

**GameState fields added across Phase 1–2:**
```typescript
history: HistorySnapshot[];    // #4 — 24-month rolling chart history
avgPollution: number;          // #5 — city-wide avg, recomputed each tick
avgTrafficLoad: number;        // #7 — city-wide avg, recomputed each tick
districts: District[];         // #8 — up to 4 player-defined districts
// economy includes: bonds[], bondDefaultRisk  (#3)
```

**Tile fields added:**
```typescript
pollution: number;     // #5
densityCap: 1|2|3;    // #6
trafficLoad: number;   // #7
```

**ZoneTypes added:** `hospital`, `school`, `university`, `waste_plant` (#1/#5), `avenue`, `highway` (#7)

**New engine modules:** `engine/pollution.ts` (#5), `engine/traffic.ts` (#7), `engine/districts.ts` (#8)

## Merge Strategy

Each feature branch is cut from `main`. After completing a branch:
1. Run `npm test` + manual smoke test in the browser
2. Merge to `main` before starting branches that depend on it
3. Phase 3 branches (#9, #10, #11) have no mutual dependencies — can be done in any order
