# Terminal City — Feature Roadmap

Ordered by **dependency and impact**. Each feature has its own branch. Work top to bottom — later features build on earlier ones.

---

## Implementation Order

### Phase 1 — Foundation Layer
*Self-contained features. No cross-dependencies. Ship fast, unblock Phase 2.*

| # | Feature | Branch | Depends On | Impact |
|---|---------|--------|------------|--------|
| 1 | Healthcare & Education buildings | `feature/healthcare-education` | nothing | ★★★★☆ |
| 2 | Undo / Redo + Save Slots | `feature/undo-save-slots` | nothing | ★★☆☆☆ |
| 3 | Municipal Bonds / Loans | `feature/municipal-bonds` | nothing | ★★★☆☆ |
| 4 | Statistics Panel (Sparklines) | `feature/statistics-sparklines` | nothing | ★★★☆☆ |

---

### Phase 2 — Core Simulation Depth
*These are the make-or-break mechanics. Pollution must land before traffic; density before transit.*

| # | Feature | Branch | Depends On | Impact |
|---|---------|--------|------------|--------|
| 5 | Pollution System | `feature/pollution-system` | #1 (health effects) | ★★★★★ |
| 6 | Advanced Zoning Density | `feature/advanced-zoning-density` | nothing | ★★★★☆ |
| 7 | Real Traffic Simulation | `feature/traffic-simulation` | #5, #6 | ★★★★★ |
| 8 | District System | `feature/district-system` | #6, #7 | ★★★★☆ |

---

### Phase 3 — Economy & Transport
*Expand reach of Phase 2 systems. Transit requires traffic to exist; trade requires chains.*

| # | Feature | Branch | Depends On | Impact |
|---|---------|--------|------------|--------|
| 9  | Public Transportation | `feature/public-transportation` | #7 (traffic) | ★★★★★ |
| 10 | Trade & Export Economy | `feature/trade-export-economy` | production chains (already in main) | ★★★☆☆ |
| 11 | Expanded Natural Disasters | `feature/expanded-disasters` | #1 (healthcare), #5 (pollution) | ★★★☆☆ |

---

### Phase 4 — Late Game & Replayability
*Require most prior systems to deliver their full value.*

| # | Feature | Branch | Depends On | Impact |
|---|---------|--------|------------|--------|
| 12 | Tourism System | `feature/tourism-system` | #8 (districts), #9 (transit) | ★★★★☆ |
| 13 | Unique Landmark Buildings | `feature/landmark-buildings` | #12 (tourism) | ★★★☆☆ |
| 14 | Citizen Simulation | `feature/citizen-simulation` | #8 (districts), Pixelgram (already in main) | ★★★★☆ |
| 15 | Scenario / Challenge Mode | `feature/scenario-mode` | all prior phases | ★★★☆☆ |

---

## Feature Specs

### 1 · Healthcare & Education (`feature/healthcare-education`)

**Goal:** Complete the 6-service layer. Budget slots exist, buildings don't.

- Add `hospital` building — covers `health` service, Chebyshev radius 7, $3K cost, $150 maint
- Add `school` building — covers `education` service, radius 5, $1.5K cost, $75 maint
- Add `university` building — tier 3, radius 8, $8K cost, $400 maint; enables future office zoning
- Wire health + education into happiness formula (same pattern as existing 4 services)
- Without hospital: max residential level capped at 2 regardless of other conditions
- New event: `disease_outbreak` — low health coverage → population loss over 3 months
- Add `hospital` and `school` to `BuildCatalog` and pixel icon set

**Files touched:** `engine/types.ts`, `engine/services.ts`, `engine/tick.ts`, `engine/economy.ts`, `engine/events.ts`, `data/buildings.ts`, `data/pixelIcons.ts`, `components/BuildCatalog.tsx`

---

### 2 · Undo / Redo + Save Slots (`feature/undo-save-slots`)

**Goal:** Let players experiment without fear.

- Add `actionHistory: GameState[]` stack (max 10) to Zustand store
- Before any tile mutation (zone, build, road, demolish), push current state to stack
- `undo` command: pop stack, restore state
- 3 named save slots in localStorage: `terminal-city-save-0/1/2`
- `save <slot>` / `load <slot>` commands (slot is optional, defaults to 0)
- Auto-save every 12 ticks to slot 0
- `saves` command: list slot metadata (city name, population, date, balance)

