import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket() {
  const store = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    socketInstance = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      store.setSocket(socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      store.setDisconnected();
    });

    // ── Lobby Events ─────────────────────────────────
    socketInstance.on('lobby:state', ({ players }) => {
      store.setLobbyState(players);
    });

    // ── Game Events ──────────────────────────────────
    socketInstance.on('game:start', ({ players }) => {
      const localId = socketInstance.id;
      const me = players.find(p => p.id === localId);
      if (me) {
        store.setLocalPlayer(me.id, me.role, me.color, me.lives);
      }
      store.startGame(players);
    });

    socketInstance.on('game:state', (packet) => {
      store.updateGameState(packet);
    });

    socketInstance.on('game:end', ({ winner }) => {
      store.endGame(winner);
    });

    // ── Lightning ────────────────────────────────────
    socketInstance.on('lightning:strike', () => {
      store.setLightning(true);
      setTimeout(() => store.setLightning(false), 500);
    });

    // ── Hit / Damage Events ──────────────────────────
    socketInstance.on('hunter:hit', ({ lives }) => {
      store.addNotification(`You were attacked! ${lives} lives left`, 'red');
    });

    socketInstance.on('hunter:eliminated', ({ hunterId }) => {
      if (hunterId === socketInstance.id) {
        store.addNotification('You have been eliminated!', 'red');
      } else {
        store.addNotification('A hunter was eliminated!', 'yellow');
      }
    });

    socketInstance.on('hunter:revived', ({ hunterId }) => {
      if (hunterId === socketInstance.id) {
        store.addNotification('You were revived!', 'green');
      }
    });

    socketInstance.on('ghost:hit', () => {
      // handled via game:state
    });

    socketInstance.on('battery:pickup', ({ battery }) => {
      store.addNotification('Battery refilled!', 'cyan');
    });

    return () => {
      // Don't destroy on component unmount — keep socket alive
    };
  }, []);

  const createRoom = useCallback((playerName, callback) => {
    socketInstance?.emit('room:create', { playerName }, callback);
  }, []);

  const joinRoom = useCallback((code, playerName, callback) => {
    socketInstance?.emit('room:join', { code, playerName }, callback);
  }, []);

  const setReady = useCallback((ready = true) => {
    socketInstance?.emit('room:ready', { ready });
  }, []);

  const sendInput = useCallback((input) => {
    socketInstance?.emit('input', input);
  }, []);

  const sendChat = useCallback((text) => {
    socketInstance?.emit('chat:message', { text });
  }, []);

  return { createRoom, joinRoom, setReady, sendInput, sendChat, socket: socketInstance };
}

export function getSocket() {
  return socketInstance;
}
