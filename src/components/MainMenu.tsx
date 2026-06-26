import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SaveSlotMeta } from '../store/gameStore';
import { UI } from '../i18n';
import type { Lang, UIStrings } from '../i18n';

type MenuScreen = 'main' | 'new-city' | 'load' | 'options';

// ─── constants ────────────────────────────────────────────────────────────────

const SKYLINE = `
    ▐▌    ▐██▌   ▐▌   ▐███▌  ▐▌   ▐██▌      ▐███▌   ▐▌   ▐██▌  ▐▌
   ▐███▌  ████  ▐██▌  █████  ██  ▐████▌     ▐█████▌ ▐██▌  ████ ▐██▌
  ▐█████▌ ████ ▐████▌ █████  ██  ▐████▌    ▐███████▌ ████ ████▐████▌
 ▐███████▌█████▐█████▌███████▐██▌▐██████▌ ▐█████████▌████▐████▐█████▌
▄█████████████████████████████████████████████████████████████████████▄`.trimStart();

const MONO = '"JetBrains Mono", "Fira Code", monospace';
const VT   = '"VT323", monospace';

// ─── shared button ────────────────────────────────────────────────────────────

interface MenuButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
}

function MenuButton({ label, onClick, active, accent, disabled }: MenuButtonProps) {
  const isFilled = accent && active !== false;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:    isFilled ? '#0a2a0a' : 'transparent',
        border:        `1px solid ${isFilled ? '#00ff41' : '#1a3a1a'}`,
        color:         disabled ? '#333' : isFilled ? '#00ff41' : '#558855',
        fontFamily:    MONO,
        fontSize:      11,
        padding:       '7px 20px',
        cursor:        disabled ? 'default' : 'pointer',
        letterSpacing: 1,
        transition:    'border-color 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#00ff41';
          (e.currentTarget as HTMLButtonElement).style.color = '#00ff41';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = isFilled ? '#00ff41' : '#1a3a1a';
          (e.currentTarget as HTMLButtonElement).style.color = isFilled ? '#00ff41' : '#558855';
        }
      }}
    >
      {label}
    </button>
  );
}

// ─── sub-screens ──────────────────────────────────────────────────────────────

interface NewCityScreenProps {
  t: UIStrings;
  onStart: (name: string) => void;
  onBack: () => void;
}

function NewCityScreen({ t, onStart, onBack }: NewCityScreenProps) {
  const [name, setName] = useState('Terminal City');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.select(); }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) onStart(name.trim());
    if (e.key === 'Escape') onBack();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{ color: '#00ff41', fontFamily: MONO, fontSize: 13, letterSpacing: 3 }}>{t.newCityTitle}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
        <label style={{ color: '#558855', fontFamily: MONO, fontSize: 11, letterSpacing: 1 }}>
          {t.cityNameLabel}
        </label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          maxLength={32}
          spellCheck={false}
          style={{
            background:    '#0d1a0d',
            border:        '1px solid #00ff41',
            color:         '#00ff41',
            fontFamily:    MONO,
            fontSize:      14,
            padding:       '8px 12px',
            outline:       'none',
            letterSpacing: 1,
            caretColor:    '#00ff41',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <MenuButton label={t.startBtn} active={!!name.trim()} onClick={() => name.trim() && onStart(name.trim())} accent />
        <MenuButton label={t.backBtn} onClick={onBack} />
      </div>
    </div>
  );
}

interface LoadScreenProps {
  t: UIStrings;
  onLoad: (slot: number) => void;
  onBack: () => void;
}

