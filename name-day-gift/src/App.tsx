import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Gift, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import * as THREE from "three";

// IMPORT YOUR AESTHETIC BACKGROUND IMAGE HERE
import flowerBg from "./assets/flowers.png";

// --- 1. RESPONSIVE 3D SCALING HOOK ---
function useMobileScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => setScale(window.innerWidth < 768 ? 0.7 : 1);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return scale;
}

// --- 2. SVG OVERLAY (Background 2D Petals) ---
function FloatingSVGOverlay() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block", opacity: 0.6 }}
    >
      <defs>
        <linearGradient id="petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient
          id="pink-petal-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.6" />
        </linearGradient>
        <filter id="blur-heavy" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <g id="bg-petal">
          <path
            d="M0,0 C12,-15 30,-10 40,5 C30,20 12,25 0,0 Z"
            fill="url(#petal-grad)"
          />
        </g>
        <g id="bg-petal-pink">
          <path
            d="M0,0 C12,-15 30,-10 40,5 C30,20 12,25 0,0 Z"
            fill="url(#pink-petal-grad)"
          />
        </g>
      </defs>
      <style>
        {`
          .wind-layer-1 { animation: drift 45s linear infinite; }
          .wind-layer-2 { animation: drift-fast 25s linear infinite; }
          .sway { animation: sway 5s ease-in-out infinite alternate; }
          .sway-delayed { animation: sway 7s ease-in-out infinite alternate -3s; }
          .sway-fast { animation: sway 4s ease-in-out infinite alternate -1s; }
          @keyframes drift {
            0% { transform: translate(10%, 110%) rotate(0deg); }
            100% { transform: translate(-20%, -30%) rotate(180deg); }
          }
          @keyframes drift-fast {
            0% { transform: translate(20%, 120%) rotate(45deg); }
            100% { transform: translate(-30%, -20%) rotate(-90deg); }
          }
          @keyframes sway {
            0% { transform: rotate(-12deg); }
            100% { transform: rotate(12deg); }
          }
        `}
      </style>
      <g className="wind-layer-1">
        <use
          href="#bg-petal"
          x="1500"
          y="900"
          transform="scale(1.2)"
          className="sway"
        />
        <use
          href="#bg-petal-pink"
          x="800"
          y="700"
          transform="scale(0.9) rotate(70)"
          className="sway-delayed"
        />
        <use
          href="#bg-petal"
          x="1100"
          y="400"
          transform="scale(1.5) rotate(-30)"
          className="sway"
        />
        <use
          href="#bg-petal-pink"
          x="500"
          y="850"
          transform="scale(1.4) rotate(180)"
        />
        <use
          href="#bg-petal"
          x="1800"
          y="650"
          transform="scale(1) rotate(90)"
          className="sway-delayed"
        />
        <use
          href="#bg-petal-pink"
          x="300"
          y="300"
          transform="scale(1.1) rotate(-10)"
          className="sway"
        />
        <use
          href="#bg-petal"
          x="1400"
          y="150"
          transform="scale(1.8) rotate(200)"
        />
      </g>
      <g filter="url(#blur-heavy)" className="wind-layer-2" opacity="0.8">
        <use
          href="#bg-petal"
          x="900"
          y="950"
          transform="scale(4) rotate(-60)"
          className="sway"
        />
        <use
          href="#bg-petal-pink"
          x="1700"
          y="800"
          transform="scale(5) rotate(15)"
          className="sway-delayed"
        />
        <use
          href="#bg-petal"
          x="100"
          y="500"
          transform="scale(5) rotate(110)"
        />
      </g>
    </svg>
  );
}

// --- 3. FLOATING 3D PETALS ---
function FallingPetals3D({ count = 60, color = "#f472b6" }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.2, 0.4, 0.1, 0.8);
    shape.quadraticCurveTo(0, 1.0, -0.1, 0.8);
    shape.quadraticCurveTo(-0.2, 0.4, 0, 0);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
      bevelSegments: 2,
    });
  }, []);

  const petals = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          Math.random() * 15 - 5,
          (Math.random() - 0.5) * 10 - 2
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0
        ),
        speed: 0.01 + Math.random() * 0.015,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        factor: Math.random() * 100,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    petals.forEach((p, i) => {
      p.pos.y -= p.speed;
      p.pos.x += Math.sin(p.pos.y * 2 + p.factor) * 0.005;
      p.rot.x += p.rotSpeed;
      p.rot.y += p.rotSpeed;

      if (p.pos.y < -5) {
        p.pos.y = 10;
        p.pos.x = (Math.random() - 0.5) * 15;
      }

      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(0.15 + Math.sin(p.factor) * 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[petalGeometry, null as any, count]}>
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// --- 4. 3D ROTATING GIFT BOX ---
function GiftBox({ onClick }: { onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const mobileScale = useMobileScale();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.012;
      groupRef.current.position.y =
        -0.4 + Math.sin(state.clock.getElapsedTime() * 1.8) * 0.12;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      scale={1.4 * mobileScale}
      style={{ cursor: "pointer" }}
    >
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.1, 0.9, 1.1]} />
        <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.16, 0.22, 1.16]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.2, 0.24, 0.15]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.15, 0.24, 1.2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

