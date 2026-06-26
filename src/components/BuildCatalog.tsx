import { useState } from 'react';
import { PixelIcon } from './PixelIcon';
import { PIXEL_ICONS } from '../data/pixelIcons';
import { BUILDINGS } from '../data/buildings';
import { useGameStore } from '../store/gameStore';
import { UI } from '../i18n';
import type { BuildTool } from '../store/gameStore';

// ─────────────────────────────────────────────
//  Cities Skylines-style build catalog toolbar
// ─────────────────────────────────────────────

interface CatalogItem {
  tool: BuildTool;
  cost: number;
}

interface Category {
  id: string;
  labelKey: 'catZones' | 'catServices' | 'catRoads' | 'catProduction' | 'catDemolish';
  icon: string;
  items: CatalogItem[];
}

const CATEGORIES: Category[] = [
  {
    id: 'zones', labelKey: 'catZones', icon: '░',
    items: [
      { tool: 'residential-low',    cost: 50 },
      { tool: 'residential-medium', cost: 50 },
      { tool: 'residential-high',   cost: 50 },
      { tool: 'commercial-low',     cost: 100 },
      { tool: 'commercial-medium',  cost: 100 },
      { tool: 'commercial-high',    cost: 100 },
      { tool: 'industrial-light',   cost: 150 },
      { tool: 'industrial-medium',  cost: 150 },
      { tool: 'industrial-heavy',   cost: 150 },
      { tool: 'farm',               cost: 200 },
      { tool: 'park',               cost: 300 },
      { tool: 'empty',              cost: 0 },
    ],
  },
  {
    id: 'services', labelKey: 'catServices', icon: '⚡',
    items: [
      { tool: 'power_plant',    cost: 5000 },
      { tool: 'water_pump',     cost: 2000 },
      { tool: 'fire_station',   cost: 1000 },
      { tool: 'police_station', cost: 1200 },
      { tool: 'hospital',       cost: 3000 },
      { tool: 'school',         cost: 1500 },
      { tool: 'university',     cost: 8000 },
      { tool: 'garbage_depot',  cost: 800  },
      { tool: 'waste_plant',    cost: 4000 },
    ],
  },
  {
    id: 'roads', labelKey: 'catRoads', icon: '#',
    items: [
      { tool: 'road',    cost: 10 },
      { tool: 'avenue',  cost: 30 },
      { tool: 'highway', cost: 80 },
    ],
  },
  {
    id: 'production', labelKey: 'catProduction', icon: '⚙',
    items: [
      { tool: 'granary',         cost: 500 },
      { tool: 'mill',            cost: 800 },
      { tool: 'bakery',          cost: 600 },
      { tool: 'iron_mine',       cost: 2000 },
      { tool: 'foundry',         cost: 3000 },
      { tool: 'tools_workshop',  cost: 1500 },
    ],
  },
  {
    id: 'demolish', labelKey: 'catDemolish', icon: '×',
    items: [{ tool: 'demolish', cost: 0 }],
  },
];

function formatCost(cost: number, freeLabel: string): string {
  if (cost === 0) return freeLabel;
  if (cost >= 1000) return `$${(cost / 1000).toFixed(1)}K`;
  return `$${cost}`;
}

interface ItemCardProps {
  item: CatalogItem;
  label: string;
  freeLabel: string;
  selected: boolean;
  canAfford: boolean;
  onClick: () => void;
}

const DENSITY_TOOL_BASE: Record<string, string> = {
  'residential-low': 'residential', 'residential-medium': 'residential', 'residential-high': 'residential',
  'commercial-low': 'commercial', 'commercial-medium': 'commercial', 'commercial-high': 'commercial',
  'industrial-light': 'industrial', 'industrial-medium': 'industrial', 'industrial-heavy': 'industrial',
};

const DENSITY_LABEL_COLOR: Record<string, string> = {
  'residential-low': '#00aa2b', 'commercial-low': '#cc7700', 'industrial-light': '#cc3300',
  'residential-medium': '#00cc35', 'commercial-medium': '#ffb000', 'industrial-medium': '#ff6600',
  'residential-high': '#00ff41', 'commercial-high': '#ffd000', 'industrial-heavy': '#ff8800',
};

