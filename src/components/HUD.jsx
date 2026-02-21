import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

const HUNTER_COLORS = {
  red: '#ff4444', green: '#44ff44', yellow: '#ffff44', blue: '#4488ff',
};

const CELL_SIZE = 2; // must match GameScene

export function HUD() {
  const localRole = useGameStore(s => s.localRole);
  const localColor = useGameStore(s => s.localColor);
  const players = useGameStore(s => s.players);
  const localId = useGameStore(s => s.localPlayerId);
  const flashlightBattery = useGameStore(s => s.flashlightBattery);
  const flashlightOn = useGameStore(s => s.flashlightOn);
  const dashCooldown = useGameStore(s => s.dashCooldown);
  const lives = useGameStore(s => s.lives);
  const notifications = useGameStore(s => s.notifications);
  const lightningActive = useGameStore(s => s.lightningActive);

  const ghost = players.find(p => p.role === 'ghost');
  const localPlayer = players.find(p => p.id === localId);

  const batteryColor = flashlightBattery > 50 ? '#00ff88' : flashlightBattery > 20 ? '#ffaa00' : '#ff3333';

  // ── Ghost proximity vignette ──────────────────────────────────────────
  // Only shown to hunters. Fades in as ghost gets closer.
  // Max glow distance: 12 world units. Full glow at ≤3 units.
  const ghostProximityAlpha = useMemo(() => {
    if (localRole !== 'hunter' || !ghost || !localPlayer) return 0;
    const dx = (ghost.position.x - localPlayer.position.x) * CELL_SIZE;
    const dz = (ghost.position.z - localPlayer.position.z) * CELL_SIZE;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Normalise: 0 = far away (no glow), 1 = very close (full glow)
    const normalized = 1 - Math.min(dist / 24, 1); // 24 world units = max detection range
    // Apply a curve so it only becomes noticeable when genuinely close
    return Math.pow(Math.max(0, normalized), 2.5) * 0.55; // max opacity 0.55
  }, [players, localId, localRole]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: "'Courier New', monospace" }}>

      {/* Ghost proximity vignette — radial white glow at screen edges for hunters */}
      {localRole === 'hunter' && ghostProximityAlpha > 0.005 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,${ghostProximityAlpha}) 100%)`,
          zIndex: 1,
          transition: 'opacity 0.3s ease',
          mixBlendMode: 'screen',
        }} />
      )}

      {/* Lightning flash overlay */}
      {lightningActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.85)',
          zIndex: 50,
          transition: 'opacity 0.1s',
        }} />
      )}

      {/* Crosshair */}
      {!localPlayer?.downed && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 4, height: 4,
          background: localRole === 'ghost' ? '#ff4444' : '#ffffff',
          borderRadius: '50%',
          boxShadow: `0 0 6px ${localRole === 'ghost' ? '#ff444488' : '#ffffff88'}`,
        }} />
      )}

      {/* Role badge top-left */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        padding: '4px 12px',
        background: 'rgba(0,0,0,0.6)',
        border: `1px solid ${localRole === 'ghost' ? '#ffffff44' : HUNTER_COLORS[localColor] + '66'}`,
        color: localRole === 'ghost' ? '#ffffff' : HUNTER_COLORS[localColor],
        fontSize: 12,
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}>
        {localRole === 'ghost' ? '👻 GHOST' : `🔦 HUNTER (${localColor?.toUpperCase()})`}
      </div>

      {/* Hunter HUD (battery + lives) */}
      {localRole === 'hunter' && (
        <div style={{
          position: 'absolute', bottom: 24, left: 24,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Battery bar */}
          <div>
            <div style={{ color: '#aaa', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
              FLASHLIGHT {flashlightOn ? 'ON' : 'OFF'}
            </div>
            <div style={{
              width: 160, height: 8,
              background: '#111', border: '1px solid #333', borderRadius: 2,
            }}>
              <div style={{
                width: `${flashlightBattery}%`, height: '100%',
                background: batteryColor,
                borderRadius: 2,
                transition: 'width 0.1s, background 0.3s',
                boxShadow: flashlightOn ? `0 0 6px ${batteryColor}` : 'none',
              }} />
            </div>
            <div style={{ color: batteryColor, fontSize: 10, marginTop: 2 }}>
              {Math.floor(flashlightBattery)}%
            </div>
          </div>

          {/* Lives */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 10, letterSpacing: 2 }}>LIVES</span>
            {[...Array(localPlayer?.lives ?? lives ?? 0)].map((_, i) => (
              <span key={i} style={{ fontSize: 14 }}>❤️</span>
            ))}
            {localPlayer?.downed && (
              <span style={{ color: '#ff4444', fontSize: 11, animation: 'pulse 1s infinite' }}>
                DOWNED — CALL FOR REVIVE
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ghost HUD */}
      {localRole === 'ghost' && (
        <div style={{
          position: 'absolute', bottom: 24, left: 24,
        }}>
          {/* Health bar */}
          <div style={{ color: '#aaa', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
            SPIRIT ENERGY
          </div>
          <div style={{
            width: 200, height: 10,
            background: '#111', border: '1px solid #444', borderRadius: 2,
          }}>
            <div style={{
              width: `${ghost?.health ?? 100}%`, height: '100%',
              background: 'linear-gradient(90deg, #8844ff, #ffffff)',
              borderRadius: 2,
              boxShadow: '0 0 8px #8844ff88',
              transition: 'width 0.15s',
            }} />
          </div>
          <div style={{ color: '#cca0ff', fontSize: 10, marginTop: 2 }}>
            {Math.floor(ghost?.health ?? 100)} HP
          </div>

          {/* Dash cooldown */}
          <div style={{ marginTop: 8, color: '#aaa', fontSize: 10, letterSpacing: 2 }}>
            DASH {dashCooldown > 0
              ? <span style={{ color: '#ff8844' }}>COOLDOWN {dashCooldown.toFixed(1)}s</span>
              : <span style={{ color: '#44ffaa' }}>READY [SHIFT]</span>
            }
          </div>
        </div>
      )}

      {/* Ghost health for hunters (top right) */}
      {localRole === 'hunter' && ghost && (
        <div style={{
          position: 'absolute', top: 16, right: 196, // leave room for minimap label
          textAlign: 'right',
        }}>
          <div style={{ color: '#aaa', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
            GHOST ENERGY
          </div>
          <div style={{
            width: 120, height: 6,
            background: '#111', border: '1px solid #333', borderRadius: 2,
            marginLeft: 'auto',
          }}>
            <div style={{
              width: `${ghost.health}%`, height: '100%',
              background: '#ffffff',
              borderRadius: 2,
              boxShadow: '0 0 4px #ffffff88',
            }} />
          </div>
        </div>
      )}

      {/* Notifications */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
      }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            padding: '6px 16px',
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${n.color}44`,
            color: n.color,
            fontSize: 13,
            letterSpacing: 1,
            animation: 'fadeIn 0.2s ease',
          }}>
            {n.msg}
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 24, right: 196,
        color: '#333', fontSize: 9, letterSpacing: 1, textAlign: 'right',
        lineHeight: 1.8,
      }}>
        WASD MOVE · MOUSE LOOK · CLICK FLASHLIGHT
        {localRole === 'ghost' && <><br />SHIFT DASH · E ATTACK</>}
        {localRole === 'hunter' && <><br />E REVIVE TEAMMATE</>}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
