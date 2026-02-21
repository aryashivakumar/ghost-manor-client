import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { useInputController } from '../hooks/useInputController';
import { audioManager } from './AudioManager';
import {
  FlashlightVertexShader, FlashlightFragmentShader, flashlightUniforms,
  createFlashlightGeometry,
} from '../shaders/FlashlightShader';
import {
  GhostBodyVertexShader, GhostBodyFragmentShader, ghostBodyUniforms,
  GhostOutlineVertexShader, GhostOutlineFragmentShader, ghostOutlineUniforms,
} from '../shaders/GhostShader';
import { HUD } from '../components/HUD';
import { Minimap } from '../components/Minimap';

const CELL_SIZE = 2; // world units per grid cell
const WALL_HEIGHT = 3;
const HUNTER_COLORS_HEX = {
  red: '#ff4444', green: '#44ff44', yellow: '#ffff44', blue: '#4488ff', white: '#ffffff',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP
// ─────────────────────────────────────────────────────────────────────────────

function MansionMap({ mapData }) {
  const geometry = useMemo(() => {
    if (!mapData?.walls) return null;
    const geo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(geo, null, mapData.walls.length);

    mapData.walls.forEach(([gx, gz], i) => {
      dummy.position.set(gx * CELL_SIZE + CELL_SIZE / 2, WALL_HEIGHT / 2, gz * CELL_SIZE + CELL_SIZE / 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    return mesh;
  }, [mapData]);

  if (!geometry) return null;

  return (
    <group>
      <primitive object={geometry}>
        <meshLambertMaterial color="#1a1a2e" />
      </primitive>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.01, 31]}>
        <planeGeometry args={[60, 62]} />
        <meshLambertMaterial color="#0d0d1a" />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[30, WALL_HEIGHT, 31]}>
        <planeGeometry args={[60, 62]} />
        <meshLambertMaterial color="#111122" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUNTER PLAYER (first-person camera follows local, others rendered as blobs)
// ─────────────────────────────────────────────────────────────────────────────

function LocalHunterCamera({ player, yawRef }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!player) return;
    const wx = player.position.x * CELL_SIZE;
    const wz = player.position.z * CELL_SIZE;
    camera.position.set(wx, 1.65, wz); // eye height
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = 0;
  });

  return null;
}