function ItemCard({ item, label, freeLabel, selected, canAfford, onClick }: ItemCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const baseZone = DENSITY_TOOL_BASE[item.tool] ?? item.tool;
  const iconGrid = PIXEL_ICONS[baseZone] ?? PIXEL_ICONS[item.tool];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${label} — ${formatCost(item.cost, freeLabel)}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '6px 8px',
        background: selected
          ? '#0a2a0a'
          : hovered
          ? '#0d200d'
          : 'transparent',
        border: selected
          ? '1px solid #00ff41'
          : hovered
          ? '1px solid #006618'
          : '1px solid #1a3a1a',
        borderRadius: 2,
        cursor: canAfford ? 'pointer' : 'not-allowed',
        minWidth: 52,
        flexShrink: 0,
        transition: 'border-color 0.1s, background 0.1s',
      }}
    >
      <div style={{ position: 'relative' }}>
        {iconGrid ? (
          <PixelIcon
            grid={iconGrid}
            pixelSize={4}
            active={selected}
            dim={!canAfford}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: canAfford ? '#00ff41' : '#333',
            }}
          >
            {item.tool === 'demolish' ? '×' : '?'}
          </div>
        )}
        {DENSITY_TOOL_BASE[item.tool] && (
          <span style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            fontSize: 7,
            background: '#0d0d0d',
            color: DENSITY_LABEL_COLOR[item.tool] ?? '#888',
            padding: '0 2px',
            lineHeight: 1.4,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {item.tool.includes('-low') || item.tool.includes('-light') ? 'L'
              : item.tool.includes('-high') || item.tool.includes('-heavy') ? 'H' : 'M'}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 9,
          color: selected
            ? (DENSITY_LABEL_COLOR[item.tool] ?? '#00ff41')
            : canAfford ? '#888' : '#333',
          textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          maxWidth: 50,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 8,
          color: canAfford ? '#556' : '#331',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {formatCost(item.cost, freeLabel)}
      </span>
    </button>
  );
}

export function BuildCatalog(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState('zones');
  const { state, buildTool, selectBuildTool, lang } = useGameStore();
  const t = UI[lang];
  const balance = state.economy.balance;

  const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0]!;

  const handleItemClick = (tool: BuildTool): void => {
    selectBuildTool(buildTool === tool ? null : tool);
  };

  const roadHint =
    buildTool === 'road' && useGameStore.getState().roadStart !== null
      ? t.roadClickDest
      : buildTool === 'road'
      ? t.roadClickOrigin
      : null;

  return (
    <div
      style={{
        backgroundColor: '#0d0d0d',
        borderLeft: '1px solid #1a3a1a',
        fontFamily: '"JetBrains Mono", monospace',
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar header */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid #1a3a1a', color: '#2a5a2a', fontSize: 10, letterSpacing: 2, flexShrink: 0 }}>
        ░ BUILD
        {buildTool && (
          <span style={{ float: 'right', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#00ff41' }}>{buildTool.toUpperCase()}</span>
            {roadHint && <span style={{ color: '#ffb000', fontSize: 9 }}>{roadHint}</span>}
            <button
              onClick={() => selectBuildTool(null)}
              style={{ background: 'transparent', border: '1px solid #333', color: '#555', cursor: 'pointer', padding: '0 3px', fontSize: 9, fontFamily: 'inherit' }}
            >
              ESC
            </button>
          </span>
        )}
      </div>

      {/* Category tabs — compact icon+label row */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a3a1a', flexShrink: 0 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            title={t[cat.labelKey]}
            style={{
              flex: 1,
              padding: '5px 0',
              background: activeCategory === cat.id ? '#0a2a0a' : 'transparent',
              border: 'none',
              borderRight: '1px solid #1a3a1a',
              borderBottom: activeCategory === cat.id ? '2px solid #00ff41' : '2px solid transparent',
              color: activeCategory === cat.id ? '#00ff41' : '#555',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Category label */}
      <div style={{ padding: '4px 10px', fontSize: 9, color: '#2a5a2a', letterSpacing: 1, flexShrink: 0, borderBottom: '1px solid #0f1f0f' }}>
        {t[CATEGORIES.find(c => c.id === activeCategory)!.labelKey]}
      </div>

      {/* Building grid — wraps vertically */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
          padding: '8px',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {category.items.map((item) => {
          const baseZone = DENSITY_TOOL_BASE[item.tool] ?? item.tool;
          const building = BUILDINGS.find((b) => b.type === baseZone);
          const cost = building?.cost ?? item.cost ?? 0;
          const canAfford = cost === 0 || balance >= cost;
          const label = t.zones[item.tool] ?? item.tool;

          return (
            <ItemCard
              key={item.tool}
              item={item}
              label={label}
              freeLabel={t.free}
              selected={buildTool === item.tool}
              canAfford={canAfford}
              onClick={() => handleItemClick(item.tool)}
            />
          );
        })}

        {/* Road tip */}
        {activeCategory === 'roads' && (
          <div style={{ width: '100%', color: '#444', fontSize: 10, padding: '6px 4px', borderTop: '1px solid #1a3a1a', marginTop: 4, lineHeight: 1.6 }}>
            <div style={{ color: '#555', marginBottom: 4 }}>{t.roadTipHow}</div>
            {t.roadTipSteps.map((step, i) => <div key={i}>{step}</div>)}
            <div style={{ color: '#ffb000', marginTop: 4 }}>{t.roadTipCost}</div>
          </div>
        )}
      </div>
    </div>
  );
}
