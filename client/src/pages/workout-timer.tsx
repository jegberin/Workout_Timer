import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, Dumbbell } from "lucide-react";
import { IntervalCelebration, FinalCelebration } from "@/components/celebrations";

const WORK_DURATION = 150;
const BREAK_DURATION = 30;
const INTERVAL_DURATION = WORK_DURATION + BREAK_DURATION;
const SESSION_DURATION = 2700;

type TimerState = "idle" | "running" | "paused";
type Phase = "work" | "break";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutTimer() {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [intervalTime, setIntervalTime] = useState(WORK_DURATION);
  const [sessionTime, setSessionTime] = useState(SESSION_DURATION);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [showIntervalCelebration, setShowIntervalCelebration] = useState(false);
  const [celebrationRound, setCelebrationRound] = useState(0);
  const [showFinalCelebration, setShowFinalCelebration] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());
  const intervalTimeRef = useRef(WORK_DURATION);
  const sessionTimeRef = useRef(SESSION_DURATION);
  const timerStateRef = useRef<TimerState>("idle");
  const currentRoundRef = useRef(1);
  const phaseRef = useRef<Phase>("work");

  useEffect(() => { intervalTimeRef.current = intervalTime; }, [intervalTime]);
  useEffect(() => { sessionTimeRef.current = sessionTime; }, [sessionTime]);
  useEffect(() => { timerStateRef.current = timerState; }, [timerState]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const playFogHorn = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();
      const masterGain = ctx.createGain();

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      gain1.connect(masterGain);
      gain2.connect(masterGain);
      gain3.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(85, now);
      osc1.frequency.linearRampToValueAtTime(80, now + 0.3);
      osc1.frequency.linearRampToValueAtTime(82, now + 1.2);
      osc1.frequency.linearRampToValueAtTime(75, now + 1.8);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(86.5, now);
      osc2.frequency.linearRampToValueAtTime(81, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(83.5, now + 1.2);
      osc2.frequency.linearRampToValueAtTime(76, now + 1.8);

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(170, now);
      osc3.frequency.linearRampToValueAtTime(160, now + 0.3);
      osc3.frequency.linearRampToValueAtTime(164, now + 1.2);
      osc3.frequency.linearRampToValueAtTime(150, now + 1.8);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.5, now + 0.15);
      gain1.gain.linearRampToValueAtTime(0.45, now + 0.8);
      gain1.gain.linearRampToValueAtTime(0.3, now + 1.4);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.8);
      gain2.gain.linearRampToValueAtTime(0.2, now + 1.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.linearRampToValueAtTime(0.15, now + 0.2);
      gain3.gain.linearRampToValueAtTime(0.1, now + 1.0);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      masterGain.gain.setValueAtTime(0.8, now);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
      osc3.stop(now + 1.8);
    } catch (e) {
      // Not available
    }
  }, []);

  const playShortBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // Not available
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
    const currentPhase = phaseRef.current;

    if (sTime <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState("idle");
      setWorkoutComplete(true);
      setShowFinalCelebration(true);
      setSessionTime(0);
      setIntervalTime(0);
      playFogHorn();
      return;
    }

    const newSessionTime = sTime - 1;
    const newIntervalTime = iTime - 1;

    setSessionTime(newSessionTime);
    sessionTimeRef.current = newSessionTime;

    if (currentPhase === "work") {
      if (newIntervalTime <= 0) {
        playShortBeep();
        speak("Break time. Thirty seconds.");
        setPhase("break");
        phaseRef.current = "break";
        setIntervalTime(BREAK_DURATION);
        intervalTimeRef.current = BREAK_DURATION;
        announcedRef.current = new Set();
      } else {
        setIntervalTime(newIntervalTime);
        intervalTimeRef.current = newIntervalTime;

        const key = `work-${newIntervalTime}`;
        if (newIntervalTime === 90 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Ninety seconds to go.");
        } else if (newIntervalTime === 60 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("One minute to go.");
        } else if (newIntervalTime === 5 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Five");
        } else if (newIntervalTime === 4 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Four");
        } else if (newIntervalTime === 3 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Three");
        } else if (newIntervalTime === 2 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Two");
        } else if (newIntervalTime === 1 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("One");
        }
      }
    } else {
      if (newIntervalTime <= 0) {
        playFogHorn();
        setPhase("work");
        phaseRef.current = "work";
        setIntervalTime(WORK_DURATION);
        intervalTimeRef.current = WORK_DURATION;
        announcedRef.current = new Set();
        const newRound = currentRoundRef.current + 1;
        currentRoundRef.current = newRound;
        setCurrentRound(newRound);
        setCelebrationRound(currentRoundRef.current - 1);
        setShowIntervalCelebration(true);
      } else {
        setIntervalTime(newIntervalTime);
        intervalTimeRef.current = newIntervalTime;

        const key = `break-${newIntervalTime}`;
        if (newIntervalTime === 5 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Five");
        } else if (newIntervalTime === 4 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Four");
        } else if (newIntervalTime === 3 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Three");
        } else if (newIntervalTime === 2 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("Two");
        } else if (newIntervalTime === 1 && !announcedRef.current.has(key)) {
          announcedRef.current.add(key);
          speak("One");
        }
      }
    }
  }, [playFogHorn, playShortBeep, speak]);

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
    setIntervalTime(WORK_DURATION);
    setSessionTime(SESSION_DURATION);
    intervalTimeRef.current = WORK_DURATION;
    sessionTimeRef.current = SESSION_DURATION;
    announcedRef.current = new Set();
    setCurrentRound(1);
    currentRoundRef.current = 1;
    setPhase("work");
    phaseRef.current = "work";
    setWorkoutComplete(false);
    setShowIntervalCelebration(false);
    setShowFinalCelebration(false);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isBreak = phase === "break";
  const currentPhaseDuration = isBreak ? BREAK_DURATION : WORK_DURATION;
  const intervalProgress = ((currentPhaseDuration - intervalTime) / currentPhaseDuration) * 100;
  const sessionProgress = ((SESSION_DURATION - sessionTime) / SESSION_DURATION) * 100;

  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";
  const isIdle = timerState === "idle";

  const intervalWarning = intervalTime <= 10 && intervalTime > 0;
  const intervalCritical = intervalTime <= 5 && intervalTime > 0;

  const phaseColor = isBreak ? "#10b981" : "#3b82f6";
  const phaseGradient = isBreak
    ? "linear-gradient(to right, #10b981, #34d399)"
    : "linear-gradient(to right, #3b82f6, #60a5fa)";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white relative overflow-hidden"
      data-testid="workout-timer-page"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
        style={{ background: isRunning ? `radial-gradient(circle, ${phaseColor}, transparent)` : "radial-gradient(circle, #374151, transparent)" }}
      />

      {showIntervalCelebration && (
        <IntervalCelebration
          round={celebrationRound}
          onComplete={() => setShowIntervalCelebration(false)}
        />
      )}

      {showFinalCelebration && (
        <FinalCelebration
          onComplete={() => setShowFinalCelebration(false)}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-lg">
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
            <span>&#8226;</span>
            <span>2:30 work + 0:30 rest / 45 min session</span>
          </div>
        </div>

        {workoutComplete && !showFinalCelebration && (
          <div
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-center"
            data-testid="status-workout-complete"
          >
            <p className="text-2xl font-bold text-emerald-400 tracking-wider">Workout Complete!</p>
            <p className="text-emerald-300/70 text-sm mt-1">Great work. Session ended.</p>
          </div>
        )}

        <div className="w-full" data-testid="section-interval-timer">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-8 flex flex-col items-center gap-4">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-zinc-800">
              <div
                className="h-full transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: `${intervalProgress}%`,
                  background: intervalCritical
                    ? "#ef4444"
                    : intervalWarning
                    ? "#f59e0b"
                    : phaseGradient,
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">
                {isBreak ? "Break" : "Interval"}
              </p>
              {isRunning && (
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: isBreak ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                    color: isBreak ? "#34d399" : "#60a5fa",
                    border: `1px solid ${isBreak ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.3)"}`,
                  }}
                  data-testid="badge-phase"
                >
                  {isBreak ? "Rest" : "Work"}
                </span>
              )}
            </div>

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
                  ? isBreak ? "#6ee7b7" : "#f1f5f9"
                  : "#94a3b8",
                textShadow: isRunning
                  ? intervalCritical
                    ? "0 0 40px rgba(239,68,68,0.4)"
                    : isBreak
                    ? "0 0 40px rgba(16,185,129,0.3)"
                    : "0 0 40px rgba(59,130,246,0.3)"
                  : "none",
              }}
              data-testid="text-interval-time"
            >
              {formatTime(intervalTime)}
            </div>
          </div>
        </div>

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

        <div className="flex items-center gap-4 w-full" data-testid="controls-section">
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

        <div className="w-full rounded-xl overflow-hidden" data-testid="spotify-player">
          <iframe
            style={{ borderRadius: "12px" }}
            src="https://open.spotify.com/embed/playlist/7mZZkjpyoY83wHbssEtzNF?utm_source=generator&theme=0"
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Workout Playlist"
          />
        </div>

        <div className="flex items-center gap-2" data-testid="status-timer-state">
          <div
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{
              background: isRunning ? (isBreak ? "#10b981" : "#22c55e") : isPaused ? "#f59e0b" : "#52525b",
              boxShadow: isRunning ? `0 0 8px ${isBreak ? "#10b981" : "#22c55e"}` : "none",
            }}
          />
          <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">
            {isRunning ? (isBreak ? "Break" : "Running") : isPaused ? "Paused" : workoutComplete ? "Complete" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
