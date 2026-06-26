# City Builder Development Theory

A developer's theory of a city builder relies on creating a delicate balance between macro-level systems (resource management, agent pathfinding) and micro-level emergent storytelling. The goal is to build an interactive simulation where player decisions have cascading, visual consequences that remain engaging over dozens of hours.

---

## 1. The 4 Pillars of City Builder Design

### Depth of Simulation
The behavioral heart of the game. It dictates how zones (residential, commercial, industrial), traffic, pollution, and crime interact with one another on a systemic level. Developers often use heatmaps for debugging and player feedback.

### Emergent Gameplay
Players take on the role of an urban planner, and the game's affordances allow them to experiment. Developers try to avoid completely dictating how a city "should" be played, providing toolsets that let players tackle varied restriction challenges.

### Progression and Rewards
Buildings and tiers of development are gated. This prevents the player from being overwhelmed early on while offering continuous motivators (e.g., unlocking advanced infrastructure).

### Consequences and Conflict
True city builders introduce friction. Resources should be finite, and bad decisions — like zoning toxic industry next to residential areas — must result in consequences (e.g., citizen abandonment or economic stagnation).

---

## 2. Under the Hood: Programming Architecture

Building a city simulator is notoriously complex. These systems keep the game running smoothly:

### Separation of Concerns
Use architectures like MVP (Model-View-Presenter) or decouple the city's data-crunching from the graphical display. A class handles the building's math (taxes, resource consumption) while the 2D/3D mesh only displays the data.

### Resource Chains
Crafting and supply chains (e.g., woodcutters producing wood, which sawmills turn into boards) are best managed using data-driven structures like Scriptable Objects. This makes adding new production lines and recipes highly scalable.

### Pathfinding & Multi-Threading
Agents (citizens, vehicles) rely on pathfinding algorithms like A* or Dijkstra's. Because thousands of agents navigating simultaneously can tank performance, modern devs employ multi-threading, object pooling, and instanced rendering to keep framerates high.

### Grid vs. Irregular Systems
While older games relied on strict orthogonal grids, modern simulators often experiment with irregular node-based road networks or procedural generation algorithms for natural-looking city sprawl.

---

## How This Applies to Terminal City

| Theory concept | Terminal City implementation |
|---|---|
| Depth of Simulation | Tick-based engine: RCI demand, pollution, traffic load, service coverage all run each tick |
| Emergent Gameplay | Open command console + build catalog; no forced build order |
| Progression & Rewards | Milestones gate achievements; balance cap limits early sprawl |
| Consequences & Conflict | Pollution reduces happiness; debt triggers warnings; bad zoning starves demand |
| Separation of Concerns | Engine (`src/engine/`) is pure logic; renderer and React UI are display-only |
| Resource Chains | `productionChains` system: farm → granary → mill → bakery |
| Grid system | 40×20 orthogonal tile grid; road access gates zone growth |
