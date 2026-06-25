import { useGameStore } from '../store/gameStore';
import type { RCIDemand } from '../engine/types';

// ─────────────────────────────────────────────
//  Status panel — year, money, population, happiness, RCI demand
// ─────────────────────────────────────────────

const TERM_GREEN = '#00ff41';
const TERM_AMBER = '#ffb000';
const TERM_RED   = '#ff2200';
const TERM_DIM   = '#555555';

function getHappinessColor(h: number): string {
  if (h >= 70) return TERM_GREEN;
  if (h >= 40) return TERM_AMBER;
  return TERM_RED;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }): JSX.Element {
  const pct = Math.round((value / max) * 10);
  return (
    <span>
      {'['}
      <span style={{ color }}> {'█'.repeat(pct)}{'░'.repeat(10 - pct)}</span>
      {']'}
    </span>
  );
}

/** Compact RCI demand indicator: R ████░ 78  C ██░░░ 42  I █████ 96 */
function RCIBars({ demand }: { demand: RCIDemand }): JSX.Element {
  function demandColor(n: number): string {
    if (n >= 70) return TERM_GREEN;
    if (n >= 35) return TERM_AMBER;
    return TERM_RED;
  }

  function miniBar(n: number, color: string): JSX.Element {
    const fill = Math.round((n / 100) * 5);
    return (
      <span style={{ color }}>
        {'█'.repeat(fill)}{'░'.repeat(5 - fill)} {String(n).padStart(3)}
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'monospace' }}>
      <span style={{ color: TERM_DIM, fontSize: 10 }}>DEMANDA</span>
      <span style={{ color: TERM_GREEN, fontSize: 10 }}>R</span>
      {miniBar(demand.r, demandColor(demand.r))}
      <span style={{ color: TERM_AMBER, fontSize: 10 }}>C</span>
      {miniBar(demand.c, demandColor(demand.c))}
      <span style={{ color: '#ff6600', fontSize: 10 }}>I</span>
      {miniBar(demand.i, demandColor(demand.i))}
    </span>
  );
}

/** Compact milestone progress pill */
function MilestonePill(): JSX.Element {
  const { state } = useGameStore();
  const completed = state.milestones.filter((m) => m.completed).length;
  const total     = state.milestones.length;
  const next      = state.milestones.find((m) => !m.completed);
  return (
    <span style={{ color: TERM_DIM, fontSize: 10 }}>
      🏆 {completed}/{total}
      {next && (
        <span style={{ color: '#336633', marginLeft: 4 }}>→ {next.title}</span>
      )}
    </span>
  );
}

export function StatusPanel(): JSX.Element {
  const { state } = useGameStore();
  const { economy, population, happiness, year, month, speed, running, rciDemand } = state;

  const speedLabel = running ? `▶ ${speed === 'pause' ? 'PAUSA' : `x${speed}`}` : '⏸ PAUSA';
  const balanceColor = economy.balance < 2_000 ? TERM_RED
    : economy.balance < 5_000 ? TERM_AMBER
    : TERM_GREEN;

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: '12px',
        color: TERM_GREEN,
        backgroundColor: '#0d0d0d',
        borderTop: '2px solid #1a3a1a',
        padding: '5px 12px',
        display: 'flex',
        gap: '18px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span style={{ color: TERM_AMBER, fontWeight: 'bold', letterSpacing: 1 }}>
        TERMINAL CITY
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>Año </span>
        <span style={{ color: TERM_AMBER }}>{year}</span>
        <span style={{ color: TERM_DIM }}> M</span>{String(month).padStart(2, '0')}
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>💰 </span>
        <span style={{ color: balanceColor }}>{formatMoney(economy.balance)}</span>
        {economy.debt > 0 && (
          <span style={{ color: TERM_RED }}> –{formatMoney(economy.debt)}</span>
        )}
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>👥 </span>
        <span style={{ color: TERM_GREEN }}>{population.toLocaleString()}</span>
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>😊 </span>
        <Bar value={happiness} max={100} color={getHappinessColor(happiness)} />
        {' '}
        <span style={{ color: getHappinessColor(happiness) }}>{happiness}%</span>
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>%tx </span>
        <span style={{ color: TERM_AMBER }}>{economy.taxRate}</span>
      </span>

      {/* RCI demand bars */}
      <RCIBars demand={rciDemand} />

      {/* Milestone progress */}
      <MilestonePill />

      <span style={{ marginLeft: 'auto', color: TERM_DIM }}>
        {speedLabel}
      </span>
    </div>
  );
}
