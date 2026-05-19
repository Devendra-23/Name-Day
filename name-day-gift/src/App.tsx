import { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Gift, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import * as THREE from "three";

import flowerBg from "./assets/flowers.png";

// --- 1. RESPONSIVE HOOK ---
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

// --- 2. SVG OVERLAY ---
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
      </defs>
      <g style={{ animation: "sway 5s ease-in-out infinite alternate" }}>
        <use href="#bg-petal" x="1500" y="900" transform="scale(1.2)" />
        <use
          href="#bg-petal-pink"
          x="800"
          y="700"
          transform="scale(0.9) rotate(70)"
        />
        <use
          href="#bg-petal"
          x="1100"
          y="400"
          transform="scale(1.5) rotate(-30)"
        />
        <use
          href="#bg-petal-pink"
          x="500"
          y="850"
          transform="scale(1.4) rotate(180)"
        />
      </g>
    </svg>
  );
}

// --- 3. FLOATING 3D PETALS ---
function FallingPetals3D({ count = 40, color = "#f472b6" }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petalGeometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(
        new THREE.Shape()
          .moveTo(0, 0)
          .quadraticCurveTo(0.2, 0.4, 0.1, 0.8)
          .quadraticCurveTo(0, 1.0, -0.1, 0.8)
          .quadraticCurveTo(-0.2, 0.4, 0, 0),
        {
          depth: 0.02,
          bevelEnabled: true,
          bevelSize: 0.01,
          bevelThickness: 0.01,
        }
      ),
    []
  );

  const petals = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        Math.random() * 15 - 5,
        (Math.random() - 0.5) * 10 - 2
      ),
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
      speed: 0.008 + Math.random() * 0.014,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      factor: Math.random() * 100,
    }));
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

// --- 4. GIFT BOX WITH STARS ---
function BoxStar({ position, rotation = [0, 0, 0] }: any) {
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape
      .moveTo(0, 0.05)
      .lineTo(0.012, 0.015)
      .lineTo(0.05, 0.015)
      .lineTo(0.02, -0.008)
      .lineTo(0.032, -0.045)
      .lineTo(0, -0.022)
      .lineTo(-0.032, -0.045)
      .lineTo(-0.02, -0.008)
      .lineTo(-0.05, 0.015)
      .lineTo(-0.012, 0.015)
      .lineTo(0, 0.05);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.01,
      bevelEnabled: false,
    });
  }, []);
  return (
    <mesh position={position} rotation={rotation}>
      <primitive object={starGeometry} attach="geometry" />
      <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.1} />
    </mesh>
  );
}

function GiftBox({ onClick }: { onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const mobileScale = useMobileScale();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.012;
      groupRef.current.position.y =
        (mobileScale < 1 ? -0.1 : -0.3) +
        Math.sin(state.clock.getElapsedTime() * 1.8) * 0.12;
    }
  });

  const starPlacements = useMemo(() => {
    const p = [];
    for (let i = 0; i < 18; i++) {
      const rx = (Math.random() - 0.5) * 0.9;
      const ry = (Math.random() - 0.5) * 0.7 - 0.2;
      if (Math.abs(rx) > 0.1) {
        p.push({ pos: [rx, ry, 0.555], rot: [0, 0, Math.random()] });
        p.push({ pos: [rx, ry, -0.555], rot: [0, Math.PI, Math.random()] });
      }
    }
    return p;
  }, []);

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      scale={1.35 * mobileScale}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.1, 0.9, 1.1]} />
        <meshStandardMaterial color="#1d2a44" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.16, 0.22, 1.16]} />
        <meshStandardMaterial color="#2a3c5a" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.2, 0.24, 0.15]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.15, 0.24, 1.2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.1} />
      </mesh>
      {starPlacements.map((s, i) => (
        <BoxStar key={i} position={s.pos as any} rotation={s.rot as any} />
      ))}
    </group>
  );
}

// --- 5. DETAILED 3D FLOWERS ---
function PremiumRose({
  position,
  color,
  rotation = [0, 0, 0],
  scale = 1,
}: any) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.01, 8]} />
        <meshStandardMaterial color="#14532d" />
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

function PremiumLily({ position, rotation = [0, 0, 0], scale = 1 }: any) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
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

