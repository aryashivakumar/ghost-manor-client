import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useInputController(sendInput) {
  const keysRef = useRef({});
  const yawRef = useRef(0);
  const flashlightRef = useRef(false);
  const frameRef = useRef(null);

  useEffect(() => {
    const gamePhase = useGameStore.getState().gamePhase;
    if (gamePhase !== 'playing') return;

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return;
      yawRef.current -= e.movementX * 0.002;
    };
    const onClick = () => {
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      } else {
        flashlightRef.current = !flashlightRef.current;
        useGameStore.getState().toggleFlashlight();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    let lastFlashlightSent = null;

    const loop = () => {
      const k = keysRef.current;
      const currentFlashlight = flashlightRef.current;

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

      if (currentFlashlight !== lastFlashlightSent) {
        input.flashlightToggle = currentFlashlight;
        lastFlashlightSent = currentFlashlight;
      }

      sendInput(input);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [sendInput]);

  return { yawRef };
}
