import { useGameStore } from '../store/gameStore';
import type { RCIDemand } from '../engine/types';
import { UI } from '../i18n';

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
function RCIBars({ demand, demandLabel }: { demand: RCIDemand; demandLabel: string }): JSX.Element {
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
      <span style={{ color: TERM_DIM, fontSize: 10 }}>{demandLabel}</span>
      <span style={{ color: TERM_GREEN, fontSize: 10 }}>R</span>
      {miniBar(demand.r, demandColor(demand.r))}
      <span style={{ color: TERM_AMBER, fontSize: 10 }}>C</span>
      {miniBar(demand.c, demandColor(demand.c))}
      <span style={{ color: '#ff6600', fontSize: 10 }}>I</span>
      {miniBar(demand.i, demandColor(demand.i))}
    </span>
  );
}

function miniPct(value: number, max: number, width = 5): string {
  const fill = Math.round(Math.min(value / max, 1) * width);
  return '█'.repeat(fill) + '░'.repeat(width - fill);
}

/** Compact milestone progress pill — shows city charter progress when not yet complete */
function MilestonePill(): JSX.Element {
  const { state } = useGameStore();
  const completed = state.milestones.filter((m) => m.completed).length;
  const total     = state.milestones.length;
  const charter   = state.milestones.find((m) => m.id === 'city_charter');
  const next      = state.milestones.find((m) => !m.completed && m.id !== 'city_charter');

  if (charter && !charter.completed) {
    const { population, happiness, economy } = state;
    return (
      <span style={{ color: TERM_DIM, fontSize: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>🏆 {completed}/{total}</span>
        <span style={{ color: '#1a4a1a' }}>⭐</span>
        <span style={{ color: '#336633' }}>Pop</span>
        <span style={{ color: population >= 500 ? TERM_GREEN : '#336633', fontFamily: 'monospace' }}>
          {miniPct(population, 500)}
        </span>
        <span style={{ color: '#336633' }}>{population}/500</span>
        <span style={{ color: '#336633' }}>Hap</span>
        <span style={{ color: happiness >= 75 ? TERM_GREEN : '#336633', fontFamily: 'monospace' }}>
          {miniPct(happiness, 75)}
        </span>
        <span style={{ color: '#336633' }}>{happiness}/75%</span>
        <span style={{ color: '#336633' }}>Bal</span>
        <span style={{ color: economy.balance >= 25000 ? TERM_GREEN : '#336633', fontFamily: 'monospace' }}>
          {miniPct(economy.balance, 25000)}
        </span>
        <span style={{ color: '#336633' }}>{formatMoney(economy.balance)}/$25K</span>
      </span>
    );
  }

  return (
    <span style={{ color: TERM_DIM, fontSize: 10 }}>
      🏆 {completed}/{total}
      {next && (
        <span style={{ color: '#336633', marginLeft: 4 }}>→ {next.title}</span>
      )}
    </span>
  );
}

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function miniSparkline(values: number[], color: string): JSX.Element {
  if (values.length < 2) return <></>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chars = values.slice(-6).map((v) => {
    const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1));
    return SPARK_CHARS[Math.max(0, Math.min(SPARK_CHARS.length - 1, idx))];
  }).join('');
  return <span style={{ color, fontSize: 11, letterSpacing: 0 }}>{chars}</span>;
}

export function StatusPanel(): JSX.Element {
  const { state, lang } = useGameStore();
  const t = UI[lang];
  const { economy, population, happiness, year, month, speed, running, rciDemand, history } = state;
  const popHistory = history.map((h) => h.population);

  const speedLabel = running
    ? (speed === 'pause' ? t.statusPaused : t.statusSpeed(speed))
    : t.statusPaused;
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
        <span style={{ color: TERM_DIM }}>{t.statusYear} </span>
        <span style={{ color: TERM_AMBER }}>{year}</span>
        <span style={{ color: TERM_DIM }}> {t.statusMonth}</span>{String(month).padStart(2, '0')}
      </span>

      <span>
        <span style={{ color: TERM_DIM }}>💰 </span>
        <span style={{ color: balanceColor }}>{formatMoney(economy.balance)}</span>
        {economy.debt > 0 && (
          <span style={{ color: TERM_RED }}> –{formatMoney(economy.debt)}</span>
        )}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ color: TERM_DIM }}>👥 </span>
        <span style={{ color: TERM_GREEN }}>{population.toLocaleString()}</span>
        {miniSparkline(popHistory, '#006618')}
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
      <RCIBars demand={rciDemand} demandLabel={t.statusDemand} />

      {/* Milestone progress */}
      <MilestonePill />

      <span style={{ marginLeft: 'auto', color: TERM_DIM }}>
        {speedLabel}
      </span>
    </div>
  );
}
