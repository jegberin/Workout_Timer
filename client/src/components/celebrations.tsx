import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle" | "star" | "triangle";
  gravity: number;
  decay: number;
}

const CELEBRATION_COLORS = [
  ["#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6"],
  ["#3b82f6", "#06b6d4", "#14b8a6", "#22c55e", "#84cc16"],
  ["#f59e0b", "#f97316", "#ef4444", "#eab308", "#fbbf24"],
  ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#0ea5e9"],
  ["#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0284c7"],
  ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#60a5fa"],
  ["#e879f9", "#c084fc", "#818cf8", "#60a5fa", "#38bdf8"],
  ["#fbbf24", "#fb923c", "#f87171", "#fca5a5", "#fdba74"],
  ["#34d399", "#2dd4bf", "#22d3ee", "#38bdf8", "#60a5fa"],
  ["#f472b6", "#fb7185", "#fda4af", "#fecdd3", "#e879f9"],
  ["#a78bfa", "#7c3aed", "#6d28d9", "#8b5cf6", "#c084fc"],
  ["#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309"],
  ["#4ade80", "#22c55e", "#16a34a", "#a3e635", "#84cc16"],
  ["#fb923c", "#f97316", "#ea580c", "#fbbf24", "#f59e0b"],
  ["#38bdf8", "#0ea5e9", "#0284c7", "#7dd3fc", "#bae6fd"],
];

const CELEBRATION_MESSAGES = [
  "Round Complete!",
  "Keep It Up!",
  "Great Work!",
  "Crushing It!",
  "Stay Strong!",
  "Beast Mode!",
  "On Fire!",
  "Unstoppable!",
  "Power Up!",
  "Level Up!",
  "Nailed It!",
  "Champion!",
  "Let's Go!",
  "No Stopping!",
  "Pure Energy!",
];

function createParticle(
  canvasW: number,
  canvasH: number,
  colors: string[],
  type: "burst" | "rain" | "fountain" | "spiral" | "sides" | "firework"
): Particle {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const shapes: Particle["shape"][] = ["rect", "circle", "star", "triangle"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  switch (type) {
    case "burst": {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      return {
        x: canvasW / 2,
        y: canvasH / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape,
        gravity: 0.08,
        decay: 0.012 + Math.random() * 0.008,
      };
    }
    case "rain":
      return {
        x: Math.random() * canvasW,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 4,
        size: 4 + Math.random() * 7,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape,
        gravity: 0.03,
        decay: 0.005 + Math.random() * 0.005,
      };
    case "fountain":
      return {
        x: canvasW / 2 + (Math.random() - 0.5) * 40,
        y: canvasH,
        vx: (Math.random() - 0.5) * 6,
        vy: -(6 + Math.random() * 10),
        size: 4 + Math.random() * 8,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape,
        gravity: 0.15,
        decay: 0.008 + Math.random() * 0.006,
      };
    case "spiral": {
      const a2 = Math.random() * Math.PI * 2;
      const sp2 = 2 + Math.random() * 5;
      return {
        x: canvasW / 2,
        y: canvasH / 3,
        vx: Math.cos(a2) * sp2,
        vy: Math.sin(a2) * sp2 - 2,
        size: 3 + Math.random() * 7,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape,
        gravity: 0.06,
        decay: 0.01 + Math.random() * 0.008,
      };
    }
    case "sides": {
      const fromLeft = Math.random() > 0.5;
      return {
        x: fromLeft ? -10 : canvasW + 10,
        y: Math.random() * canvasH * 0.6,
        vx: fromLeft ? 3 + Math.random() * 5 : -(3 + Math.random() * 5),
        vy: -1 + Math.random() * 3,
        size: 4 + Math.random() * 8,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape,
        gravity: 0.06,
        decay: 0.008 + Math.random() * 0.006,
      };
    }
    case "firework": {
      const cx = canvasW * (0.2 + Math.random() * 0.6);
      const cy = canvasH * (0.1 + Math.random() * 0.4);
      const a3 = Math.random() * Math.PI * 2;
      const sp3 = 1 + Math.random() * 6;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a3) * sp3,
        vy: Math.sin(a3) * sp3,
        size: 3 + Math.random() * 6,
        color,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape,
        gravity: 0.04,
        decay: 0.015 + Math.random() * 0.01,
      };
    }
  }
}

