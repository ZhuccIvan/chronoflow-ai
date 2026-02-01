import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Html, Line, OrbitControls, Points, RoundedBox, Sphere } from '@react-three/drei';
import { DiagramData, AppMode } from '../types';
import * as THREE from 'three';

interface SceneProps {
  data: DiagramData;
  mode: AppMode;
  currentStep: number;
}

// Visual Constants
const ACTOR_SPACING = 4;
const MESSAGE_SPACING = 1.4;
const COLOR_ACTOR = "#3b82f6"; // Blue 500
const COLOR_ACTIVE = "#22d3ee"; // Cyan 400

// Particle Effect Component
const ParticleEffect: React.FC<{ active: boolean; position: [number, number, number] }> = ({ active, position }) => {
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 30;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  }, []);

  const velocities = useMemo(() => {
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.03;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = Math.sin(angle) * speed;
    }
    return vel;
  }, []);

  const life = useRef(new Float32Array(particleCount).fill(1));

  useFrame(() => {
    if (!particlesRef.current || !active) return;

    const pos = particlesRef.current.geometry.attributes.position;
    const posArray = pos.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Update position
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Decrease life
      life.current[i] -= 0.02;

      // Reset if dead
      if (life.current[i] <= 0) {
        life.current[i] = 1;
        posArray[i * 3] = 0;
        posArray[i * 3 + 1] = 0;
        posArray[i * 3 + 2] = 0;
      }
    }

    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <Points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#67e8f9"
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

// Glow Effect Component
const Glow: React.FC<{ size: number; color: string; intensity: number }> = ({ size, color, intensity }) => {
  return (
    // Apply inverse scale to keep it perfectly round (scene scale is 0.75 on x/y)
    <Sphere args={[size, 32, 32]} scale={[1/0.75, 1/0.75, 1]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  );
};

// Cursor Glow Effect Component
const CursorGlow: React.FC<{ active: boolean }> = ({ active }) => {
  const lightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!active) return;

    const time = state.clock.getElapsedTime() * 0.75; // 游动速度

    // 矩形框尺寸（节点内框：2.0 x 0.7，所以半宽=1.0，半高=0.35）
    const halfWidth = 1.0;
    const halfHeight = 0.35;

    // 计算光标在矩形路径上的位置
    const perimeter = 2 * (2 * halfWidth + 2 * halfHeight); // 2 * (2.0 + 0.7) = 5.4
    const progress = (time % 2) / 2; // 2秒完整循环一圈
    const position = progress * perimeter;

    let xPos, yPos;

    // 顺时针：右边 -> 顶边 -> 左边 -> 底边
    const rightSideLength = 2 * halfHeight;  // 0.7
    const topSideLength = 2 * halfWidth;      // 2.0
    const leftSideLength = 2 * halfHeight;    // 0.7
    const bottomSideLength = 2 * halfWidth;   // 2.0

    const rightEnd = rightSideLength;
    const topEnd = rightEnd + topSideLength;
    const leftEnd = topEnd + leftSideLength;

    if (position < rightEnd) {
      // 右边：从下到上
      xPos = halfWidth;
      yPos = -halfHeight + (position / rightSideLength) * (2 * halfHeight);
    } else if (position < topEnd) {
      // 顶边：从右到左
      const progressInSide = (position - rightEnd) / topSideLength;
      xPos = halfWidth - progressInSide * (2 * halfWidth);
      yPos = halfHeight;
    } else if (position < leftEnd) {
      // 左边：从上到下
      const progressInSide = (position - topEnd) / leftSideLength;
      xPos = -halfWidth;
      yPos = halfHeight - progressInSide * (2 * halfHeight);
    } else {
      // 底边：从左到右
      const progressInSide = (position - leftEnd) / bottomSideLength;
      xPos = -halfWidth + progressInSide * (2 * halfWidth);
      yPos = -halfHeight;
    }

    if (lightRef.current) {
      lightRef.current.position.set(xPos, yPos, 0.06);
    }
  });

  if (!active) return null;

  return (
    <Box ref={lightRef} args={[0.1, 0.05, 0.1]}>
      <meshBasicMaterial
        color="#d8b4fe"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
      />
    </Box>
  );
};

