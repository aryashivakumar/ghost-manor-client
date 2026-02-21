import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { useInputController } from '../hooks/useInputController';
import { HUD } from '../components/HUD';
import { Minimap } from '../components/Minimap';

const CELL_SIZE = 2;
const WALL_HEIGHT = 3;

const HUNTER_COLORS_HEX = {
  red: '#ff4444', green: '#44ff44', yellow: '#ffff44', blue: '#4488ff',
};

// ─── MAP ─────────────────────────────────────────────────────────────────────

function MansionMap({ mapData }) {
  const instancedMesh = useMemo(() => {
    if (!mapData?.walls?.length) return null;
    const geo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const mat = new THREE.MeshLambertMaterial({ color: '#3a3a6a' });
    const mesh = new THREE.InstancedMesh(geo, mat, mapData.walls.length);
    const dummy = new THREE.Object3D();
    mapData.walls.forEach(([gx, gz], i) => {
      dummy.position.set(gx * CELL_SIZE + 1, WALL_HEIGHT / 2, gz * CELL_SIZE + 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [mapData]);

  if (!instancedMesh) return null;

  const mw = (mapData.width || 30) * CELL_SIZE;
  const mh = (mapData.height || 31) * CELL_SIZE;

  return (
    <group>
      <primitive object={instancedMesh} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mw / 2, 0, mh / 2]}>
        <planeGeometry args={[mw, mh]} />
        <meshLambertMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

// ─── FIRST PERSON CAMERA ─────────────────────────────────────────────────────

function FirstPersonCamera({ player, yawRef }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!player) return;
    camera.position.set(player.position.x * CELL_SIZE, 1.6, player.position.z * CELL_SIZE);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
  });
  return null;
}

// ─── FLASHLIGHT ──────────────────────────────────────────────────────────────
// Uses a SpotLight. The trick: we attach a target object to the scene
// and move it every frame to where the hunter is facing.

function HunterFlashlight({ player, yawRef, isLocal }) {
  const lightRef = useRef();
  const targetObj = useMemo(() => new THREE.Object3D(), []);
  const { scene } = useThree();

  useEffect(() => {
    scene.add(targetObj);
    return () => scene.remove(targetObj);
  }, [scene, targetObj]);

  useFrame(() => {
    if (!player || !lightRef.current) return;
    const active = player.flashlight?.active ?? false;
    const yaw = isLocal ? yawRef.current : (player.flashlight?.angle || 0);
    const px = player.position.x * CELL_SIZE;
    const pz = player.position.z * CELL_SIZE;

    lightRef.current.position.set(px, 1.6, pz);
    lightRef.current.intensity = active ? 4 : 0;

    // move target 12 units ahead of facing direction
    targetObj.position.set(
      px - Math.sin(yaw) * 12,
      1.6,
      pz - Math.cos(yaw) * 12
    );
    targetObj.updateMatrixWorld();
    lightRef.current.target = targetObj;
  });

  return (
    <spotLight
      ref={lightRef}
      angle={Math.PI / 7}
      penumbra={0.25}
      distance={18}
      intensity={0}
      color="#e8eeff"
      castShadow={false}
      decay={1.5}
    />
  );
}

// ─── GHOST ───────────────────────────────────────────────────────────────────

function GhostCamera({ player, yawRef }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!player) return;
    const wx = player.position.x * CELL_SIZE;
    const wz = player.position.z * CELL_SIZE;
    const yaw = yawRef.current;
    camera.position.set(wx + Math.sin(yaw) * 4, 3.5, wz + Math.cos(yaw) * 4);
    camera.lookAt(wx, 1, wz);
  });
  return null;
}

function GhostBlob({ player, isLocal }) {
  const ref = useRef();
  const localRole = useGameStore(s => s.localRole);
  const isVisible = player.visible || player.litByFlashlight || player.lightningVisible || isLocal;

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 1.1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.12;
    }
  });

  if (!isVisible && localRole !== 'ghost') return null;

  return (
    <mesh ref={ref} position={[player.position.x * CELL_SIZE, 1.1, player.position.z * CELL_SIZE]}>
      <sphereGeometry args={[0.55, 16, 12]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#aaaaff"
        emissiveIntensity={0.6}
        transparent
        opacity={isLocal ? 0.65 : 0.92}
      />
    </mesh>
  );
}

// ─── REMOTE HUNTER ───────────────────────────────────────────────────────────

function RemoteHunter({ player }) {
  const color = HUNTER_COLORS_HEX[player.color] || '#ffffff';
  return (
    <group position={[player.position.x * CELL_SIZE, 0, player.position.z * CELL_SIZE]}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.3, 1.0, 4, 8]} />
        <meshLambertMaterial color={color} transparent opacity={player.downed ? 0.3 : 1} />
      </mesh>
    </group>
  );
}

// ─── BATTERY ─────────────────────────────────────────────────────────────────

function BatteryPack({ battery }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <group ref={ref} position={[battery.position.x * CELL_SIZE, 0.6, battery.position.z * CELL_SIZE]}>
      <mesh>
        <boxGeometry args={[0.25, 0.45, 0.12]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1.5} />
      </mesh>
      <pointLight color="#00ffcc" intensity={1} distance={3} />
    </group>
  );
}

// ─── SCENE ───────────────────────────────────────────────────────────────────

function SceneContent({ mapData, yawRef }) {
  const players = useGameStore(s => s.players);
  const batteries = useGameStore(s => s.batteries);
  const localId = useGameStore(s => s.localPlayerId);
  const localRole = useGameStore(s => s.localRole);
  const lightningActive = useGameStore(s => s.lightningActive);
  const { scene } = useThree();

  const localPlayer = players.find(p => p.id === localId);
  const ghost = players.find(p => p.role === 'ghost');
  const hunters = players.filter(p => p.role === 'hunter');

  useEffect(() => {
    if (lightningActive) {
      scene.background = new THREE.Color(0xffffff);
      setTimeout(() => { scene.background = new THREE.Color(0x050510); }, 200);
    }
  }, [lightningActive, scene]);

  return (
    <>
      {/* Base ambient so you can always see walls */}
      <ambientLight intensity={0.4} color="#445566" />
      {/* Soft fill from above */}
      <directionalLight position={[15, 20, 15]} intensity={0.3} color="#334466" />

      <MansionMap mapData={mapData} />

      {/* Ghost */}
      {ghost && <GhostBlob player={ghost} isLocal={ghost.id === localId} />}
      {localRole === 'ghost' && localPlayer && <GhostCamera player={localPlayer} yawRef={yawRef} />}

      {/* Hunters */}
      {hunters.map(h => (
        <React.Fragment key={h.id}>
          {h.id === localId
            ? <FirstPersonCamera player={h} yawRef={yawRef} />
            : <RemoteHunter player={h} />
          }
          <HunterFlashlight player={h} yawRef={yawRef} isLocal={h.id === localId} />
        </React.Fragment>
      ))}

      {/* Batteries */}
      {batteries.map(b => <BatteryPack key={b.id} battery={b} />)}
    </>
  );
}

// ─── EXPORTED ────────────────────────────────────────────────────────────────

export function GameScene({ mapData, sendInput }) {
  const { yawRef } = useInputController(sendInput);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510', position: 'relative' }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(0x050510);
          scene.fog = new THREE.Fog(0x050510, 12, 30);
        }}
      >
        <SceneContent mapData={mapData} yawRef={yawRef} />
      </Canvas>
      <HUD />
      <Minimap />
    </div>
  );
}
