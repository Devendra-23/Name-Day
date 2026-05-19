export default function FloatingBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* Deep aesthetic blue background gradient */}
          <radialGradient
            id="bg-glow"
            cx="50%"
            cy="50%"
            r="70%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Petal Gradients */}
          <linearGradient id="petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="petal-bright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
          </linearGradient>

          {/* Depth of Field Blurs to simulate 3D */}
          <filter id="blur-far" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="blur-near" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>

          {/* Reusable Petal Shape (Organic Curve) */}
          <g id="petal">
            <path
              d="M0,0 C15,-20 40,-10 50,10 C40,25 15,30 0,0 Z"
              fill="url(#petal-grad)"
            />
          </g>

          <g id="petal-small">
            <path
              d="M0,0 C10,-12 25,-6 30,6 C25,15 10,18 0,0 Z"
              fill="url(#petal-bright)"
            />
          </g>
        </defs>

        <style>
          {`
            .wind-layer-1 { animation: drift 40s linear infinite; }
            .wind-layer-2 { animation: drift-fast 25s linear infinite; }
            .wind-layer-3 { animation: drift-slow 60s linear infinite; }
            
            .sway { animation: sway 6s ease-in-out infinite alternate; }
            .sway-delayed { animation: sway 7s ease-in-out infinite alternate -3s; }
            .sway-fast { animation: sway 4s ease-in-out infinite alternate -1s; }

            @keyframes drift {
              0% { transform: translate(10%, 110%) rotate(0deg); }
              100% { transform: translate(-30%, -30%) rotate(360deg); }
            }
            @keyframes drift-fast {
              0% { transform: translate(20%, 120%) rotate(45deg); }
              100% { transform: translate(-40%, -20%) rotate(-180deg); }
            }
            @keyframes drift-slow {
              0% { transform: translate(-10%, 110%) rotate(0deg); }
              100% { transform: translate(40%, -40%) rotate(-270deg); }
            }
            @keyframes sway {
              0% { transform: rotate(-15deg); }
              100% { transform: rotate(15deg); }
            }
          `}
        </style>

        {/* Base Background */}
        <rect width="100%" height="100%" fill="url(#bg-glow)" />

        {/* FAR BACKGROUND LAYER (Highly blurred, slow, deep inside the screen) */}
        <g filter="url(#blur-far)" className="wind-layer-3" opacity="0.6">
          <use
            href="#petal"
            x="1200"
            y="800"
            transform="scale(1.5)"
            className="sway"
          />
          <use
            href="#petal"
            x="400"
            y="600"
            transform="scale(2) rotate(45)"
            className="sway-delayed"
          />
          <use
            href="#petal"
            x="1600"
            y="300"
            transform="scale(1.8) rotate(120)"
            className="sway-fast"
          />
          <use
            href="#petal"
            x="200"
            y="900"
            transform="scale(1.3) rotate(-45)"
            className="sway"
          />
        </g>

        {/* MIDGROUND LAYER (In focus, standard speed, main elements) */}
        <g className="wind-layer-1">
          <use
            href="#petal-small"
            x="1500"
            y="900"
            transform="scale(1.2) rotate(20)"
            className="sway-fast"
          />
          <use
            href="#petal"
            x="800"
            y="700"
            transform="scale(0.8) rotate(70)"
            className="sway-delayed"
          />
          <use
            href="#petal-small"
            x="1100"
            y="400"
            transform="scale(1.5) rotate(-30)"
            className="sway"
          />
          <use
            href="#petal"
            x="500"
            y="850"
            transform="scale(1.1) rotate(180)"
            className="sway-fast"
          />
          <use
            href="#petal-small"
            x="1800"
            y="650"
            transform="scale(1) rotate(90)"
            className="sway-delayed"
          />
          <use
            href="#petal"
            x="300"
            y="300"
            transform="scale(0.9) rotate(-10)"
            className="sway"
          />
          <use
            href="#petal-small"
            x="1400"
            y="150"
            transform="scale(1.3) rotate(200)"
            className="sway-fast"
          />
        </g>

        {/* FOREGROUND LAYER (Highly blurred, fast, right up against the camera) */}
        <g filter="url(#blur-near)" className="wind-layer-2" opacity="0.8">
          <use
            href="#petal"
            x="900"
            y="950"
            transform="scale(3) rotate(-60)"
            className="sway"
          />
          <use
            href="#petal"
            x="1700"
            y="800"
            transform="scale(4) rotate(15)"
            className="sway-delayed"
          />
          <use
            href="#petal"
            x="100"
            y="500"
            transform="scale(3.5) rotate(110)"
            className="sway-fast"
          />
        </g>

        {/* Static Atmospheric Wind Lines */}
        <path
          d="M-200,400 Q800,200 2000,600"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
          opacity="0.1"
          filter="url(#blur-far)"
        />
        <path
          d="M-200,800 Q1000,900 2000,400"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="4"
          opacity="0.05"
          filter="url(#blur-far)"
        />
      </svg>
    </div>
  );
}
