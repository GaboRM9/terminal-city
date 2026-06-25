import { useGameStore } from '../store/gameStore';
import type { HistorySnapshot } from '../engine/types';

// ─────────────────────────────────────────────
//  24-month sparkline charts panel
// ─────────────────────────────────────────────

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(values: number[]): string {
  if (values.length === 0) return '—';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1));
      return SPARK_CHARS[Math.max(0, Math.min(SPARK_CHARS.length - 1, idx))];
    })
    .join('');
}

function trend(values: number[]): string {
  if (values.length < 2) return '';
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last > prev) return ' ↑';
  if (last < prev) return ' ↓';
  return ' →';
}

function trendColor(values: number[], higherIsBetter = true): string {
  if (values.length < 2) return '#555';
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last === prev) return '#555';
  const improving = higherIsBetter ? last > prev : last < prev;
  return improving ? '#00ff41' : '#ff4400';
}

interface ChartRowProps {
  label: string;
  values: number[];
  color: string;
  fmt?: (v: number) => string;
  higherIsBetter?: boolean;
}

function ChartRow({ label, values, color, fmt, higherIsBetter = true }: ChartRowProps): JSX.Element {
  const last = values[values.length - 1] ?? 0;
  const formatted = fmt ? fmt(last) : String(last);
  const spark = sparkline(values);
  const tc = trendColor(values, higherIsBetter);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 80px',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <span style={{ color: '#555', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontSize: 13, letterSpacing: 0.5 }}>{spark}</span>
      <span style={{ color: tc, fontSize: 11, textAlign: 'right' }}>
        {formatted}
        <span style={{ color: tc, fontSize: 10 }}>{trend(values)}</span>
      </span>
    </div>
  );
}

export function ChartsPanel(): JSX.Element {
  const { state } = useGameStore();
  const h: HistorySnapshot[] = state.history;

  const get = (key: keyof HistorySnapshot) => h.map((s) => s[key] as number);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 10px',
        backgroundColor: '#060606',
        fontFamily: '"JetBrains Mono", monospace',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 10,
          color: '#336633',
          letterSpacing: 1,
          marginBottom: 10,
          borderBottom: '1px solid #1a3a1a',
          paddingBottom: 4,
        }}
      >
        GRÁFICOS — últimos {h.length} meses
      </div>

      {h.length < 2 ? (
        <div style={{ color: '#333', fontSize: 11 }}>
          Avanza al menos 2 meses para ver gráficos.
        </div>
      ) : (
        <>
          <div style={{ color: '#2a4a2a', fontSize: 10, marginBottom: 6 }}>
            ECONOMÍA
          </div>
          <ChartRow
            label="Balance"
            values={get('balance')}
            color="#00ff41"
            fmt={(v) => `$${v.toLocaleString()}`}
          />
          <ChartRow
            label="Ingresos"
            values={get('income')}
            color="#44cc00"
            fmt={(v) => `$${v}`}
          />
          <ChartRow
            label="Gastos"
            values={get('expenses')}
            color="#ffb000"
            fmt={(v) => `$${v}`}
            higherIsBetter={false}
          />

          <div style={{ color: '#2a4a2a', fontSize: 10, margin: '10px 0 6px' }}>
            CIUDAD
          </div>
          <ChartRow
            label="Población"
            values={get('population')}
            color="#00aaff"
            fmt={(v) => String(v)}
          />
          <ChartRow
            label="Felicidad"
            values={get('happiness')}
            color="#ffee00"
            fmt={(v) => `${v}%`}
          />

          <div style={{ color: '#2a4a2a', fontSize: 10, margin: '10px 0 6px' }}>
            DEMANDA RCI
          </div>
          <ChartRow
            label="Residencial R"
            values={get('rDemand')}
            color="#00ff41"
            fmt={(v) => `${v}%`}
          />
          <ChartRow
            label="Comercial C"
            values={get('cDemand')}
            color="#ffb000"
            fmt={(v) => `${v}%`}
          />
          <ChartRow
            label="Industrial I"
            values={get('iDemand')}
            color="#ff6600"
            fmt={(v) => `${v}%`}
          />
        </>
      )}
    </div>
  );
}
