import { useState } from 'react';
import { PixelIcon } from './PixelIcon';
import { PIXEL_ICONS } from '../data/pixelIcons';
import { BUILDINGS } from '../data/buildings';
import { useGameStore } from '../store/gameStore';
import type { ZoneType } from '../engine/types';

// ─────────────────────────────────────────────
//  Cities Skylines-style build catalog toolbar
// ─────────────────────────────────────────────

type BuildTool = ZoneType | 'road' | 'demolish';

interface CatalogItem {
  tool: BuildTool;
  label: string;
  cost: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  items: CatalogItem[];
}

const CATEGORIES: Category[] = [
  {
    id: 'zones',
    label: 'ZONAS',
    icon: '░',
    items: [
      { tool: 'residential', label: 'Residencial', cost: 50 },
      { tool: 'commercial', label: 'Comercial', cost: 100 },
      { tool: 'industrial', label: 'Industrial', cost: 150 },
      { tool: 'farm', label: 'Granja', cost: 200 },
      { tool: 'park', label: 'Parque', cost: 300 },
      { tool: 'empty', label: 'Vaciar', cost: 0 },
    ],
  },
  {
    id: 'services',
    label: 'SERVICIOS',
    icon: '⚡',
    items: [
      { tool: 'power_plant', label: 'Planta Eléctrica', cost: 5000 },
      { tool: 'water_pump', label: 'Bomba de Agua', cost: 2000 },
      { tool: 'fire_station', label: 'Bomberos', cost: 1000 },
      { tool: 'police_station', label: 'Policía', cost: 1200 },
      { tool: 'hospital', label: 'Hospital', cost: 3000 },
      { tool: 'school', label: 'Escuela', cost: 1500 },
      { tool: 'university', label: 'Universidad', cost: 8000 },
    ],
  },
  {
    id: 'roads',
    label: 'VÍAS',
    icon: '#',
    items: [
      { tool: 'road', label: 'Carretera', cost: 10 },
    ],
  },
  {
    id: 'production',
    label: 'PRODUCCIÓN',
    icon: '⚙',
    items: [
      { tool: 'granary', label: 'Granero', cost: 500 },
      { tool: 'mill', label: 'Molino', cost: 800 },
      { tool: 'bakery', label: 'Panadería', cost: 600 },
      { tool: 'iron_mine', label: 'Mina de Hierro', cost: 2000 },
      { tool: 'foundry', label: 'Fundición', cost: 3000 },
      { tool: 'tools_workshop', label: 'Taller', cost: 1500 },
    ],
  },
  {
    id: 'demolish',
    label: 'DEMOLER',
    icon: '×',
    items: [
      { tool: 'demolish', label: 'Demoler', cost: 0 },
    ],
  },
];

function formatCost(cost: number): string {
  if (cost === 0) return 'gratis';
  if (cost >= 1000) return `$${(cost / 1000).toFixed(1)}K`;
  return `$${cost}`;
}

interface ItemCardProps {
  item: CatalogItem;
  selected: boolean;
  canAfford: boolean;
  onClick: () => void;
}

function ItemCard({ item, selected, canAfford, onClick }: ItemCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const iconGrid = PIXEL_ICONS[item.tool];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${item.label} — ${formatCost(item.cost)}`}
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
      <span
        style={{
          fontSize: 9,
          color: selected ? '#00ff41' : canAfford ? '#888' : '#333',
          textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          maxWidth: 50,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label}
      </span>
      <span
        style={{
          fontSize: 8,
          color: canAfford ? '#556' : '#331',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {formatCost(item.cost)}
      </span>
    </button>
  );
}

export function BuildCatalog(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState('zones');
  const { state, buildTool, selectBuildTool } = useGameStore();
  const balance = state.economy.balance;

  const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  const handleItemClick = (tool: BuildTool): void => {
    // Toggle off if already selected
    selectBuildTool(buildTool === tool ? null : tool);
  };

  const roadHint =
    buildTool === 'road' && useGameStore.getState().roadStart !== null
      ? ' — Haz click en el destino'
      : buildTool === 'road'
      ? ' — Haz click en el origen'
      : null;

  return (
    <div
      style={{
        backgroundColor: '#0d0d0d',
        borderTop: '1px solid #1a3a1a',
        fontFamily: '"JetBrains Mono", monospace',
        flexShrink: 0,
      }}
    >
      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a3a1a' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '5px 12px',
              background: activeCategory === cat.id ? '#0a2a0a' : 'transparent',
              border: 'none',
              borderRight: '1px solid #1a3a1a',
              borderBottom: activeCategory === cat.id ? '2px solid #00ff41' : '2px solid transparent',
              color: activeCategory === cat.id ? '#00ff41' : '#555',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span style={{ fontSize: 12 }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}

        {/* Active tool indicator */}
        {buildTool && (
          <div
            style={{
              marginLeft: 'auto',
              padding: '5px 12px',
              color: '#00ff41',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: '#555' }}>Herramienta:</span>
            <span style={{ color: '#00ff41' }}>{buildTool.toUpperCase()}</span>
            {roadHint && <span style={{ color: '#ffb000' }}>{roadHint}</span>}
            <button
              onClick={() => selectBuildTool(null)}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#555',
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
            >
              ESC
            </button>
          </div>
        )}
      </div>

      {/* Building grid */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '6px 10px',
          overflowX: 'auto',
          alignItems: 'flex-start',
        }}
      >
        {category.items.map((item) => {
          const building = BUILDINGS.find((b) => b.type === item.tool);
          const cost = building?.cost ?? 0;
          const canAfford = cost === 0 || balance >= cost;

          return (
            <ItemCard
              key={item.tool}
              item={item}
              selected={buildTool === item.tool}
              canAfford={canAfford}
              onClick={() => handleItemClick(item.tool)}
            />
          );
        })}

        {/* Road tip */}
        {activeCategory === 'roads' && (
          <div
            style={{
              color: '#444',
              fontSize: 10,
              padding: '8px 12px',
              borderLeft: '1px solid #1a3a1a',
              marginLeft: 8,
              maxWidth: 180,
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: '#555', marginBottom: 4 }}>Cómo usar:</div>
            <div>1. Selecciona Carretera</div>
            <div>2. Click en el punto de inicio</div>
            <div>3. Click en el destino</div>
            <div style={{ color: '#ffb000', marginTop: 4 }}>
              Costo: $10/tile
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
