import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function useInputController(sendInput) {
  const keysRef = useRef({});
  const yawRef = useRef(0);
  const flashlightRef = useRef(false);
  const frameRef = useRef(null);
  const gamePhase = useGameStore(s => s.gamePhase);
  const localRole = useGameStore(s => s.localRole);
  const toggleFlashlight = useGameStore(s => s.toggleFlashlight);
  const flashlightOn = useGameStore(s => s.flashlightOn);

  const onKeyDown = useCallback((e) => {
    keysRef.current[e.code] = true;

    // Flashlight toggle on click
    if (e.code === 'KeyF') {
      toggleFlashlight();
    }
  }, [toggleFlashlight]);

  const onKeyUp = useCallback((e) => {
    keysRef.current[e.code] = false;
  }, []);

  const onMouseMove = useCallback((e) => {
    yawRef.current -= e.movementX * 0.002;
    // Normalize to [-PI, PI]
    while (yawRef.current > Math.PI) yawRef.current -= 2 * Math.PI;
    while (yawRef.current < -Math.PI) yawRef.current += 2 * Math.PI;
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button === 0) {
      // Left click = toggle flashlight
      const newState = !flashlightRef.current;
      flashlightRef.current = newState;
      useGameStore.getState().flashlightOn = newState;
    }
  }, []);

  const requestPointerLock = useCallback(() => {
    document.body.requestPointerLock?.();
  }, []);

  useEffect(() => {
    if (gamePhase !== 'playing') return;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', requestPointerLock);

    // Input loop at ~60Hz
    let lastFlashlight = null;

    const sendLoop = () => {
      const k = keysRef.current;
      const currentFlashlight = useGameStore.getState().flashlightOn;

      const input = {
        w: !!(k['KeyW'] || k['ArrowUp']),
        a: !!(k['KeyA'] || k['ArrowLeft']),
        s: !!(k['KeyS'] || k['ArrowDown']),
        d: !!(k['KeyD'] || k['ArrowRight']),
        shift: !!k['ShiftLeft'],
        yaw: yawRef.current,
        attack: !!k['KeyE'],
        revive: !!k['KeyE'],
      };

      // Only send flashlight toggle on change
      if (currentFlashlight !== lastFlashlight) {
        input.flashlightToggle = currentFlashlight;
        lastFlashlight = currentFlashlight;
      }

      sendInput(input);
      frameRef.current = requestAnimationFrame(sendLoop);
    };

    frameRef.current = requestAnimationFrame(sendLoop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', requestPointerLock);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gamePhase, onKeyDown, onKeyUp, onMouseMove, sendInput]);

  return { yawRef };
}
