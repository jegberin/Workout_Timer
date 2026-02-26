import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Dumbbell, Volume2 } from "lucide-react";

const INTERVAL_DURATION = 180; // 3 minutes in seconds
const SESSION_DURATION = 2700; // 45 minutes in seconds

type TimerState = "idle" | "running" | "paused";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutTimer() {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [intervalTime, setIntervalTime] = useState(INTERVAL_DURATION);
  const [sessionTime, setSessionTime] = useState(SESSION_DURATION);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const announcedRef = useRef<Set<number>>(new Set());
  const intervalTimeRef = useRef(INTERVAL_DURATION);
  const sessionTimeRef = useRef(SESSION_DURATION);
  const timerStateRef = useRef<TimerState>("idle");
  const currentRoundRef = useRef(1);

  // Keep refs in sync
  useEffect(() => {
    intervalTimeRef.current = intervalTime;
  }, [intervalTime]);
  useEffect(() => {
    sessionTimeRef.current = sessionTime;
  }, [sessionTime]);
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const playBuzzer = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(180, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.8);

      gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.0);
    } catch (e) {
      // AudioContext not available
    }
  }, []);

  const initAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      // Not available
    }
  }, []);

  const tick = useCallback(() => {
    const sTime = sessionTimeRef.current;
    const iTime = intervalTimeRef.current;

    if (sTime <= 0) {
      // Session complete
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState("idle");
      setWorkoutComplete(true);
      setSessionTime(0);
      setIntervalTime(0);
      return;
    }

    const newSessionTime = sTime - 1;
    const newIntervalTime = iTime - 1;

    setSessionTime(newSessionTime);
    sessionTimeRef.current = newSessionTime;

    if (newIntervalTime <= 0) {
      // Interval complete — buzz and reset
      playBuzzer();
      setIntervalTime(INTERVAL_DURATION);
      intervalTimeRef.current = INTERVAL_DURATION;
      announcedRef.current = new Set();
      const newRound = currentRoundRef.current + 1;
      currentRoundRef.current = newRound;
      setCurrentRound(newRound);
    } else {
      setIntervalTime(newIntervalTime);
      intervalTimeRef.current = newIntervalTime;

      // Voice announcements
      if (newIntervalTime === 120 && !announcedRef.current.has(120)) {
        announcedRef.current.add(120);
        speak("Two minutes to go.");
      } else if (newIntervalTime === 60 && !announcedRef.current.has(60)) {
        announcedRef.current.add(60);
        speak("One minute to go.");
      } else if (newIntervalTime === 5 && !announcedRef.current.has(5)) {
        announcedRef.current.add(5);
        speak("Five");
      } else if (newIntervalTime === 4 && !announcedRef.current.has(4)) {
        announcedRef.current.add(4);
        speak("Four");
      } else if (newIntervalTime === 3 && !announcedRef.current.has(3)) {
        announcedRef.current.add(3);
        speak("Three");
      } else if (newIntervalTime === 2 && !announcedRef.current.has(2)) {
        announcedRef.current.add(2);
        speak("Two");
      } else if (newIntervalTime === 1 && !announcedRef.current.has(1)) {
        announcedRef.current.add(1);
        speak("One");
      }
    }
  }, [playBuzzer, speak]);

  const startTimer = useCallback(() => {
    initAudio();
    if (timerStateRef.current === "running") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("running");
    timerStateRef.current = "running";
    intervalRef.current = setInterval(tick, 1000);
  }, [initAudio, tick]);

  const pauseTimer = useCallback(() => {
    if (timerStateRef.current !== "running") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("paused");
    timerStateRef.current = "paused";
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    timerStateRef.current = "idle";
    setIntervalTime(INTERVAL_DURATION);
    setSessionTime(SESSION_DURATION);
    intervalTimeRef.current = INTERVAL_DURATION;
    sessionTimeRef.current = SESSION_DURATION;
    announcedRef.current = new Set();
    setCurrentRound(1);
    currentRoundRef.current = 1;
    setWorkoutComplete(false);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const intervalProgress = ((INTERVAL_DURATION - intervalTime) / INTERVAL_DURATION) * 100;
  const sessionProgress = ((SESSION_DURATION - sessionTime) / SESSION_DURATION) * 100;

  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";
  const isIdle = timerState === "idle";

  // Warning colors when low time
  const intervalWarning = intervalTime <= 10 && intervalTime > 0;
  const intervalCritical = intervalTime <= 5 && intervalTime > 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white relative overflow-hidden"
      data-testid="workout-timer-page"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
        style={{ background: isRunning ? "radial-gradient(circle, #3b82f6, transparent)" : "radial-gradient(circle, #374151, transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-2" data-testid="header-section">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-zinc-100">
              Workout Timer
            </h1>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <span data-testid="text-round-number">Round {currentRound}</span>
            <span>•</span>
            <span>3 min intervals / 45 min session</span>
          </div>
        </div>

        {/* Workout Complete Banner */}
        {workoutComplete && (
          <div
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-center"
            data-testid="status-workout-complete"
          >
            <p className="text-2xl font-bold text-emerald-400 tracking-wider">Workout Complete!</p>
            <p className="text-emerald-300/70 text-sm mt-1">Great work. Session ended.</p>
          </div>
        )}

        {/* Main Interval Timer */}
        <div className="w-full" data-testid="section-interval-timer">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-8 flex flex-col items-center gap-4">
            {/* Progress bar top */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-zinc-800">
              <div
                className="h-full transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: `${intervalProgress}%`,
                  background: intervalCritical
                    ? "#ef4444"
                    : intervalWarning
                    ? "#f59e0b"
                    : "linear-gradient(to right, #3b82f6, #60a5fa)",
                }}
              />
            </div>

            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">
              Interval
            </p>

            <div
              className="font-mono font-bold tabular-nums transition-colors duration-300"
              style={{
                fontSize: "clamp(5rem, 20vw, 8rem)",
                lineHeight: 1,
                color: intervalCritical
                  ? "#ef4444"
                  : intervalWarning
                  ? "#f59e0b"
                  : isRunning
                  ? "#f1f5f9"
                  : "#94a3b8",
                textShadow: isRunning
                  ? intervalCritical
                    ? "0 0 40px rgba(239,68,68,0.4)"
                    : "0 0 40px rgba(59,130,246,0.3)"
                  : "none",
              }}
              data-testid="text-interval-time"
            >
              {formatTime(intervalTime)}
            </div>
          </div>
        </div>

        {/* Session Timer */}
        <div className="w-full" data-testid="section-session-timer">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 flex flex-col items-center gap-3">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl overflow-hidden bg-zinc-800">
              <div
                className="h-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${sessionProgress}%`,
                  background: "linear-gradient(to right, #6366f1, #818cf8)",
                }}
              />
            </div>

            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">
              Total Session
            </p>

            <div
              className="font-mono font-bold tabular-nums"
              style={{
                fontSize: "clamp(2.5rem, 10vw, 4rem)",
                lineHeight: 1,
                color: isRunning ? "#c7d2fe" : "#64748b",
                textShadow: isRunning ? "0 0 20px rgba(99,102,241,0.3)" : "none",
              }}
              data-testid="text-session-time"
            >
              {formatTime(sessionTime)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full" data-testid="controls-section">
          {/* Start Button */}
          <button
            onClick={startTimer}
            disabled={isRunning || workoutComplete}
            data-testid="button-start"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wider uppercase text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              padding: "1rem 1.5rem",
              background: isRunning
                ? "rgba(59,130,246,0.1)"
                : "linear-gradient(135deg, #2563eb, #3b82f6)",
              border: isRunning ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(59,130,246,0.5)",
              color: isRunning ? "#3b82f6" : "#fff",
              boxShadow: !isRunning && !workoutComplete ? "0 0 20px rgba(59,130,246,0.25)" : "none",
              transform: "translateZ(0)",
            }}
            onMouseOver={e => {
              if (!isRunning && !workoutComplete) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 25px rgba(59,130,246,0.35)";
              }
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateZ(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = !isRunning && !workoutComplete ? "0 0 20px rgba(59,130,246,0.25)" : "none";
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPaused ? "Resume" : "Start"}</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={pauseTimer}
            disabled={!isRunning}
            data-testid="button-pause"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wider uppercase text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              padding: "1rem 1.5rem",
              background: isRunning ? "rgba(245,158,11,0.1)" : "rgba(39,39,42,0.5)",
              border: isRunning ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(63,63,70,0.5)",
              color: isRunning ? "#f59e0b" : "#71717a",
            }}
            onMouseOver={e => {
              if (isRunning) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.18)";
              }
            }}
            onMouseOut={e => {
              if (isRunning) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.1)";
              }
            }}
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>

          {/* Stop Button */}
          <button
            onClick={stopTimer}
            disabled={isIdle && !workoutComplete}
            data-testid="button-stop"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wider uppercase text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              padding: "1rem 1.5rem",
              background: !isIdle || workoutComplete ? "rgba(239,68,68,0.1)" : "rgba(39,39,42,0.5)",
              border: !isIdle || workoutComplete ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(63,63,70,0.5)",
              color: !isIdle || workoutComplete ? "#ef4444" : "#71717a",
            }}
            onMouseOver={e => {
              if (!isIdle || workoutComplete) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.18)";
              }
            }}
            onMouseOut={e => {
              if (!isIdle || workoutComplete) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
              }
            }}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </button>
        </div>

        {/* Audio note */}
        <div
          className="flex items-start gap-2.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
          data-testid="text-audio-notice"
        >
          <Volume2 className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Click <span className="text-zinc-400 font-medium">Start</span> to enable audio. Browsers require a user interaction before playing audio or voice announcements.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2" data-testid="status-timer-state">
          <div
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{
              background: isRunning ? "#22c55e" : isPaused ? "#f59e0b" : "#52525b",
              boxShadow: isRunning ? "0 0 8px #22c55e" : "none",
            }}
          />
          <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">
            {isRunning ? "Running" : isPaused ? "Paused" : workoutComplete ? "Complete" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
