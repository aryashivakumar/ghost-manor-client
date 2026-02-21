import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const MAP_SIZE = 160;
const HUNTER_COLORS_HEX = {
  red: '#ff4444', green: '#44ff44', yellow: '#ffff44', blue: '#4488ff',
};

export function Minimap() {
  const canvasRef = useRef(null);
  const players = useGameStore(s => s.players);
  const localId = useGameStore(s => s.localPlayerId);
  const mapData = useGameStore(s => s.mapData);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(5, 5, 20, 0.92)';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    const GRID_W = mapData?.width || 30;
    const GRID_H = mapData?.height || 31;
    const cellW = MAP_SIZE / GRID_W;
    const cellH = MAP_SIZE / GRID_H;

    // Draw walls
    if (mapData?.walls) {
      ctx.fillStyle = '#445566';
      for (const [wx, wz] of mapData.walls) {
        ctx.fillRect(wx * cellW, wz * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw players
    for (const player of players) {
      if (player.eliminated) continue;
      const px = player.position.x * cellW;
      const pz = player.position.z * cellH;

      if (player.role === 'hunter') {
        const color = HUNTER_COLORS_HEX[player.color] || '#ffffff';
        ctx.beginPath();
        ctx.arc(px, pz, player.downed ? 2 : 4, 0, Math.PI * 2);
        ctx.fillStyle = player.downed ? color + '88' : color;
        ctx.fill();
        if (player.id === localId) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (player.role === 'ghost' && player.minimapVisible) {
        ctx.beginPath();
        ctx.arc(px, pz, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, pz, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#557';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, MAP_SIZE - 2, MAP_SIZE - 2);

  }, [players, localId, mapData]);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      border: '2px solid #446', borderRadius: 4,
      overflow: 'hidden', opacity: 0.9,
      boxShadow: '0 0 20px rgba(0,0,80,0.8)',
    }}>
      <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} />
    </div>
  );
}