const EFFECT_TYPES: Array<"burst" | "rain" | "fountain" | "spiral" | "sides" | "firework"> = [
  "burst", "rain", "fountain", "spiral", "sides", "firework",
];

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;

  switch (p.shape) {
    case "rect":
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "star": {
      const spikes = 5;
      const outerR = p.size / 2;
      const innerR = outerR / 2;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

interface IntervalCelebrationProps {
  round: number;
  onComplete: () => void;
}

export function IntervalCelebration({ round, onComplete }: IntervalCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [message] = useState(() => CELEBRATION_MESSAGES[(round - 1) % CELEBRATION_MESSAGES.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const colorSet = CELEBRATION_COLORS[(round - 1) % CELEBRATION_COLORS.length];
    const effectType = EFFECT_TYPES[(round - 1) % EFFECT_TYPES.length];

    const particles: Particle[] = [];
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(w, h, colorSet, effectType));
    }

    let frame = 0;
    const maxFrames = 120;
    let animId: number;
    let done = false;

    function finish() {
      if (done) return;
      done = true;
      onCompleteRef.current();
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      if (frame < 30 && particles.length < 150) {
        for (let i = 0; i < 3; i++) {
          particles.push(createParticle(w, h, colorSet, effectType));
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        drawParticle(ctx, p);
      }

      frame++;
      if (frame < maxFrames && particles.length > 0) {
        animId = requestAnimationFrame(animate);
      } else {
        finish();
      }
    }

    animId = requestAnimationFrame(animate);

    const timeout = setTimeout(finish, 3000);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeout);
    };
  }, [round]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        data-testid="canvas-interval-celebration"
      />
      <div
        className="relative z-10 text-center animate-bounce"
        style={{ animationDuration: "0.6s" }}
        data-testid="text-celebration-message"
      >
        <p
          className="font-bold tracking-widest uppercase"
          style={{
            fontSize: "clamp(1.5rem, 8vw, 2.5rem)",
            color: CELEBRATION_COLORS[(round - 1) % CELEBRATION_COLORS.length][0],
            textShadow: `0 0 30px ${CELEBRATION_COLORS[(round - 1) % CELEBRATION_COLORS.length][0]}80`,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

interface FinalCelebrationProps {
  onComplete: () => void;
}

export function FinalCelebration({ onComplete }: FinalCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSuperman, setShowSuperman] = useState(false);
  const [supermanPos, setSupermanPos] = useState({ x: -100, y: 50 });
  const supermanAnimRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const allColors = CELEBRATION_COLORS.flat();
    const particles: Particle[] = [];

    let frame = 0;
    const maxFrames = 400;
    let animId: number;

    function spawnBatch(count: number, type: "burst" | "rain" | "fountain" | "spiral" | "sides" | "firework") {
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(w, h, allColors, type));
      }
    }

    spawnBatch(100, "rain");
    spawnBatch(60, "burst");

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      if (frame % 8 === 0 && frame < 300) {
        const types: Array<"burst" | "rain" | "fountain" | "spiral" | "sides" | "firework"> = [
          "rain", "burst", "fountain", "firework", "sides", "spiral"
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        spawnBatch(8, t);
      }

      if (frame % 40 === 0 && frame < 250) {
        spawnBatch(40, "firework");
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay * 0.6;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        drawParticle(ctx, p);
      }

      frame++;
      if (frame < maxFrames) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);

    const supermanTimeout = setTimeout(() => setShowSuperman(true), 500);

    const completeTimeout = setTimeout(() => onCompleteRef.current(), 8000);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(supermanTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  useEffect(() => {
    if (!showSuperman) return;

    let startTime: number | null = null;
    const duration = 3000;

    function animateSuperman(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      const x = -100 + (screenW + 200) * progress;
      const y = screenH * 0.55 - Math.sin(progress * Math.PI) * (screenH * 0.45);

      setSupermanPos({ x, y });

      if (progress < 1) {
        supermanAnimRef.current = requestAnimationFrame(animateSuperman);
      } else {
        setShowSuperman(false);
      }
    }

    supermanAnimRef.current = requestAnimationFrame(animateSuperman);

    return () => {
      if (supermanAnimRef.current) cancelAnimationFrame(supermanAnimRef.current);
    };
  }, [showSuperman]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        data-testid="canvas-final-celebration"
      />

      {showSuperman && (
        <div
          className="fixed z-[60]"
          style={{
            left: supermanPos.x,
            top: supermanPos.y,
            transform: "rotate(-30deg)",
            transition: "none",
            fontSize: "4rem",
            filter: "drop-shadow(0 0 20px rgba(59,130,246,0.6))",
          }}
          data-testid="animation-superman"
        >
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="18" r="10" fill="#fbbf24" />
              <rect x="30" y="28" width="20" height="24" rx="4" fill="#ef4444" />
              <polygon points="50,32 70,40 50,48" fill="#ef4444" opacity="0.8" />
              <rect x="25" y="52" width="8" height="18" rx="3" fill="#3b82f6" />
              <rect x="47" y="52" width="8" height="18" rx="3" fill="#3b82f6" />
              <rect x="18" y="30" width="14" height="6" rx="3" fill="#ef4444" transform="rotate(-30 18 30)" />
              <rect x="48" y="30" width="14" height="6" rx="3" fill="#ef4444" transform="rotate(15 48 30)" />
            </svg>
            <div className="absolute -top-2 -left-4 w-20 h-8 overflow-hidden">
              <div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  animation: "shimmer 1s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="relative z-10 text-center flex flex-col items-center gap-4"
        data-testid="text-final-celebration"
      >
        <div
          className="font-bold tracking-widest uppercase"
          style={{
            fontSize: "clamp(1.2rem, 6vw, 2rem)",
            background: "linear-gradient(135deg, #f43f5e, #f59e0b, #22c55e, #3b82f6, #8b5cf6)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradientShift 2s ease-in-out infinite",
          }}
        >
          Workout Complete!
        </div>
        <div className="flex items-center gap-3 text-4xl" style={{ animation: "bounce 0.8s ease-in-out infinite" }}>
          <span>🎉</span>
          <span>🏆</span>
          <span>🎊</span>
        </div>
        <p className="text-zinc-400 text-sm tracking-wider">You're a champion!</p>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