function LoadScreen({ t, onLoad, onBack }: LoadScreenProps) {
  const { getSavesMeta } = useGameStore();
  const slots: SaveSlotMeta[] = getSavesMeta();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const first = slots.findIndex((s) => !s.isEmpty);
    setSelected(first >= 0 ? first : 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   setSelected((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowDown') setSelected((p) => Math.min(slots.length - 1, p + 1));
      if (e.key === 'Enter') {
        const slot = slots[selected];
        if (slot && !slot.isEmpty) onLoad(slot.slot);
      }
      if (e.key === 'Escape') onBack();
    },
    [selected, slots, onLoad, onBack],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{ color: '#00ff41', fontFamily: MONO, fontSize: 13, letterSpacing: 3 }}>{t.loadTitle}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 420 }}>
        {slots.map((slot, i) => (
          <button
            key={slot.slot}
            onClick={() => { if (!slot.isEmpty) onLoad(slot.slot); setSelected(i); }}
            onMouseEnter={() => setSelected(i)}
            style={{
              background:     selected === i ? '#0a2a0a' : '#0d0d0d',
              border:         `1px solid ${selected === i ? '#00ff41' : '#1a3a1a'}`,
              color:          slot.isEmpty ? '#333' : '#00ff41',
              fontFamily:     MONO,
              fontSize:       11,
              padding:        '10px 14px',
              cursor:         slot.isEmpty ? 'default' : 'pointer',
              textAlign:      'left',
              display:        'flex',
              justifyContent: 'space-between',
              letterSpacing:  0.5,
            }}
          >
            <span>
              {selected === i ? '▶ ' : '  '}
              {slot.slot === 0 ? t.autosave : `${t.slot} ${slot.slot}`}
            </span>
            {slot.isEmpty ? (
              <span style={{ color: '#2a2a2a' }}>{t.empty}</span>
            ) : (
              <span style={{ color: '#558855' }}>
                {t.yearLabel} {slot.year} · {slot.population?.toLocaleString()} {t.pop} · ${slot.balance?.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ color: '#333', fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>{t.loadHint}</div>
      <MenuButton label={t.backBtn} onClick={onBack} />
    </div>
  );
}

interface OptionsScreenProps {
  t: UIStrings;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  onBack: () => void;
}

function OptionsScreen({ t, lang, onLangChange, onBack }: OptionsScreenProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onBack]);

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111', padding: '7px 0' }}>
      <span style={{ color: '#558855', fontFamily: MONO, fontSize: 11, letterSpacing: 1 }}>{label}</span>
      <span style={{ color: '#00ff41', fontFamily: MONO, fontSize: 11 }}>{value}</span>
    </div>
  );

  const langToggle = (
    <span style={{ display: 'flex', gap: 4 }}>
      {(['en', 'es'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onLangChange(l)}
          style={{
            background:    lang === l ? '#0a2a0a' : 'transparent',
            border:        `1px solid ${lang === l ? '#00ff41' : '#1a3a1a'}`,
            color:         lang === l ? '#00ff41' : '#2a5a2a',
            fontFamily:    MONO,
            fontSize:      10,
            padding:       '2px 8px',
            cursor:        'pointer',
            letterSpacing: 1,
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{ color: '#00ff41', fontFamily: MONO, fontSize: 13, letterSpacing: 3 }}>{t.optionsTitle}</div>

      <div style={{ width: 380, display: 'flex', flexDirection: 'column' }}>
        {row(t.optLanguage,   langToggle)}
        {row(t.optVersion,    'v0.1')}
        {row(t.optEngine,     t.optEngineVal)}
        {row(t.optAutosave,   t.optAutosaveVal)}
        {row(t.optSaveSlots,  '3 (0 · 1 · 2)')}
        {row(t.optResolution, '40 × 20 tiles')}
      </div>

      <div style={{ color: '#333', fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>{t.comingSoon}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 380 }}>
        <div style={{ color: '#2a5a2a', fontFamily: MONO, fontSize: 10, letterSpacing: 1, borderTop: '1px solid #111', paddingTop: 10 }}>
          {t.controls}
        </div>
        {t.ctrlRows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 10 }}>
            <span style={{ color: '#00b830' }}>{k}</span>
            <span style={{ color: '#333' }}>{v}</span>
          </div>
        ))}
      </div>

      <MenuButton label={t.backBtn} onClick={onBack} />
    </div>
  );
}

// ─── main menu ────────────────────────────────────────────────────────────────

interface MainMenuProps {
  onEnterGame: () => void;
}

