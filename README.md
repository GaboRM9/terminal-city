```
 ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗
 ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║
    ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║
    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║
    ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝

  ██████╗██╗████████╗██╗   ██╗   ██╗   ██╗ ██████╗      ██╗
 ██╔════╝██║╚══██╔══╝╚██╗ ██╔╝   ██║   ██║██╔═══██╗    ███║
 ██║     ██║   ██║    ╚████╔╝    ██║   ██║██║   ██║    ╚██║
 ██║     ██║   ██║     ╚██╔╝     ╚██╗ ██╔╝██║   ██║     ██║
 ╚██████╗██║   ██║      ██║       ╚████╔╝ ╚██████╔╝     ██║
  ╚═════╝╚═╝   ╚═╝      ╚═╝        ╚═══╝   ╚═════╝      ╚═╝
```

> **City builder con estética de terminal de texto.** Gestiona tu ciudad directamente desde la línea de comandos.

---

## Screenshot

```
00 ........................................
01 ........................................
02 ....############################........
03 ....#░░░░░░░░░░#¢¢¢¢¢#⚙⚙⚙⚙⚙#.......
04 ....#▒▒▒▒▒▒▒▒▒#¢¢¢¢¢#⚙⚙⚙⚙⚙#.......
05 ....#█████████#¢¢¢¢¢#⚙⚙⚙⚙⚙#.......
06 ....#░░░░░░░░░F¢¢¢¢¢#⚙⚙⚙⚙⚙#.......
07 ....############################........
08 ....#░░░░░░░░░#♠♠♠♠♠#E......#.......
09 ....#▒▒▒▒▒▒▒▒▒#♠♠♠♠♠#.......#.......
10 ....############################........

[Año 5, Mes 03] Ingresos: $4820 | Gastos: $1200 | Balance: $28450
[Año 5, Mes 03] Migración masiva: la felicidad (82%) atrae nuevos residentes.
> zone 15 8 residential
  Zona "residential" establecida en (15,8). -$50

> _
```

---

## Instalación

```bash
git clone https://github.com/tu-usuario/terminal-city
cd terminal-city
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Otros comandos

```bash
npm test          # Tests unitarios (vitest)
npm run typecheck # TypeScript strict check
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # Build de producción
```

---

## Comandos del juego

| Comando | Descripción |
|---|---|
| `zone <x> <y> <tipo>` | Zonifica un tile (residential, commercial, industrial, farm, park, empty) |
| `road <x1> <y1> <x2> <y2>` | Traza carretera en L entre dos puntos |
| `build <x> <y> <edificio>` | Construye un edificio de servicio o producción |
| `demolish <x> <y>` | Derriba estructura (recuperas 40%) |
| `tax <5-30>` | Cambia la tasa impositiva |
| `budget <servicio> <monto>` | Asigna presupuesto mensual a un servicio |
| `view stats` | Estadísticas detalladas de la ciudad |
| `view map` | Refresca el mapa |
| `next turn` | Avanza un mes manualmente |
| `speed <1\|2\|3\|pause>` | Velocidad de simulación |
| `save` | Guarda en localStorage |
| `load` | Carga partida guardada |
| `help` | Lista todos los comandos |

### Servicios (para `budget`)

`agua` · `electricidad` · `basura` · `policia` · `bomberos` · `educacion`

---

## Tiles del mapa

| Char | Nombre | Descripción |
|---|---|---|
| `.` | Vacío | Terreno sin usar |
| `~` | Agua | No construible |
| `#` | Carretera | Conecta zonas, $10/tile |
| `░ ▒ █` | Residencial | Nivel 1-3 (densidad) |
| `¢` | Comercial | Genera impuestos altos |
| `⚙` | Industrial | Producción, más mantenimiento |
| `♠` | Granja | Primer eslabón alimentario |
| `♦` | Parque | Mejora felicidad |
| `F` | Bomberos | Cubre fuegos, radio 5 |
| `P` | Policía | Reduce crimen, radio 6 |
| `E` | Planta Eléctrica | Electricidad, radio 10, $5000 |
| `W` | Bomba de Agua | Agua, radio 8, $2000 |
| `G` | Granero | Cadena food-basic |
| `M` | Molino | Cadena food-advanced |
| `B` | Panadería | Cadena food-advanced (Tier 2) |
| `I` | Mina de Hierro | Cadena tools-production |
| `Ω` | Fundición | Cadena tools-production |
| `T` | Taller | Cadena tools-production (Tier 3) |

---

## Mecánicas

### Cadenas de producción

```
Tier 1 — Granja (♠) → Granero (G)         → desbloquea densidad nivel 1
Tier 2 — Granja (♠) → Molino (M) → Pan (B) → desbloquea densidad nivel 2
Tier 3 — Mina (I) → Fundición (Ω) → Taller → desbloquea densidad nivel 3
```

### Economía

- **Ingresos:** impuesto × población × nivel de zona
- **Gastos:** presupuestos de servicio + mantenimiento de edificios
- **Deuda:** si el balance cae a 0, acumula deuda con 3% de interés mensual
- **Felicidad:** depende de cobertura de servicios, deuda y tasas altas

### Eventos aleatorios

| Evento | Condición |
|---|---|
| Incendio | Zona industrial sin bomberos cercanos |
| Ola de crimen | Zonas sin cobertura policial |
| Migración masiva | Felicidad > 80% |
| Recesión | Aleatorio cada ~10 años |
| Agua subterránea | Rarísimo, habilita bomba gratuita |

---

## Arquitectura

```
src/engine/     — Lógica de juego pura (sin side effects)
  types.ts      — Todos los tipos del dominio
  world.ts      — Creación y mutación del grid
  tick.ts       — Tick engine: (GameState) → GameState
  economy.ts    — Cálculos de impuestos y balances
  services.ts   — Cobertura de servicios
  production.ts — Evaluación de cadenas de producción
  events.ts     — Generación de eventos aleatorios

src/store/      — Estado global (Zustand)
src/renderer/   — Renderizado ASCII del mapa
src/commands/   — Parser y registro de comandos CLI
src/components/ — Componentes React del shell
src/data/       — Catálogos y configuración de balance
```

El tick engine es una **función pura**: dada una `GameState`, siempre devuelve una nueva `GameState` sin mutar la entrada. Los tests unitarios verifican esto directamente.

---

## Contribuir

```bash
# Fork → clone → branch
git checkout -b feat/nombre-feature

# Código + tests
npm test
npm run typecheck
npm run lint

# Commit semántico
git commit -m "feat: agregar zona hospital con radio de cobertura salud"
git commit -m "fix: corregir cálculo de ingresos comerciales en nivel 3"
git commit -m "chore: actualizar parámetros de balance para mejor early game"

# Pull Request
gh pr create --title "feat: hospital zone" --body "..."
```

### Guía de extensión

**Agregar un nuevo comando:**
```typescript
// src/commands/commands.ts — añadir al array COMMANDS
{
  name: 'flood',
  aliases: ['fl'],
  description: 'Inunda un área del mapa',
  usage: 'flood <x> <y> <radio>',
  execute(args, state) { /* ... */ }
}
// El registry se construye automáticamente desde COMMANDS
```

**Agregar un nuevo tile:**
1. Agrega el tipo a `ZoneType` en `src/engine/types.ts`
2. Agrega la definición en `src/data/buildings.ts`
3. Agrega el mapping visual en `src/renderer/asciiMap.ts`

---

## Licencia

MIT © 2024

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```
