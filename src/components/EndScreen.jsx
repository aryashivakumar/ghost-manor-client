import React from 'react';
import { useGameStore } from '../store/gameStore';

export function EndScreen({ onPlayAgain }) {
  const winner = useGameStore(s => s.winner);

  const isGhostWin = winner === 'ghost';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: isGhostWin ? '#050010' : '#050f05',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      color: '#ccd',
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>
        {isGhostWin ? '👻' : '🔦'}
      </div>

      <div style={{
        fontSize: 36, fontWeight: 900, letterSpacing: 6,
        color: isGhostWin ? '#aa66ff' : '#44ff88',
        textShadow: isGhostWin
          ? '0 0 40px #8844ff, 0 0 80px #4422aa'
          : '0 0 40px #44ff88, 0 0 80px #228844',
        marginBottom: 12,
      }}>
        {isGhostWin ? 'GHOST WINS' : 'HUNTERS WIN'}
      </div>

      <div style={{ color: '#446', fontSize: 12, letterSpacing: 3, marginBottom: 60 }}>
        {isGhostWin
          ? 'All hunters have been eliminated'
          : 'The ghost was banished'}
      </div>

      <button
        onClick={onPlayAgain}
        style={{
          padding: '14px 48px',
          background: 'transparent',
          border: `1px solid ${isGhostWin ? '#8844ff' : '#44ff88'}`,
          color: isGhostWin ? '#8844ff' : '#44ff88',
          fontFamily: "'Courier New', monospace",
          fontSize: 12, letterSpacing: 4,
          cursor: 'pointer',
        }}
      >
        MAIN MENU
      </button>
    </div>
  );
}
