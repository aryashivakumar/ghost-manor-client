import React, { useState } from 'react';

export function MainMenu({ onCreateRoom, onJoinRoom }) {
  const [view, setView] = useState('main'); // main | create | join
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    onCreateRoom(playerName.trim(), (result) => {
      setLoading(false);
      if (!result.success) setError(result.error || 'Failed to create room');
    });
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!joinCode.trim() || joinCode.length !== 6) return setError('Enter a valid 6-character code');
    setLoading(false);
    setError('');
    onJoinRoom(joinCode.trim().toUpperCase(), playerName.trim(), (result) => {
      setLoading(false);
      if (!result.success) setError(result.error || 'Failed to join room');
    });
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#05050f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      color: '#ccd',
      userSelect: 'none',
    }}>

      {/* Background particles (CSS only) */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2, height: 2,
            background: '#446',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ${Math.random() * 4}s infinite ease-in-out`,
            opacity: 0.3 + Math.random() * 0.4,
          }} />
        ))}
      </div>

      {view === 'main' && (
        <>
          <div style={{
            fontSize: 48, fontWeight: 900, letterSpacing: 8,
            color: '#ffffff', textShadow: '0 0 40px #8844ff, 0 0 80px #4422aa',
            marginBottom: 8,
          }}>
            GHOST MANOR
          </div>
          <div style={{
            fontSize: 11, letterSpacing: 6, color: '#6688cc',
            marginBottom: 60, textTransform: 'uppercase',
          }}>
            Asymmetric Online Horror · 2–4 Players
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 260 }}>
            <MenuButton onClick={() => setView('create')} label="CREATE ROOM" accent="#8844ff" />
            <MenuButton onClick={() => setView('join')} label="JOIN ROOM" accent="#4466ff" />
          </div>

          <div style={{ marginTop: 48, fontSize: 10, color: '#334', letterSpacing: 2 }}>
            ONE GHOST · UP TO THREE HUNTERS · NO AI · NO SOLO
          </div>
        </>
      )}

      {view === 'create' && (
        <FormPanel
          title="CREATE ROOM"
          accent="#8844ff"
          onBack={() => { setView('main'); setError(''); }}
        >
          <NameInput value={playerName} onChange={setPlayerName} />
          {error && <ErrorMsg msg={error} />}
          <MenuButton onClick={handleCreate} label={loading ? 'CREATING...' : 'CREATE'} accent="#8844ff" disabled={loading} />
        </FormPanel>
      )}

      {view === 'join' && (
        <FormPanel
          title="JOIN ROOM"
          accent="#4466ff"
          onBack={() => { setView('main'); setError(''); }}
        >
          <NameInput value={playerName} onChange={setPlayerName} />
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ROOM CODE"
            style={inputStyle('#4466ff')}
            maxLength={6}
          />
          {error && <ErrorMsg msg={error} />}
          <MenuButton onClick={handleJoin} label={loading ? 'JOINING...' : 'JOIN'} accent="#4466ff" disabled={loading} />
        </FormPanel>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

function NameInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 20))}
      placeholder="YOUR NAME"
      style={inputStyle('#8844ff')}
    />
  );
}

function inputStyle(accent) {
  return {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${accent}44`,
    color: '#ccd', fontFamily: "'Courier New', monospace",
    fontSize: 13, letterSpacing: 2,
    outline: 'none', boxSizing: 'border-box',
  };
}

function MenuButton({ onClick, label, accent, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '12px 0',
        background: 'transparent',
        border: `1px solid ${accent}`,
        color: accent, fontFamily: "'Courier New', monospace",
        fontSize: 12, letterSpacing: 4,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => !disabled && (e.target.style.background = accent + '22')}
      onMouseLeave={e => !disabled && (e.target.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}

function FormPanel({ title, children, onBack, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      width: 300, padding: 32,
      border: `1px solid ${accent}33`,
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#446', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 12,
        }}>← BACK</button>
        <div style={{ fontSize: 13, letterSpacing: 4, color: accent }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ color: '#ff4444', fontSize: 11, letterSpacing: 1 }}>
      ⚠ {msg}
    </div>
  );
}
