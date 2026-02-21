import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const ROLE_INFO = [
  { emoji: '👻', label: 'GHOST', desc: 'Haunt the hunters. Avoid flashlights.' },
  { emoji: '🔦', label: 'HUNTERS', desc: 'Use flashlights to drain the ghost. Revive teammates.' },
];

export function LobbyScreen({ roomCode, setReady }) {
  const lobbyPlayers = useGameStore(s => s.lobbyPlayers);
  const localId = useGameStore(s => s.localPlayerId) ?? useGameStore(s => s.socketId);
  const [isReady, setIsReady] = useState(false);

  const localPlayer = lobbyPlayers.find(p => p.id === localId);
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every(p => p.ready);
  const canStart = lobbyPlayers.length >= 2;

  const handleReady = () => {
    const next = !isReady;
    setIsReady(next);
    setReady(next);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#05050f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      color: '#ccd',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 6, color: '#446', marginBottom: 24 }}>
        GHOST MANOR — LOBBY
      </div>

      {/* Room code */}
      <div
        onClick={copyCode}
        style={{
          padding: '12px 32px',
          border: '1px solid #8844ff44',
          marginBottom: 40,
          cursor: 'pointer',
          textAlign: 'center',
        }}
        title="Click to copy"
      >
        <div style={{ fontSize: 9, letterSpacing: 3, color: '#446', marginBottom: 4 }}>
          ROOM CODE (click to copy)
        </div>
        <div style={{ fontSize: 36, letterSpacing: 12, color: '#8844ff' }}>
          {roomCode}
        </div>
      </div>

      {/* Player list */}
      <div style={{ width: 400, marginBottom: 32 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: '#446', marginBottom: 12 }}>
          PLAYERS ({lobbyPlayers.length}/4)
        </div>
        {lobbyPlayers.map((player, i) => (
          <div
            key={player.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              marginBottom: 4,
              background: player.id === localId ? 'rgba(136,68,255,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${player.id === localId ? '#8844ff44' : '#22224477'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#446', fontSize: 10 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, letterSpacing: 1 }}>
                {player.name}
                {player.isHost && <span style={{ color: '#ff8844', fontSize: 9, marginLeft: 8 }}>HOST</span>}
                {player.id === localId && <span style={{ color: '#8844ff', fontSize: 9, marginLeft: 8 }}>YOU</span>}
              </span>
            </div>
            <div style={{
              fontSize: 9, letterSpacing: 2,
              color: player.ready ? '#44ff88' : '#446',
            }}>
              {player.ready ? '● READY' : '○ WAITING'}
            </div>
          </div>
        ))}

        {lobbyPlayers.length < 4 && (
          <div style={{
            padding: '10px 16px', marginBottom: 4,
            border: '1px dashed #22224488',
            color: '#334', fontSize: 11, letterSpacing: 2,
          }}>
            + Waiting for player...
          </div>
        )}
      </div>

      {/* Rules summary */}
      <div style={{
        width: 400, padding: '16px 20px',
        border: '1px solid #22224488',
        marginBottom: 32, fontSize: 10, color: '#446',
        lineHeight: 1.8,
      }}>
        <div style={{ color: '#8844ff', marginBottom: 8, letterSpacing: 2 }}>ROLES</div>
        Roles are assigned randomly at game start.<br />
        1 Ghost · Remaining players are Hunters.<br />
        Ghost wins: eliminate all hunters.<br />
        Hunters win: drain the ghost to 0 HP.
      </div>

      {!canStart && (
        <div style={{ color: '#446', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
          Need at least 2 players to start
        </div>
      )}

      <button
        onClick={handleReady}
        disabled={!canStart}
        style={{
          padding: '14px 48px',
          background: isReady ? '#44ff8822' : 'transparent',
          border: `1px solid ${isReady ? '#44ff88' : '#446'}`,
          color: isReady ? '#44ff88' : '#6688cc',
          fontFamily: "'Courier New', monospace",
          fontSize: 13, letterSpacing: 4,
          cursor: canStart ? 'pointer' : 'default',
          opacity: canStart ? 1 : 0.4,
          transition: 'all 0.2s',
        }}
      >
        {isReady ? '✓ READY' : 'READY UP'}
      </button>

      {allReady && (
        <div style={{
          marginTop: 16, color: '#44ff88', fontSize: 10, letterSpacing: 3,
          animation: 'pulse 0.8s infinite',
        }}>
          STARTING GAME...
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