// --- 6. SHINY GOLD VASE WITH ENGRAVED BOTTOM CAP TEXTURE ---
function ProceduralFlowerVase() {
  const groupRef = useRef<THREE.Group>(null);
  const mobileScale = useMobileScale();

  useFrame((state) => {
    if (groupRef.current)
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
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

  // PROCEDURAL CANVAS TEXTURE GENERATOR FOR THE INSCRIPTION NOTE
  const signatureTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Background base gold coating alignment match
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(0, 0, 512, 512);

      // Stylized Script Message Layout
      ctx.font = "italic bold 32px 'Cormorant Garamond', serif";
      ctx.fillStyle = "#1d2a44"; // Honeymoon Navy contrast tone
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Made with love", 256, 230);
      ctx.fillText("from Devvyyy", 256, 282);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }, []);

  return (
    <group
      ref={groupRef}
      position={[0, mobileScale < 1 ? -1.35 : -1.45, 0]}
      scale={mobileScale * 1.05}
    >
      {/* Main Lathe Vase Frame */}
      <mesh castShadow>
        <latheGeometry args={[vasePoints, 64]} />
        <meshPhysicalMaterial
          color="#FFD700"
          metalness={0.99}
          roughness={0.03}
          clearcoat={1.0}
          envMapIntensity={1.0}
        />
      </mesh>

      {/* SEALED CAP BOTTOM WITH SIGNATURE TEXTURE OVERLAY MAPPED INSIDE */}
      <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 64]} />
        <meshStandardMaterial
          map={signatureTexture}
          metalness={0.6}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <PremiumLily position={[0, 1.6, 0]} scale={1.3} />
      <PremiumLily
        position={[-0.2, 1.45, 0.15]}
        rotation={[0.3, 1, 0.2]}
        scale={1.1}
      />
      <PremiumLily
        position={[0.2, 1.45, -0.15]}
        rotation={[-0.3, -1, -0.2]}
        scale={1.1}
      />

      <PremiumRose
        position={[0.15, 1.6, 0.2]}
        color="#b91c1c"
        rotation={[0.3, 0.5, 0]}
        scale={1.2}
      />
      <PremiumRose
        position={[-0.15, 1.6, -0.2]}
        color="#9f1239"
        rotation={[-0.3, 2, 0]}
        scale={1.1}
      />
      <PremiumRose
        position={[0.2, 1.5, -0.1]}
        color="#e11d48"
        rotation={[-0.2, -0.5, 0.2]}
        scale={1.2}
      />

      <PremiumRose
        position={[-0.25, 1.4, 0.2]}
        color="#b91c1c"
        rotation={[0.5, 1, 0.2]}
        scale={1.1}
      />
      <PremiumRose
        position={[0.25, 1.4, 0.2]}
        color="#9f1239"
        rotation={[0.5, -1, -0.2]}
        scale={1.1}
      />
      <PremiumRose
        position={[0, 1.4, 0.25]}
        color="#e11d48"
        rotation={[0.6, 0, 0]}
        scale={1.1}
      />
      <PremiumRose
        position={[0, 1.4, -0.25]}
        color="#b91c1c"
        rotation={[-0.6, 0, 0]}
        scale={1.1}
      />

      <PremiumRose
        position={[0.3, 1.3, 0]}
        color="#e11d48"
        rotation={[0, 0, -0.7]}
        scale={1.1}
      />
      <PremiumRose
        position={[-0.3, 1.3, 0]}
        color="#b91c1c"
        rotation={[0, 0, 0.7]}
        scale={1.1}
      />
      <PremiumRose
        position={[0.15, 1.3, 0.3]}
        color="#9f1239"
        rotation={[0.7, -0.5, 0]}
        scale={1.1}
      />
      <PremiumRose
        position={[-0.15, 1.3, 0.3]}
        color="#e11d48"
        rotation={[0.7, 0.5, 0]}
        scale={1.1}
      />

      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * ((Math.PI * 2) / 12);
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * 0.25,
              1.2 + Math.random() * 0.2,
              Math.cos(angle) * 0.25,
            ]}
            rotation={[0.8, angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.15, 0.6, 0.015]} />
            <meshStandardMaterial color="#14532d" />
          </mesh>
        );
      })}
    </group>
  );
}

