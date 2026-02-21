import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Connection
  socketId: null,
  connected: false,

  // Room
  roomCode: null,
  gamePhase: 'menu', // menu | lobby | playing | ended

  // Local player info
  localPlayerId: null,
  localRole: null,      // ghost | hunter
  localColor: null,

  // Lobby
  lobbyPlayers: [],

  // Game state (updated every tick)
  players: [],
  batteries: [],
  winner: null,

  // Flashlight local state
  flashlightOn: false,
  flashlightBattery: 100,
  dashCooldown: 0,
  lives: 0,

  // Lightning
  lightningActive: false,

  // HUD notifications
  notifications: [],

  // ── Actions ───────────────────────────────────

  setSocket: (id) => set({ socketId: id, connected: true }),
  setDisconnected: () => set({ connected: false }),

  setRoom: (code) => set({ roomCode: code }),

  setLobbyState: (players) => set({ lobbyPlayers: players }),

  setLocalPlayer: (id, role, color, lives) =>
    set({ localPlayerId: id, localRole: role, localColor: color, lives }),

  startGame: (players) =>
    set({ gamePhase: 'playing', players }),

  updateGameState: (packet) => {
    const { localPlayerId } = get();
    const localPlayer = packet.players.find(p => p.id === localPlayerId);

    set({
      players: packet.players,
      batteries: packet.batteries || [],
      flashlightBattery: localPlayer?.flashlight?.battery ?? get().flashlightBattery,
      dashCooldown: localPlayer?.dashCooldown ?? get().dashCooldown,
      lives: localPlayer?.lives ?? get().lives,
    });
  },

  setLightning: (active) => set({ lightningActive: active }),

  endGame: (winner) => set({ gamePhase: 'ended', winner }),

  toggleFlashlight: () => set(s => ({ flashlightOn: !s.flashlightOn })),

  addNotification: (msg, color = 'white') => {
    const id = Date.now();
    set(s => ({ notifications: [...s.notifications, { id, msg, color }] }));
    setTimeout(() => {
      set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
    }, 3000);
  },

  reset: () => set({
    roomCode: null,
    gamePhase: 'menu',
    localPlayerId: null,
    localRole: null,
    localColor: null,
    lobbyPlayers: [],
    players: [],
    batteries: [],
    winner: null,
    flashlightOn: false,
    flashlightBattery: 100,
    dashCooldown: 0,
    lives: 0,
    lightningActive: false,
    notifications: [],
  }),
}));