**Files touched:** `store/gameStore.ts`, `commands/commands.ts`, `commands/executor.ts`

---

### 3 · Municipal Bonds / Loans (`feature/municipal-bonds`)

**Goal:** Give players a real capital-planning lever beyond the passive debt system.

- Add `bonds: Bond[]` to `GameState` — each bond: `{ id, amount, termMonths, monthsRemaining, monthlyPayment, interestRate }`
- Bond rating computed from debt-to-income ratio: AAA (< 10%) → D (> 200%)
- Rating determines interest rate: AAA = 3%, AA = 5%, A = 7%, BBB = 10%, B+ = 15%, D = unavailable
- `bond <amount>` command: opens a 20-year bond at current rating's rate
- Monthly payment auto-deducted from balance
- Bond default event if balance stays negative for 3+ consecutive months with active bonds
- `view bonds` command: table of active bonds, rating, total monthly obligation

**Files touched:** `engine/types.ts`, `engine/economy.ts`, `engine/tick.ts`, `commands/commands.ts`, `commands/executor.ts`, `engine/events.ts`

---

### 4 · Statistics Panel / Sparklines (`feature/statistics-sparklines`)

**Goal:** Surface 24-month history as ASCII sparklines in a new panel.

- Add `history: HistorySnapshot[]` to `GameState` — pushed every tick, max 24 entries
  - Each snapshot: `{ month, year, population, balance, happiness, income, expenses, rDemand, cDemand, iDemand }`
- New command `view charts` — renders sparklines for all tracked metrics using `▁▂▃▄▅▆▇█`
- Add charts panel as toggleable view in right column (alongside EventLog/Pixelgram)
- StatusPanel gains a tiny 6-char sparkline for population trend inline

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `commands/commands.ts`, `commands/executor.ts`, `components/App.tsx`, `components/StatusPanel.tsx` + new `components/ChartsPanel.tsx`

---

### 5 · Pollution System (`feature/pollution-system`)

**Goal:** Industrial zones need negative externalities. Forces mixed-use planning.

- Add `pollution: number` (0-100) to each `Tile`
- Each tick: industrial, power_plant, foundry, iron_mine emit pollution; diffuses outward (weighted radius, like services)
- Parks reduce pollution in radius 3 by 20 points
- `waste_plant` building: new building type, reduces pollution in radius 5 by 40 points, $4K, $200 maint
- Residential zones in polluted tiles: happiness penalty (-0.5 per pollution point above 30), population cap reduced
- Health service coverage reduces pollution impact by 50% (hospital absorbs effects)
- New event: `smog_warning` — if average pollution > 60, happiness -10 for 2 months
- Visual: polluted tiles render with a dimmed/orange tint overlay in `MapRenderer`
- Pixelgram scenarios: `high_pollution`, `clean_city`, `industrial_smog`

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `engine/economy.ts`, `engine/events.ts`, `data/buildings.ts`, `renderer/asciiMap.ts`, `renderer/MapRenderer.tsx`, `data/pixelgramScenarios.ts`

---

### 6 · Advanced Zoning Density (`feature/advanced-zoning-density`)

**Goal:** Make density an explicit player choice, not an automatic outcome.