// Grid Background Component
const GridBackground: React.FC<{ width: number; height: number; positionY: number }> = ({ width, height, positionY }) => {
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (gridRef.current) {
      const time = state.clock.getElapsedTime();
      gridRef.current.rotation.z = Math.sin(time * 0.1) * 0.05;
    }
  });

  return (
    <mesh ref={gridRef} rotation={[0, 0, 0]} position={[0, positionY, -3]}>
      <planeGeometry args={[width, height, Math.floor(width/2), Math.floor(height/2)]} />
      <meshBasicMaterial
        color="#1e293b"
        wireframe
        transparent
        opacity={0.2}
      />
    </mesh>
  );
};

// Star Field Component
const StarField: React.FC<{ width: number; height: number; positionY: number }> = ({ width, height, positionY }) => {
  const starsRef = useRef<THREE.Points>(null);

  const starCount = Math.floor(width * height / 2); // 根据面积调整星星数量
  const positions = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * width;
      pos[i * 3 + 1] = positionY + (Math.random() - 0.5) * height;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 6;
    }
    return pos;
  }, [starCount, width, height, positionY]);

  const sizes = useMemo(() => {
    const size = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      size[i] = Math.random() * 0.08 + 0.03;
    }
    return size;
  }, [starCount]);

  useFrame(() => {
    if (starsRef.current) {
      const time = Date.now() * 0.001;
      const positions = starsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < starCount; i++) {
        const phase = i * 0.1;
        positions[i * 3 + 1] += Math.sin(time + phase) * 0.002;
      }

      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={starsRef} position={[0, 0, -5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={starCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </Points>
  );
};

// Fix: Define interface for props to ensure type safety
interface ActorNodeProps {
  x: number;
  label: string;
  active: boolean;
  lifelineLength: number;
}

// Fix: Use React.FC<ActorNodeProps> to automatically include 'key' in props
const ActorNode: React.FC<ActorNodeProps> = ({ x, label, active, lifelineLength }) => {
  return (
    <group position={[x, 2, 0]}>

      {/* Lifeline - Draw first so it's behind boxes */}
      <Line
        points={[[0, -0.35, 0], [0, lifelineLength, 0]]}
        color={active ? "#38bdf8" : "#475569"}
        lineWidth={4}
        transparent
        opacity={active ? 0.9 : 0.6}
      />

      {/* Cursor glow effect when active */}
      <CursorGlow active={active} />

      <RoundedBox args={[2.0, 0.7, 0.22]} radius={0.08}>
        <meshStandardMaterial
          color={active ? "#2563eb" : "#1e3a8a"}
          emissive={active ? "#60a5fa" : "#1e40af"}
          emissiveIntensity={active ? 1.0 : 0.5}
          roughness={0.2}
          metalness={0.6}
        />
      </RoundedBox>
      <Html center position={[0, 0, 0.2]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: '12px',
          color: '#e2e8f0',
          padding: '3px 8px',
          background: 'linear-gradient(180deg, rgba(56,189,248,0.3), rgba(30,64,175,0.22))',
          border: '1px solid rgba(56,189,248,0.6)',
          borderRadius: '10px',
          boxShadow: '0 0 15px rgba(34,211,238,0.45), inset 0 0 8px rgba(59,130,246,0.4)',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
};

// Fix: Define interface for props
interface MessageArrowProps { 
  sourceX: number; 
  targetX: number; 
  y: number; 
  label: string; 
  active: boolean;
  visible: boolean;
}

// Fix: Use React.FC<MessageArrowProps> to automatically include 'key' in props
const MessageArrow: React.FC<MessageArrowProps> = ({
  sourceX,
  targetX,
  y,
  label,
  active,
  visible
}) => {
  const lineRef = useRef<any>(null);
  const lightPointRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  useFrame((state) => {
    if (!visible) return;

    if (lineRef.current && active) {
      lineRef.current.material.dashOffset -= 0.0125;
    }

    // Animate light point
    if (lightPointRef.current && active) {
      progressRef.current += 0.00375;
      if (progressRef.current > 1) progressRef.current = 0;

      const t = progressRef.current;

      if (sourceX === targetX) {
        // Self-loop animation
        const loopWidth = 1.8;
        const loopHeight = 0.6;
        let xPos, yPos;

        if (t < 0.5) {
          // First half: go right then down
          const t2 = t * 2;
          if (t2 < 0.5) {
            xPos = sourceX + loopWidth * (t2 * 2);
            yPos = y;
          } else {
            xPos = sourceX + loopWidth;
            yPos = y - loopHeight * ((t2 - 0.5) * 2);
          }
        } else {
          // Second half: go left (stop at arrow root)
          const t2 = (t - 0.5) * 2;
          xPos = sourceX + 0.2 + (loopWidth - 0.2) * (1 - t2);
          yPos = y - loopHeight;
        }

        lightPointRef.current.position.set(xPos, yPos, 0.1);
      } else {
        // Normal arrow animation (stop at arrow root)
        const direction = targetX > sourceX ? 1 : -1;
        const lineEnd = targetX - (0.2 * direction);
        const xPos = sourceX + (lineEnd - sourceX) * t;
        lightPointRef.current.position.set(xPos, y, 0.1);
      }
    }
  });

  if (!visible) return null;

  const isSelfLoop = sourceX === targetX;
   const direction = targetX > sourceX ? 1 : -1;

  const isDashed = active;

  // Handle self-loop (arrow from and to same actor) - rectangular shape to the right
  if (isSelfLoop) {
    const loopWidth = 1.8;
    const loopHeight = 0.6;

    // Create rectangular path: right -> down -> left (stop at arrow root)
    const rectPoints = [
      [sourceX, y, 0],                              // Start: exactly on lifeline
      [sourceX + loopWidth, y, 0],                  // Right
      [sourceX + loopWidth, y - loopHeight, 0],      // Down
      [sourceX + 0.2, y - loopHeight, 0]            // Left (stop at arrow root)
    ] as [number, number, number][];

    return (
      <group position={[0, 0, 0.05]}>
        {/* Self-loop rectangle */}
        <Line
          points={rectPoints}
          color={active ? "#22d3ee" : "#38bdf8"}
          lineWidth={active ? 6 : 4}
          transparent
          opacity={active ? 0.35 : 0.2}
        />
        <Line
          ref={lineRef}
          points={rectPoints}
          color={active ? "#67e8f9" : "#93c5fd"}
          lineWidth={active ? 3 : 2}
          dashed={isDashed}
          dashScale={10}
          dashSize={isDashed ? 0.5 : 0}
          gapSize={isDashed ? 0.5 : 0}
        />

        {/* Light point for self-loop */}
        {active && (
          <Sphere ref={lightPointRef} args={[0.1, 8, 8]}>
            <meshBasicMaterial
              color="#67e8f9"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
        )}

         {/* Arrow head at the end of loop (offset by half height so tip stops at lifeline) */}
        <mesh position={[sourceX + 0.2, y - loopHeight, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.15, 0.4, 32]} />
          <meshStandardMaterial
            color={active ? "#67e8f9" : "#93c5fd"}
            emissive={active ? "#22d3ee" : "#1d4ed8"}
            emissiveIntensity={active ? 0.8 : 0.4}
          />
        </mesh>

        {/* Label positioned to the right of loop */}
        <Html center position={[sourceX + loopWidth, y - loopHeight / 2, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '11px',
            color: active ? '#e2f8ff' : '#cbd5e1',
            padding: '2px 8px',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.65), rgba(2,6,23,0.6))',
            border: '1px solid rgba(56,189,248,0.4)',
            borderRadius: '10px',
            boxShadow: active ? '0 0 10px rgba(34,211,238,0.35)' : '0 0 6px rgba(30,64,175,0.25)',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </div>
        </Html>
      </group>
    );
  }

  // Normal arrow for different source and target
  const points = [[sourceX, y, 0], [targetX - (0.2 * direction), y, 0]] as [number, number, number][];

  return (
    <group position={[0, 0, 0.05]}>
      <Line
        points={points}
        color={active ? "#22d3ee" : "#38bdf8"}
        lineWidth={active ? 6 : 4}
        transparent
        opacity={active ? 0.35 : 0.2}
      />
      <Line
        ref={lineRef}
        points={points}
        color={active ? "#67e8f9" : "#93c5fd"}
        lineWidth={active ? 3 : 2}
        dashed={isDashed}
        dashScale={10}
        dashSize={isDashed ? 0.5 : 0}
        gapSize={isDashed ? 0.5 : 0}
      />

      {/* Light point for normal arrow */}
      {active && (
        <Sphere ref={lightPointRef} args={[0.08, 8, 8]}>
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      )}

      {/* Arrow Head - offset by half height (0.2) so tip stops exactly at lifeline */}
      <mesh position={[targetX - (0.2 * direction), y, 0]} rotation={[0, 0, direction === 1 ? -Math.PI / 2 : Math.PI / 2]}>
         <coneGeometry args={[0.15, 0.4, 32]} />
         <meshStandardMaterial
           color={active ? "#67e8f9" : "#93c5fd"}
           emissive={active ? "#22d3ee" : "#1d4ed8"}
           emissiveIntensity={active ? 0.8 : 0.4}
         />
      </mesh>

      <Html center position={[(sourceX + targetX) / 2, y + 0.3, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: '11px',
          color: active ? '#e2f8ff' : '#cbd5e1',
          padding: '2px 8px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.65), rgba(2,6,23,0.6))',
          border: '1px solid rgba(56,189,248,0.4)',
          borderRadius: '10px',
          boxShadow: active ? '0 0 10px rgba(34,211,238,0.35)' : '0 0 6px rgba(30,64,175,0.25)',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
};

const SceneComponent: React.FC<SceneProps> = ({ data, mode, currentStep }) => {
  const { actors, messages } = data;

  // Calculate lifeline length based on message count
  const lifelineLength = useMemo(() => {
    const padding = 2;
    return -((messages.length + 1) * MESSAGE_SPACING + padding);
  }, [messages.length]);

  // Calculate scale based on content size
  const contentScale = useMemo(() => {
    const contentHeight = 3.8 - lifelineLength; // 从节点顶部(3.8)到垂线底部
    const baseHeight = 17.8; // 基准高度（消息少的时候）
    const scale = Math.max(0.4, Math.min(0.75, baseHeight / contentHeight));
    return scale;
  }, [lifelineLength]);

  // Calculate grid size and position based on content
  const gridSize = useMemo(() => {
    const padding = 16;

    // 在 group 内部，节点在 y=2，垂线从 y=1.65 开始，垂线底部是 lifelineLength
    const contentTop = 2.35; // 节点顶部（y=2 + 半高0.35）
    const contentBottom = lifelineLength;

    const contentWidth = (actors.length - 1) * ACTOR_SPACING;
    const contentCenterX = 0; // 节点已经水平居中

    // 网格要覆盖整个内容，加上 padding
    const gridWidth = contentWidth + padding * 2;
    const gridHeight = Math.abs(contentTop - contentBottom) + padding * 2;

    // 网格中心位置
    const gridCenterY = (contentTop + contentBottom) / 2;

    return {
      width: Math.max(gridWidth, 20),
      height: Math.max(gridHeight, 30),
      positionY: gridCenterY
    };
  }, [actors.length, lifelineLength]);

  // Calculate X positions for actors
  const actorPositions = useMemo(() => {
    const pos: Record<string, number> = {};
    const startX = -((actors.length - 1) * ACTOR_SPACING) / 2;
    actors.forEach((actor, index) => {
      pos[actor.id] = startX + (index * ACTOR_SPACING);
    });
    return pos;
  }, [actors]);

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 50 }}
      gl={{ antialias: false, powerPreference: 'low-power', alpha: true, preserveDrawingBuffer: true }}
      dpr={0.75}
      frameloop="always"
      style={{ background: 'transparent' }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[15, 10, 8]} intensity={1.5} color="#4f46e5" />
      <pointLight position={[-15, -10, 8]} intensity={1.5} color="#06b6d4" />
      <pointLight position={[0, 0, 12]} intensity={0.8} color="#22d3ee" />

      <OrbitControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
        dampingFactor={0.05}
        enableDamping={true}
      />

      <group position={[0, 3.8, 0]} scale={[contentScale, contentScale, 1]}>
        {/* Background Effects */}
        <GridBackground width={gridSize.width} height={gridSize.height} positionY={gridSize.positionY} />
        <StarField width={gridSize.width} height={gridSize.height} positionY={gridSize.positionY} />

        {actors.map((actor) => {
            // Check if this actor is involved in the active message
            const isActiveActor = mode === AppMode.DYNAMIC &&
                currentStep >= 0 &&
                messages[currentStep] &&
                (messages[currentStep].sourceId === actor.id ||
                 messages[currentStep].targetId === actor.id);

            return (
                <ActorNode
                    key={actor.id}
                    x={actorPositions[actor.id] || 0}
                    label={actor.name}
                    active={isActiveActor}
                    lifelineLength={lifelineLength}
                />
            );
        })}

        {messages.map((msg, index) => {
            const isVisible = mode === AppMode.STATIC || index <= currentStep;
            const isActive = mode === AppMode.DYNAMIC && index === currentStep;
            
            return (
                <MessageArrow
                    key={msg.id}
                    sourceX={actorPositions[msg.sourceId] || 0}
                    targetX={actorPositions[msg.targetId] || 0}
                    y={-(index + 1) * MESSAGE_SPACING}
                    label={msg.label}
                    active={isActive}
                    visible={isVisible}
                />
            );
        })}
      </group>
    </Canvas>
  );
};

export const Scene = React.memo(SceneComponent);