export function MainMenu({ onEnterGame }: MainMenuProps) {
  const [screen, setScreen]     = useState<MenuScreen>('main');
  const [selected, setSelected] = useState(0);
  const [blink, setBlink]       = useState(true);

  const { resetGame, loadGame, getSavesMeta, lang, setLang } = useGameStore();
  const t = UI[lang];
  const hasSaves = getSavesMeta().some((s) => !s.isEmpty);

  const menuItems = [
    { key: 'N', label: t.newCity,  screen: 'new-city' as MenuScreen },
    { key: lang === 'en' ? 'L' : 'C', label: t.loadCity, screen: 'load' as MenuScreen },
    { key: 'O', label: t.options,  screen: 'options' as MenuScreen },
  ];

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (screen !== 'main') return;
    const loadKey = lang === 'en' ? 'l' : 'c';
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')   setSelected((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowDown') setSelected((p) => Math.min(menuItems.length - 1, p + 1));
      if (e.key === 'Enter')     handleSelect(menuItems[selected]!.screen);
      if (e.key === 'n' || e.key === 'N') handleSelect('new-city');
      if (e.key === loadKey || e.key === loadKey.toUpperCase()) handleSelect('load');
      if (e.key === 'o' || e.key === 'O') handleSelect('options');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [screen, selected, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (target: MenuScreen) => {
    if (target === 'load' && !hasSaves) return;
    setScreen(target);
  };

  const handleNewCity = (name: string) => {
    resetGame();
    const store = useGameStore.getState();
    useGameStore.setState({
      state: {
        ...store.state,
        log: [{
          id:        'log-0',
          timestamp: t.timestamp,
          message:   t.welcome(name),
          severity:  'info',
          source:    'system',
        }],
      },
    });
    onEnterGame();
  };

  const handleLoad = (slot: number) => {
    loadGame(slot);
    onEnterGame();
  };

  return (
    <div
      style={{
        fontFamily:      MONO,
        color:           '#00ff41',
        position:        'fixed',
        inset:           0,
        backgroundColor: '#0a0a0a',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        overflow:        'hidden',
      }}
    >
      {/* Scanlines */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        pointerEvents:   'none',
        zIndex:          1,
      }} />

      {/* Language toggle (top-right shortcut) */}
      <div style={{ position: 'absolute', top: 14, right: 18, zIndex: 3, display: 'flex', gap: 4 }}>
        {(['en', 'es'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              background:    lang === l ? '#0a2a0a' : 'transparent',
              border:        `1px solid ${lang === l ? '#00ff41' : '#1a3a1a'}`,
              color:         lang === l ? '#00ff41' : '#2a5a2a',
              fontFamily:    MONO,
              fontSize:      10,
              padding:       '3px 8px',
              cursor:        'pointer',
              letterSpacing: 1,
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

        {/* City skyline */}
        <pre style={{ color: '#1a4a1a', fontSize: 10, lineHeight: 1.2, margin: 0, userSelect: 'none', textAlign: 'center' }}>
          {SKYLINE}
        </pre>

        {/* Title — VT323 font */}
        <div style={{ textAlign: 'center', userSelect: 'none', marginTop: 8, marginBottom: 2 }}>
          <div style={{ fontFamily: VT, color: '#00ff41', fontSize: 96, lineHeight: 0.9, letterSpacing: 6, textShadow: '0 0 28px #00ff4155, 0 0 8px #00ff4122' }}>
            TERMINAL
          </div>
          <div style={{ fontFamily: VT, color: '#00cc35', fontSize: 52, lineHeight: 1, letterSpacing: 22, textIndent: 22 }}>
            CITY
          </div>
        </div>

        <div style={{ color: '#2a5a2a', fontFamily: MONO, fontSize: 10, letterSpacing: 4, marginTop: 10, marginBottom: 28 }}>
          {t.subtitle}
        </div>

        <div style={{ color: '#1a3a1a', fontFamily: MONO, fontSize: 10, marginBottom: 28, letterSpacing: 2 }}>
          {'─'.repeat(52)}
        </div>

        {/* Main menu items */}
        {screen === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {menuItems.map((item, i) => {
              const isDisabled = item.screen === 'load' && !hasSaves;
              const isSelected = selected === i;
              return (
                <button
                  key={item.key}
                  onClick={() => !isDisabled && handleSelect(item.screen)}
                  onMouseEnter={() => setSelected(i)}
                  disabled={isDisabled}
                  style={{
                    background:    isSelected && !isDisabled ? '#0a2a0a' : 'transparent',
                    border:        `1px solid ${isSelected && !isDisabled ? '#00ff41' : '#111'}`,
                    color:         isDisabled ? '#2a2a2a' : isSelected ? '#00ff41' : '#558855',
                    fontFamily:    MONO,
                    fontSize:      13,
                    padding:       '10px 40px',
                    cursor:        isDisabled ? 'default' : 'pointer',
                    width:         300,
                    textAlign:     'left',
                    letterSpacing: 2,
                    display:       'flex',
                    alignItems:    'center',
                    gap:           12,
                    whiteSpace:    'nowrap',
                    transition:    'background 0.1s, border-color 0.1s, color 0.1s',
                  }}
                >
                  <span style={{ width: 20, color: isDisabled ? '#2a2a2a' : '#00b830', fontSize: 10, fontFamily: MONO }}>
                    [{item.key}]
                  </span>
                  {item.label}
                  {isDisabled && <span style={{ color: '#222', fontSize: 9, marginLeft: 'auto' }}>{t.noSaves}</span>}
                </button>
              );
            })}
          </div>
        )}

        {screen === 'new-city' && (
          <NewCityScreen t={t} onStart={handleNewCity} onBack={() => setScreen('main')} />
        )}
        {screen === 'load' && (
          <LoadScreen t={t} onLoad={handleLoad} onBack={() => setScreen('main')} />
        )}
        {screen === 'options' && (
          <OptionsScreen t={t} lang={lang} onLangChange={setLang} onBack={() => setScreen('main')} />
        )}

        {/* Footer */}
        {screen === 'main' && (
          <div style={{ marginTop: 32, color: '#1a3a1a', fontFamily: MONO, fontSize: 9, letterSpacing: 2, textAlign: 'center' }}>
            {t.footerHint}
            <br />
            <span style={{ color: '#111' }}>{blink ? '█' : ' '} terminal-city/v0.1</span>
          </div>
        )}
      </div>
    </div>
  );
}