// --- 5. FIXED 3D ROSE (TRIMMED INTERNAL STEM) ---
function PremiumRose({
  position,
  color,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* FIXED: Trimmed stem cylinder length from 0.8 down to 0.15 so it stays completely hidden inside the bouquet cluster */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.15, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => {
        const radius = 0.07 + i * 0.01;
        const angle = i * 2.4;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * radius,
              i * 0.012,
              Math.cos(angle) * radius,
            ]}
            rotation={[0.2 + i * 0.04, angle, 0.1]}
          >
            <sphereGeometry
              args={[0.14, 12, 12, 0, Math.PI * 1.2, 0, Math.PI * 0.6]}
            />
            <meshPhysicalMaterial
              color={color}
              roughness={0.4}
              transmission={0.2}
              thickness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// --- 6. FIXED 3D LILY (TRIMMED INTERNAL STEM) ---
function PremiumLily({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* FIXED: Trimmed base stem cylinder from 0.9 down to 0.15 so it can never poke through the vase walls */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 1.5) * 0.03, 0.15, Math.cos(i * 1.5) * 0.03]}
          rotation={[0.1, i * 1.5, 0]}
        >
          <cylinderGeometry args={[0.004, 0.004, 0.35]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI) / 3;
        return (
          <mesh key={i} position={[0, 0.05, 0]} rotation={[0.6, angle, 0]}>
            <coneGeometry args={[0.25, 0.65, 12, 4, true]} />
            <meshPhysicalMaterial
              color="#f472b6"
              emissive="#be123c"
              emissiveIntensity={0.1}
              roughness={0.3}
              transmission={0.2}
              thickness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// --- 7. VASE RIBBON ---
function RibbonOnVase({
  position,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  const ribbonPoints = useMemo(() => {
    const points = [];
    points.push(new THREE.Vector2(0.32, 0));
    points.push(new THREE.Vector2(0.33, 0.08));
    return points;
  }, []);
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <latheGeometry args={[ribbonPoints, 64]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.4}
          clearcoat={0.3}
        />
      </mesh>
    </group>
  );
}

// --- 8. SHINY GOLD VASE (CLEAN LIGHTING REFLECTIONS) ---
function ProceduralFlowerVase() {
  const groupRef = useRef<THREE.Group>(null);
  const mobileScale = useMobileScale();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  const vasePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 30; i++) {
      const y = (i / 30) * 1.6;
      const radius =
        0.35 +
        Math.sin(y * Math.PI) * 0.2 -
        y * 0.05 +
        (y > 1.3 ? (y - 1.3) * 0.3 : 0);
      points.push(new THREE.Vector2(radius, y));
    }
    return points;
  }, []);

  return (
    <group
      ref={groupRef}
      position={[0, mobileScale < 1 ? -1.8 : -1.4, 0]}
      scale={mobileScale * 1.1}
    >
      {/* SHINY GOLD VASE */}
      <mesh position={[0, 0, 0]} castShadow>
        <latheGeometry args={[vasePoints, 64]} />
        <meshPhysicalMaterial
          color="#FFD700"
          metalness={0.99}
          roughness={0.03}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          envMapIntensity={1.0}
        />
      </mesh>

      <RibbonOnVase position={[0, 1.25, 0]} color="#1e3a8a" />

      {/* --- THE BOUQUET (STEMS RENDERED SAFELY INSIDE THE MASS) --- */}
      <PremiumLily position={[0, 1.5, 0]} scale={1.3} />
      <PremiumLily
        position={[-0.4, 1.3, 0.3]}
        rotation={[0.2, 0, 0.3]}
        scale={1.1}
      />
      <PremiumLily
        position={[0.4, 1.3, -0.3]}
        rotation={[-0.2, 0, -0.3]}
        scale={1.1}
      />
      <PremiumLily
        position={[0, 1.1, -0.6]}
        rotation={[0.4, 3, 0]}
        scale={0.9}
      />

      <PremiumRose
        position={[0.1, 1.6, 0.4]}
        color="#b91c1c"
        rotation={[0.1, 0, -0.1]}
        scale={1.2}
      />
      <PremiumRose
        position={[-0.35, 1.4, -0.35]}
        color="#9f1239"
        rotation={[0.2, 1, 0]}
        scale={1.1}
      />
      <PremiumRose
        position={[0.4, 1.25, 0.3]}
        color="#e11d48"
        rotation={[-0.1, -1, 0.2]}
        scale={1.1}
      />
      <PremiumRose position={[-0.45, 1.25, 0.1]} color="#f43f5e" scale={0.9} />
      <PremiumRose
        position={[0.25, 1.35, -0.45]}
        color="#f43f5e"
        rotation={[-0.2, -0.5, -0.1]}
        scale={1.0}
      />
      <PremiumRose
        position={[0.5, 1.1, 0.1]}
        color="#b91c1c"
        rotation={[0.3, -1.2, 0.1]}
      />
      <PremiumRose
        position={[0, 1.0, 0.7]}
        color="#f43f5e"
        rotation={[0.6, 0, 0]}
        scale={0.8}
      />
      <PremiumRose
        position={[-0.1, 1.2, -0.7]}
        color="#fb7185"
        rotation={[0.2, 2.5, -0.1]}
        scale={1.0}
      />
      <PremiumRose
        position={[0.3, 1.05, -0.6]}
        color="#fb7185"
        rotation={[0.5, -2, 0]}
        scale={0.9}
      />
      <PremiumRose
        position={[-0.5, 0.9, -0.2]}
        color="#fb923c"
        rotation={[0.7, 1.5, 0.1]}
        scale={1.1}
      />

      {/* Decorative leaf filler assets */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = i * ((Math.PI * 2) / 14);
        return (
          <mesh
            key={`leaf-${i}`}
            position={[
              Math.sin(angle) * (0.4 + Math.random() * 0.15),
              1.0 + Math.random() * 0.3,
              Math.cos(angle) * (0.4 + Math.random() * 0.15),
            ]}
            rotation={[
              0.7 + Math.random() * 0.2,
              angle + Math.PI / 2,
              Math.random() * 0.3,
            ]}
          >
            <boxGeometry args={[0.15, 0.6, 0.015]} />
            <meshStandardMaterial color="#14532d" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// --- 9. MASTER APPLICATION ---
export default function App() {
  const [stage, setStage] = useState<"intro" | "revealed">("intro");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleOpenGift = () => {
    setStage("revealed");
    audioRef.current = new Audio("/message.mp3");
    audioRef.current.play().catch((e) => console.log("Audio waiting: ", e));
    confetti({ particleCount: 150, spread: 85, origin: { y: 0.55 } });
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&display=swap');
          .elegant-font { font-family: 'Playfair Display', serif; }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          touchAction: "none",
          backgroundColor: "#f8fafc",
          backgroundImage: `url(${flowerBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="select-none"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <FloatingSVGOverlay />
        </div>

        <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
            <Environment preset="studio" />

            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={1.8} />
            <directionalLight position={[-6, 8, 4]} intensity={1.2} />

            <FallingPetals3D count={45} color="#f472b6" />
            <FallingPetals3D count={45} color="#60a5fa" />

            {stage === "intro" ? (
              <GiftBox onClick={handleOpenGift} />
            ) : (
              <ProceduralFlowerVase />
            )}

            <OrbitControls
              enableZoom={false}
              autoRotate={stage === "revealed"}
              autoRotateSpeed={1.0}
            />
          </Canvas>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            pointerEvents: "none",
          }}
          className="flex flex-col justify-between items-center p-6 md:p-12"
        >
          {/* Frosted glass header panel with high-contrast elegant dark blue text layout */}
          <header className="text-center mt-4 md:mt-8 bg-white/50 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(30,58,138,0.15)]">
            <h1 className="elegant-font text-5xl md:text-7xl lg:text-8xl font-bold tracking-widest text-blue-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
              WIKTORIA
            </h1>
            <p className="font-sans text-xs md:text-sm lg:text-base tracking-widest text-blue-800 mt-4 uppercase font-semibold drop-shadow-sm">
              Wszystkiego najlepszego z okazji imienin!
            </p>
          </header>

          <div className="mb-8 md:mb-12">
            {stage === "intro" ? (
              <div
                className="animate-bounce pointer-events-auto cursor-pointer"
                onClick={handleOpenGift}
              >
                <div className="bg-blue-600 backdrop-blur-xl px-8 py-4 rounded-full text-white flex items-center gap-3 shadow-[0_10px_40px_rgba(37,99,235,0.4)] border border-blue-400 hover:bg-blue-500 transition-all duration-300">
                  <Gift className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <span className="font-sans font-medium tracking-wide text-base md:text-lg">
                    Kliknij mnie, mam dla Ciebie prezent! ✨
                  </span>
                </div>
              </div>
            ) : (
              <div className="pointer-events-auto flex flex-col items-center text-center animate-fade-in-up">
                <div className="bg-white/60 backdrop-blur-xl px-6 md:px-10 py-4 md:py-5 rounded-2xl flex flex-col items-center gap-2 shadow-[0_8px_32px_rgba(30,58,138,0.15)] border border-white/60">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-sans font-semibold tracking-wide text-sm md:text-base text-blue-900">
                      Twoja wiadomość głosowa gra... 🎵
                    </span>
                  </div>
                  <p className="font-sans text-[10px] md:text-xs text-blue-700 font-medium mt-1 uppercase tracking-widest">
                    Użyj myszki lub palca, aby obrócić bukiet!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