function FlashlightBeam({ player }) {
  const matRef = useRef();
  const uniformsRef = useRef(flashlightUniforms());
  const geo = useMemo(() => createFlashlightGeometry(THREE), []);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uBattery.value = player.flashlight?.battery ?? 100;
    matRef.current.uniforms.uIntensity.value = player.flashlight?.active ? 1.0 : 0.0;
  });

  if (!player.flashlight?.active) return null;

  const wx = player.position.x * CELL_SIZE;
  const wz = player.position.z * CELL_SIZE;

  return (
    <mesh
      geometry={geo}
      position={[wx, 1.4, wz]}
      rotation={[0, player.flashlight.angle || 0, 0]}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={FlashlightVertexShader}
        fragmentShader={FlashlightFragmentShader}
        uniforms={uniformsRef.current}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GHOST
// ─────────────────────────────────────────────────────────────────────────────

function GhostEntity({ player, isLocal }) {
  const bodyMatRef = useRef();
  const outlineMatRef = useRef();
  const bodyUniforms = useRef(ghostBodyUniforms());
  const outlineUniforms = useRef(ghostOutlineUniforms());
  const localRole = useGameStore(s => s.localRole);

  const isVisible = player.visible || player.litByFlashlight || player.lightningVisible;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyMatRef.current) {
      bodyMatRef.current.uniforms.uTime.value = t;
      bodyMatRef.current.uniforms.uVisible.value = isVisible || isLocal;
    }
    if (outlineMatRef.current) {
      outlineMatRef.current.uniforms.uTime.value = t;
      outlineMatRef.current.uniforms.uIntensity.value = isVisible ? 1.0 : 0.0;
    }
  });

  const wx = player.position.x * CELL_SIZE;
  const wz = player.position.z * CELL_SIZE;

  // Ghost camera (3rd person floating)
  const { camera } = useThree();
  useFrame(() => {
    if (isLocal) {
      camera.position.set(wx, 4, wz + 3);
      camera.lookAt(wx, 1, wz);
    }
  });

  if (!isVisible && !isLocal && localRole !== 'ghost') return null;

  return (
    <group position={[wx, 1, wz]}>
      {/* Outline (rendered first, slightly larger, back face) */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <shaderMaterial
          ref={outlineMatRef}
          vertexShader={GhostOutlineVertexShader}
          fragmentShader={GhostOutlineFragmentShader}
          uniforms={outlineUniforms.current}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Body blob */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <shaderMaterial
          ref={bodyMatRef}
          vertexShader={GhostBodyVertexShader}
          fragmentShader={GhostBodyFragmentShader}
          uniforms={bodyUniforms.current}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUNTER ENTITY (remote hunters)
// ─────────────────────────────────────────────────────────────────────────────

function HunterEntity({ player }) {
  const color = HUNTER_COLORS_HEX[player.color] || '#ffffff';
  const wx = player.position.x * CELL_SIZE;
  const wz = player.position.z * CELL_SIZE;

  return (
    <group position={[wx, 0.9, wz]}>
      <mesh>
        <capsuleGeometry args={[0.4, 1.0, 4, 8]} />
        <meshLambertMaterial color={color} opacity={player.downed ? 0.4 : 1} transparent />
      </mesh>
      {/* Flashlight beam for remote hunters */}
      {player.flashlight?.active && <FlashlightBeam player={player} />}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BATTERIES
// ─────────────────────────────────────────────────────────────────────────────

function BatteryPack({ battery }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <mesh
      ref={ref}
      position={[battery.position.x * CELL_SIZE, 0.5, battery.position.z * CELL_SIZE]}
    >
      <boxGeometry args={[0.3, 0.5, 0.15]} />
      <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.8} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTNING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

function LightningOverlay() {
  const lightningActive = useGameStore(s => s.lightningActive);
  const { scene } = useThree();

  useEffect(() => {
    if (lightningActive) {
      scene.background = new THREE.Color(0xffffff);
      setTimeout(() => { scene.background = new THREE.Color(0x050510); }, 150);
    }
  }, [lightningActive, scene]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT AUDIO UPDATER
// ─────────────────────────────────────────────────────────────────────────────

function AudioUpdater() {
  const players = useGameStore(s => s.players);
  const localId = useGameStore(s => s.localPlayerId);
  const localRole = useGameStore(s => s.localRole);

  useFrame(() => {
    if (localRole !== 'hunter') return;
    const me = players.find(p => p.id === localId);
    const ghost = players.find(p => p.role === 'ghost');
    if (!me || !ghost) return;

    const dx = (ghost.position.x - me.position.x) * CELL_SIZE;
    const dz = (ghost.position.z - me.position.z) * CELL_SIZE;
    const dist = Math.sqrt(dx * dx + dz * dz);

    audioManager.updateProximityHeartbeat(dist);
    audioManager.setListenerPosition(
      me.position.x * CELL_SIZE, 1.65, me.position.z * CELL_SIZE
    );
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE ROOT
// ─────────────────────────────────────────────────────────────────────────────

function SceneContent({ mapData, yawRef }) {
  const players = useGameStore(s => s.players);
  const batteries = useGameStore(s => s.batteries);
  const localId = useGameStore(s => s.localPlayerId);
  const localRole = useGameStore(s => s.localRole);

  const localPlayer = players.find(p => p.id === localId);
  const ghost = players.find(p => p.role === 'ghost');
  const hunters = players.filter(p => p.role === 'hunter');

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[30, 5, 31]} intensity={0.5} color="#1a1a4e" />

      {/* Map */}
      <MansionMap mapData={mapData} />

      {/* Ghost */}
      {ghost && (
        <GhostEntity
          player={ghost}
          isLocal={ghost.id === localId}
        />
      )}

      {/* Hunters */}
      {hunters.map(hunter => (
        hunter.id === localId
          ? <LocalHunterCamera key={hunter.id} player={hunter} yawRef={yawRef} />
          : <HunterEntity key={hunter.id} player={hunter} />
      ))}

      {/* Local hunter flashlight */}
      {localRole === 'hunter' && localPlayer && localPlayer.flashlight?.active && (
        <FlashlightBeam player={localPlayer} />
      )}

      {/* Battery packs */}
      {batteries.map(b => <BatteryPack key={b.id} battery={b} />)}

      {/* Lightning */}
      <LightningOverlay />

      {/* Audio */}
      <AudioUpdater />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED GAME SCENE
// ─────────────────────────────────────────────────────────────────────────────

export function GameScene({ mapData, sendInput }) {
  const { yawRef } = useInputController(sendInput);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510' }}>
      <Canvas
        camera={{ fov: 80, near: 0.1, far: 200 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(0x050510);
          scene.fog = new THREE.FogExp2(0x050510, 0.03);
        }}
      >
        <SceneContent mapData={mapData} yawRef={yawRef} />
      </Canvas>

      {/* HUD overlay */}
      <HUD />

      {/* Minimap */}
      <Minimap />
    </div>
  );
}