// --- 7. MAIN APPLICATION ---
export default function App() {
  const [stage, setStage] = useState<"intro" | "revealed">("intro");
  const [showTooltip, setShowTooltip] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleOpenGift = () => {
    setStage("revealed");
    setAudioEnded(false);
    audioRef.current = new Audio("/message.mp3");
    audioRef.current.onended = () => setAudioEnded(true);
    audioRef.current.play().catch(console.error);
    confetti({ particleCount: 150, spread: 85, origin: { y: 0.55 } });
  };

  const resetExperience = () => {
    setStage("intro");
    setAudioEnded(false);
    setShowTooltip(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Marcellus&display=swap');
        .honeymoon-title { font-family: 'Marcellus', serif; letter-spacing: 0.35em; text-transform: uppercase; text-shadow: 0px 2px 10px rgba(255, 255, 255, 0.4); margin: 0; }
        .honeymoon-sub { font-family: 'Cormorant Garamond', serif; letter-spacing: 0.04em; font-style: italic; text-shadow: 0px 1px 4px rgba(255, 255, 255, 0.5); margin: 0; text-align: center; }
        .vintage-vignette { position: fixed; inset: 0; z-index: 25; pointer-events: none; box-shadow: inset 0 0 100px rgba(42, 30, 15, 0.15); }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          touchAction: "none",
          backgroundColor: "#f2f5f8",
          backgroundImage: `url(${flowerBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          userSelect: "none",
        }}
      >
        <div className="vintage-vignette" />

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
          <Canvas camera={{ position: [0, 0, 5.2], fov: 55 }}>
            <Environment preset="studio" />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={1.8} />
            <directionalLight position={[-6, 8, 4]} intensity={1.2} />
            <FallingPetals3D count={30} color="#b83d3d" />
            <FallingPetals3D count={35} color="#f472b6" />
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

        {/* 1. Top Left Absolute Audio Tooltip Anchor (CLICK ONLY) */}
        <div
          style={{
            position: "absolute",
            top: "2rem",
            left: "2rem",
            zIndex: 50,
            pointerEvents: "auto",
          }}
        >
          <div
            onClick={() => setShowTooltip(!showTooltip)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.85rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(29,42,68,0.12)",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <Volume2 color="#223354" size={24} />
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  marginTop: "1rem",
                  left: 0,
                  backgroundColor: "#223354",
                  color: "white",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "1rem",
                  whiteSpace: "nowrap",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              >
                <span
                  className="honeymoon-sub"
                  style={{ fontSize: "0.95rem", fontWeight: "bold" }}
                >
                  Ustaw głośność na maksa! 🔊
                </span>
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "1.25rem",
                    width: "0.75rem",
                    height: "0.75rem",
                    backgroundColor: "#223354",
                    rotate: "45deg",
                    transform: "translateY(50%)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. Main Native Responsive UI Layer Overlay Container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "2rem 1rem",
          }}
        >
          {/* Header Panel Box */}
          <header
            style={{
              backgroundColor: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(10px)",
              padding: "1rem 2.5rem",
              borderRadius: "1.25rem",
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow: "0 10px 35px rgba(29,42,68,0.05)",
              textAlign: "center",
              width: "fit-content",
              maxWidth: "85%",
              pointerEvents: "auto",
              marginTop: "0.5rem",
            }}
          >
            <h1
              className="honeymoon-title"
              style={{
                color: "#b83d3d",
                fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
                fontWeight: "400",
              }}
            >
              WIKTORIA
            </h1>
          </header>

          {/* REPOSITIONED WISH FIELD */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "88%",
              marginTop: "2rem",
              pointerEvents: "none",
            }}
          >
            <p
              className="honeymoon-sub"
              style={{
                color: "#223354",
                fontSize: "clamp(1.25rem, 3.5vw, 2rem)",
                fontWeight: "700",
                lineHeight: "1.35",
              }}
            >
              Wszystkiego najlepszego z okazji imienin
            </p>
          </div>

          {/* Bottom Interactive Trigger Area */}
          <div
            style={{
              pointerEvents: "auto",
              marginTop: "auto",
              marginBottom: "1.5rem",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {stage === "intro" ? (
              <div
                onClick={handleOpenGift}
                style={{
                  backgroundColor: "#223354",
                  padding: "1.1rem 2.2rem",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 12px 40px rgba(34,51,84,0.25)",
                }}
              >
                <Gift color="#fbbf24" size={22} />
                <span
                  className="honeymoon-sub"
                  style={{
                    color: "white",
                    fontSize: "1.15rem",
                    fontWeight: "bold",
                    letterSpacing: "0.05em",
                  }}
                >
                  Otwórz mój prezent dla Ciebie... ✨
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(12px)",
                    padding: "0.85rem 2rem",
                    borderRadius: "1.5rem",
                    boxShadow: "0 12px 40px rgba(29,42,68,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    maxWidth: "85%",
                  }}
                >
                  {audioEnded ? (
                    <button
                      onClick={resetExperience}
                      style={{
                        backgroundColor: "#b83d3d",
                        color: "white",
                        padding: "0.85rem 2rem",
                        borderRadius: "9999px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 8px 25px rgba(184,61,61,0.35)",
                      }}
                    >
                      <span
                        className="honeymoon-sub"
                        style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                      >
                        Obejrzyj jeszcze raz! 🌸
                      </span>
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <Volume2
                        color="#223354"
                        size={20}
                        className="animate-pulse"
                      />
                      <span
                        className="honeymoon-sub"
                        style={{
                          color: "#223354",
                          fontSize: "1.05rem",
                          fontWeight: "bold",
                        }}
                      >
                        Twoja wiadomość głosowa gra 🎵
                      </span>
                    </div>
                  )}

                  {!audioEnded && (
                    <p
                      className="honeymoon-sub"
                      style={{
                        color: "#556688",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        marginTop: "0.35rem",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Obróć bukiet dotknięciem lub myszką
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