- New zone sub-types via extended `zone` command: `zone <x> <y> residential-low|medium|high`
- Each density cap: low = max level 1, medium = max level 2, high = max level 3
- High-density requirements enforced in tick: needs transit access (Phase 3) + full services + pollution < 30
- Medium: basic services only
- Low: minimal infrastructure, generates more traffic per resident than medium/high (Phase 2 #7)
- `BuildCatalog` splits residential/commercial/industrial into 3 sub-options each
- Update ASCII chars: low-density residential `·`, medium `▒`, high `█` (distinct from current auto-level chars)
- Pixel icons: 3 variants per zone type

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `commands/parser.ts`, `commands/commands.ts`, `data/buildings.ts`, `data/pixelIcons.ts`, `renderer/asciiMap.ts`, `components/BuildCatalog.tsx`

---

### 7 · Real Traffic Simulation (`feature/traffic-simulation`)

**Goal:** Traffic is the defining mechanic of Cities Skylines. Make it real.

- Add `trafficLoad: number` (0-100) and `roadType: 'road'|'avenue'|'highway'` to road tiles
- Road capacities: road = 20 units/month, avenue = 60, highway = 200 (no adjacent zoning)
- Traffic generation per tick: residential tiles generate load proportional to population / density, commercial/industrial attract load
- Load distributed across adjacent roads using simple flow algorithm (each tile pushes to neighbors)
- Congestion index = `load / capacity` per road tile
- Congestion effects:
  - > 80%: RCI demand penalty (-20%), happiness -5, event log warning
  - > 95%: commercial income -30%, emigration boost
- `avenue <x1> <y1> <x2> <y2>` command: $30/tile
- `highway <x1> <y1> <x2> <y2>` command: $80/tile, requires 3+ tile straight segments
- Pixel cars now reflect congestion: more cars on high-load roads, stopped animation on > 95%
- `view traffic` command: renders heatmap overlay (color-coded road load)
- New milestone: `traffic_master` — maintain average road load < 50% at population ≥ 200

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `commands/commands.ts`, `commands/parser.ts`, `renderer/MapRenderer.tsx`, `renderer/pixelCars.ts`, `data/buildings.ts`, `engine/demand.ts`

---

### 8 · District System (`feature/district-system`)

**Goal:** Let players divide the city into named zones with independent policies.

- Add `districts: District[]` to `GameState`: `{ id, name, color, tileIds: number[], policies: DistrictPolicies }`
- `DistrictPolicies`: `{ taxRate?: number, allowedZones?: ZoneType[], spendingPriority?: 'services'|'infrastructure'|'growth' }`
- `district create <name>` — starts district paint mode (click tiles to assign)
- `district policy <name> tax <rate>` — override tax rate for that district
- `district policy <name> ban <zone-type>` — prevent zone type in district
- `district rename <old> <new>`, `district delete <name>` commands
- District name shown as label overlay on map at center tile
- StatusPanel: per-district summary in `view stats`
- `city_hall` landmark (Phase 4 #13) required to unlock more than 2 districts

**Files touched:** `engine/types.ts`, `engine/economy.ts`, `engine/tick.ts`, `commands/commands.ts`, `commands/parser.ts`, `renderer/MapRenderer.tsx`, `store/gameStore.ts`, `components/StatusPanel.tsx`

---

### 9 · Public Transportation (`feature/public-transportation`)

**Goal:** Reduce traffic, enable high-density zones, force infrastructure planning.

- New tile types: `bus_stop`, `metro_station`, `metro_tunnel` (underground, rendered differently)
- `busline create <name>` → enter stop-placement mode; click road tiles to add stops in order
- `busline delete <name>`, `busline view` commands
- Bus line mechanics per tick:
  - Ridership = sum of population within radius 3 of each stop × demand factor
  - Capacity = stops × 50 passengers/month
  - Each passenger-trip removes 1 traffic unit from road network
  - Monthly cost = $50 × number of stops
- Metro lines: $500/tile (tunnel), $800/station; radius 5 for each station; ridership × 3 capacity vs bus
- Transit coverage radius shown as overlay in `MapRenderer` (toggle with `view transit`)
- High-density zones require transit access within radius 4 (enforced in tick from Phase 2 #6)
- New Pixelgram scenarios: `new_metro`, `bus_delay`, `city_connected`
- New milestones: `first_bus_line`, `metro_city` (3+ metro stations + pop ≥ 300)

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `engine/demand.ts`, `commands/commands.ts`, `commands/parser.ts`, `renderer/asciiMap.ts`, `renderer/MapRenderer.tsx`, `data/buildings.ts`, `data/pixelgramScenarios.ts`, `data/milestoneDefs.ts`

---

### 10 · Trade & Export Economy (`feature/trade-export-economy`)

**Goal:** Give production chains a real economic purpose beyond tier unlocking.

- Add `tradeBalance: number` and `tradeRoutes: TradeRoute[]` to `GameState`
- 4 neighboring AI cities appear as trade partners in EventLog intro sequence
- When a production chain is `satisfied` AND outputting surplus, it auto-exports: monthly income += `outputPerTick × exportPrice`
- When chain is unsatisfied, goods are imported at premium cost (1.5× export price)
- `trade <resource> export|import|auto` command: set policy per resource
- Trade disruption event: 10% chance/year one route is interrupted for 3 months (supply chain crisis)
- `view trade` command: table of resources, status (export/import/balanced), monthly income/cost
- Trade income shown separately in `calculateTotalIncome`

**Files touched:** `engine/types.ts`, `engine/economy.ts`, `engine/tick.ts`, `engine/events.ts`, `engine/production.ts`, `commands/commands.ts`, `commands/executor.ts`

---

### 11 · Expanded Natural Disasters (`feature/expanded-disasters`)

**Goal:** More variety, more tension, more Pixelgram drama.

- `earthquake` — 1% chance/year after year 3; destroys buildings in random 3×3 radius, triggers fires, happiness -20
- `flood` — 2% chance/year if water tiles exist; inundates adjacent non-road tiles for 3 months (production halted, population drops)
- `disease_outbreak` — 3% chance if health coverage < 40%; population loss 5%/month for 3 months; hospital coverage reduces to 1%
- `labor_strike` — 5% chance if happiness < 40% AND industrial zones present; industrial income -80% for 2 months
- `tornado` — 0.5% chance/year; carves a 1-tile-wide path across random map segment, demolishes everything in path
- Disaster insurance policy: new budget slider (0-$1K/month); reduces all disaster damage by `budget/1000 × 60%`
- `view disasters` command: shows disaster history and current insurance level
- All disasters generate Pixelgram posts with citizen reactions

**Files touched:** `engine/types.ts`, `engine/events.ts`, `engine/tick.ts`, `data/balanceConfig.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts`

---

### 12 · Tourism System (`feature/tourism-system`)

**Goal:** New income stream independent of population growth.

- Add `T` to RCI demand display; `tourismDemand: number` to `GameState`
- Tourism demand formula: `happiness × parkDensity × landmarkCount × transitAccess × (1 - pollutionAvg/100)`
- New zone type: `hotel` — converts commercial tile to tourist-serving; generates income from tourism demand rather than population
- Tourism income per tick: `tourismDemand × hotelCount × taxRate / 100`
- New buildings (milestone-unlocked): `stadium` ($20K), `museum` ($15K), `convention_center` ($25K)
  - Each adds +15 to tourismDemand within radius 8
- Seasonal modifier: summer (months 6-8) × 1.4, winter (months 12-2) × 0.7
- New event: `tourism_boom` — high tourism demand × season = bonus income spike
- `view tourism` command: tourism demand breakdown, hotel revenue, seasonal forecast
- Pixelgram scenarios: `tourist_town`, `hotel_opening`, `museum_inauguration`

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `engine/economy.ts`, `engine/demand.ts`, `engine/events.ts`, `data/buildings.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts`, `data/milestoneDefs.ts`

---

### 13 · Unique Landmark Buildings (`feature/landmark-buildings`)

**Goal:** Milestone-unlocked buildings that transform city strategy.

10 landmarks, each unlocked by a specific prior milestone:

| Landmark | Unlocked By | Effect | Cost |
|----------|------------|--------|------|
| `city_hall` | `city_charter` milestone | Unlocks 5 districts (vs 2 default) | $30K |
| `central_park` | 3×3 area, 9 tiles | Happiness +15 citywide, pollution -20 radius 6 | $50K total |
| `tech_campus` | `tier3_district` + university | Enables high-income office zoning, +C demand 20 | $40K |
| `port` | Water-adjacent tile | Enables maritime trade (×2 export income) | $35K |
| `airport` | Highway access + pop ≥ 300 | Tourism demand +40, migration boom monthly | $60K |
| `sports_arena` | pop ≥ 200 + commercial tiles ≥ 10 | Happiness +10, tourism +20 | $25K |
| `cathedral` | pop ≥ 150 | Happiness +8, milestone reward event | $15K |
| `research_lab` | university + tier3 | Reduces disaster probability by 30% | $45K |
| `green_energy_plant` | parks ≥ 5 + no coal events | Replaces power_plant pollution with zero emission | $55K |
| `grand_station` | metro + bus lines both active | Transit capacity +50% citywide, tourism +25 | $50K |

- `build <x> <y> <landmark>` command (same as regular build)
- Landmarks shown with special `★` prefix in map
- `view landmarks` command: lists unlocked/locked landmarks and requirements

**Files touched:** `data/buildings.ts`, `engine/milestones.ts`, `data/milestoneDefs.ts`, `engine/tick.ts`, `renderer/asciiMap.ts`, `data/pixelIcons.ts`, `commands/commands.ts`

---

### 14 · Citizen Simulation (`feature/citizen-simulation`)

**Goal:** Make the city feel inhabited. Extend Pixelgram into a persistent NPC layer.

- 30 persistent named citizens (extend current 15 Pixelgram profiles)
- Each citizen has: `homeZone: {x,y}`, `workZone: {x,y}|null`, `happiness: number`, `yearsResiding: number`
- Citizens assigned homes when residential zones gain population; assigned jobs from commercial/industrial zones
- Citizen state updates each tick:
  - If home tile is damaged → citizen unhappy (-30), may emigrate after 2 months
  - If work tile demolished → citizen unemployed, happiness -10/month
  - If transit covers home → commute satisfaction +10
  - If pollution > 50 at home → health risk, happiness -15
- Pixelgram posts now tagged with citizen's actual game state (real data, not just scenario templates)
- Mayoral approval rating = average citizen happiness (shown in StatusPanel)
- `view citizens` command: table of top 10 happiest and 5 most at-risk citizens
- Special: if a named citizen emigrates, post a farewell message to Pixelgram

**Files touched:** `engine/types.ts`, `engine/tick.ts`, `engine/pixelgram.ts`, `data/pixelgramScenarios.ts`, `commands/commands.ts`, `components/StatusPanel.tsx`

---

### 15 · Scenario / Challenge Mode (`feature/scenario-mode`)

**Goal:** Replayability through preset starting conditions and unique win conditions.

5 scenarios, selectable at new game:

| Scenario | Starting State | Win Condition |
|----------|--------------|---------------|
| `sandbox` | Default (current game) | `city_charter` milestone |
| `industrial_town` | 3 factories, pollution 40, $8K | 300 pop + happiness ≥ 60% despite industry |
| `island_city` | Water surrounds map edges, no road access | Port built + 200 pop + positive trade balance |
| `debt_crisis` | $50K debt, no buildings | Surplus ≥ $10K + pop ≥ 100 within 20 years |
| `migration_boom` | 200 pop arrives month 1, no services | Maintain happiness ≥ 60% for 12 consecutive months |
| `disaster_recovery` | 40% map is damaged tiles | Rebuild to 500 pop within 15 years |

- Scenario selected via `new game <scenario>` command or main menu option
- Each scenario has a Pixelgram intro thread (3-4 posts with backstory)
- Win/loss conditions checked every tick (distinct from sandbox milestones)
- `view scenario` command: current objectives, progress bars, time remaining

**Files touched:** `engine/types.ts`, `engine/world.ts`, `engine/tick.ts`, `store/gameStore.ts`, `commands/commands.ts`, `data/pixelgramScenarios.ts` + new `data/scenarios.ts`

---

## Branch Quick Reference

```
main
├── feature/healthcare-education      ← start here
├── feature/undo-save-slots
├── feature/municipal-bonds
├── feature/statistics-sparklines
├── feature/pollution-system          ← needs #1
├── feature/advanced-zoning-density
├── feature/traffic-simulation        ← needs #5, #6
├── feature/district-system           ← needs #6, #7
├── feature/public-transportation     ← needs #7
├── feature/trade-export-economy
├── feature/expanded-disasters        ← needs #1, #5
├── feature/tourism-system            ← needs #8, #9
├── feature/landmark-buildings        ← needs #12
├── feature/citizen-simulation        ← needs #8
└── feature/scenario-mode             ← needs all
```

## Merge Strategy

Each feature branch is cut from `main`. After completing a branch:
1. Test locally (`npm test`, manual smoke test)
2. Merge to `main` before starting the next branch that depends on it
3. Branches with no dependencies (Phase 1) can overlap if desired
