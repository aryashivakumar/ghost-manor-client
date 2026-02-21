import React, { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { MainMenu } from './components/MainMenu';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScene } from './game/GameScene';
import { EndScreen } from './components/EndScreen';

export default function App() {
  const gamePhase = useGameStore(s => s.gamePhase);
  const roomCode = useGameStore(s => s.roomCode);
  const mapDataRef = useRef(null);

  const { createRoom, joinRoom, setReady, sendInput } = useSocket();
  const setRoom = useGameStore(s => s.setRoom);
  const reset = useGameStore(s => s.reset);
  const setLocalPlayer = useGameStore(s => s.setLocalPlayer);

  // Capture mapData on game start
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      s => s.gamePhase,
      (phase) => {
        if (phase === 'playing') {
          // mapData stored separately since it's large and doesn't need reactivity
        }
      }
    );
    return unsub;
  }, []);

  const handleCreateRoom = (playerName, cb) => {
    createRoom(playerName, (result) => {
      if (result.success) {
        setRoom(result.code);
        useGameStore.setState({ gamePhase: 'lobby', localPlayerId: result.player?.id });
      }
      cb(result);
    });
  };

  const handleJoinRoom = (code, playerName, cb) => {
    joinRoom(code, playerName, (result) => {
      if (result.success) {
        setRoom(result.code);
        useGameStore.setState({ gamePhase: 'lobby', localPlayerId: result.player?.id });
      }
      cb(result);
    });
  };

  const handlePlayAgain = () => {
    reset();
  };

  if (gamePhase === 'menu') {
    return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (gamePhase === 'lobby') {
    return <LobbyScreen roomCode={roomCode} setReady={setReady} />;
  }

  if (gamePhase === 'playing') {
    // Get map data from store (set on game:start)
    const mapData = useGameStore.getState().mapData;
    return <GameScene mapData={mapData} sendInput={sendInput} />;
  }

  if (gamePhase === 'ended') {
    return <EndScreen onPlayAgain={handlePlayAgain} />;
  }

  return null;
}
