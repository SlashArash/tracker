import React, { useState, useEffect, useRef } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Play, Pause, RotateCcw, SkipForward, CloudRain, Flame, Coffee, Sparkles, Circle, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import { playAlertSound, startAmbientSound, stopAmbientSound } from '../services/audio';
import { logCompletedSession, db } from '../services/db';
import { AppSettings, Project, Task, TaskStatus, TaskPriority, TimerMode } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from './ProjectManager';
import { cn } from '../lib/utils';

export interface TimerProps {
  settings: AppSettings;
  projects?: Project[];
  tasks?: Task[];
  initialProjectId?: string;
  initialTaskId?: string;
  onSessionLogged?: () => void;
}

export type ExtendedTimerMode = TimerMode | 'stopwatch';

export default function Timer({
  settings,
  projects = [],
  tasks = [],
  initialProjectId,
  initialTaskId,
  onSessionLogged
}: TimerProps) {
  const [mode, setMode] = useState<ExtendedTimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [selectedProjectId, setSelectedProjectId] = useQueryState(
    'project',
    parseAsString.withDefault('')
  );
  const [selectedTaskId, setSelectedTaskId] = useQueryState(
    'task',
    parseAsString.withDefault('')
  );
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (initialProjectId !== undefined && initialProjectId !== selectedProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (initialTaskId !== undefined && initialTaskId !== selectedTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const availableTasks = tasks
    .filter(t => t.projectId === selectedProjectId && t.status !== 'done' && !t.completed)
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
    });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Sync timer duration when settings or mode change (if timer is stopped)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'work') setTimeLeft(settings.workDuration * 60);
      else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
      else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
      else if (mode === 'stopwatch') setTimeLeft(0);
    }
  }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration, mode]);

  // Handle ambient noise play state
  useEffect(() => {
    if (isRunning && isAmbientPlaying) {
      const activeAmbientType = (!settings.ambientSound || settings.ambientSound === 'none') ? 'rain' : settings.ambientSound;
      startAmbientSound(activeAmbientType, settings.soundVolume || 0.5);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [isRunning, isAmbientPlaying, settings.ambientSound, settings.soundVolume]);

  // Main countdown / countup timer loop with timestamp tracking
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();

      const updateTimer = () => {
        const now = Date.now();
        const elapsedSecs = Math.floor((now - lastTickRef.current) / 1000);
        if (elapsedSecs <= 0) return;

        lastTickRef.current += elapsedSecs * 1000;

        if (mode === 'stopwatch') {
          setTimeLeft(prev => prev + elapsedSecs);
        } else {
          setTimeLeft(prev => {
            const next = prev - elapsedSecs;
            if (next <= 0) {
              handleTimerComplete();
              return 0;
            }
            return next;
          });
        }
      };

      timerRef.current = setInterval(updateTimer, 1000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isRunning) {
          updateTimer();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedProjectId, selectedTaskId, completedCycles, settings]);

  // Handle completion when countdown reaches zero
  const handleTimerComplete = async () => {
    setIsRunning(false);
    playAlertSound(settings.soundAlert || 'chime', settings.soundVolume || 0.7);

    let targetDuration = 0;
    if (mode === 'work') targetDuration = settings.workDuration * 60;
    else if (mode === 'shortBreak') targetDuration = settings.shortBreakDuration * 60;
    else if (mode === 'longBreak') targetDuration = settings.longBreakDuration * 60;

    if (mode === 'work' || mode === 'stopwatch') {
      const durationLogged = mode === 'stopwatch' ? timeLeft : targetDuration;
      await logCompletedSession({
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        mode: mode === 'stopwatch' ? 'work' : mode,
        durationSeconds: durationLogged,
        categoryName: selectedProject ? selectedProject.name : 'Uncategorized',
        taskName: selectedTask ? selectedTask.name : null
      });

      if (onSessionLogged) onSessionLogged();
    }

    if (mode === 'work') {
      const nextCycle = completedCycles + 1;
      setCompletedCycles(nextCycle);

      if (nextCycle % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }

      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
    } else if (mode === 'shortBreak' || mode === 'longBreak') {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      }
    }
  };

  const handleStartPause = async () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    // When starting a session, auto-transition assigned task from Not Started / Next -> In Progress
    if (newIsRunning && selectedTask && (selectedTask.status === 'not_started' || selectedTask.status === 'next')) {
      await db.tasks.update(selectedTask.id, { status: 'in_progress' });
      if (onSessionLogged) onSessionLogged();
    }
  };

  const handleUpdateTaskStatusDirectly = async (newStatus: TaskStatus) => {
    if (!selectedTask) return;
    await db.tasks.update(selectedTask.id, {
      status: newStatus,
      completed: newStatus === 'done'
    });
    if (newStatus === 'done') {
      setSelectedTaskId('');
    }
    if (onSessionLogged) onSessionLogged();
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(settings.workDuration * 60);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
    else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
    else setTimeLeft(0);
  };

  const handleSkip = () => {
    handleReset();
    if (mode === 'work') {
      setMode('shortBreak');
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDurationSeconds =
    mode === 'work'
      ? settings.workDuration * 60
      : mode === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : mode === 'longBreak'
          ? settings.longBreakDuration * 60
          : 3600;

  const progressFraction = mode === 'stopwatch'
    ? (timeLeft % 3600) / 3600
    : (totalDurationSeconds - timeLeft) / totalDurationSeconds;

  const strokeDasharray = 2 * Math.PI * 140;
  const strokeDashoffset = strokeDasharray * (1 - Math.min(1, Math.max(0, progressFraction)));

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-border bg-card shadow-lg mb-8 transition-colors">
        <button
          onClick={() => { setIsRunning(false); setMode('work'); setTimeLeft(settings.workDuration * 60); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            mode === 'work'
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          Pomodoro
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('shortBreak'); setTimeLeft(settings.shortBreakDuration * 60); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            mode === 'shortBreak'
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Coffee className="w-3.5 h-3.5" />
          Short Break
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('longBreak'); setTimeLeft(settings.longBreakDuration * 60); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            mode === 'longBreak'
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Long Break
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('stopwatch'); setTimeLeft(0); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            mode === 'stopwatch'
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Stopwatch
        </button>
      </div>

      {/* Task & Project Selector Card */}
      <div className="w-full glass-panel rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-3 border border-border">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div
            className="w-4 h-4 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: selectedProject ? selectedProject.color : 'hsl(var(--muted-foreground))' }}
          />
          <div className="flex flex-col text-left w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assigned Task</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTaskId('');
                }}
                className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer border-b border-transparent hover:border-border transition-colors text-foreground"
              >
                <option value="" className="bg-card text-card-foreground">Uncategorized</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-card-foreground">
                    {p.name}
                  </option>
                ))}
              </select>

              {selectedProjectId && availableTasks.length > 0 && (
                <span className="text-muted-foreground text-xs">/</span>
              )}

              {selectedProjectId && availableTasks.length > 0 && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer border-b border-transparent hover:border-border transition-colors text-foreground max-w-50 truncate"
                >
                  <option value="" className="bg-card text-muted-foreground">Select Task (Optional)</option>
                  {availableTasks.map((t) => {
                    const priorityText = t.priority ? `[${t.priority.toUpperCase()}] ` : '';
                    return (
                      <option key={t.id} value={t.id} className="bg-card text-card-foreground">
                        {priorityText}{t.name}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Selected Task Details & Controls */}
        {selectedTask && (
          <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-lg border text-[10px] uppercase font-semibold",
              PRIORITY_CONFIG[selectedTask.priority || 'medium']?.badgeClass
            )}>
              {selectedTask.priority || 'medium'}
            </span>

            {/* Status Selector Direct Control */}
            <select
              value={selectedTask.status || 'not_started'}
              onChange={(e) => handleUpdateTaskStatusDirectly(e.target.value as TaskStatus)}
              className={cn(
                "px-2 py-0.5 rounded-lg border text-[10px] font-semibold focus:outline-none cursor-pointer",
                STATUS_CONFIG[selectedTask.status || 'not_started']?.badgeClass
              )}
              title="Update Status"
            >
              <option value="not_started" className="bg-card text-foreground">Not Started</option>
              <option value="next" className="bg-card text-foreground">Next</option>
              <option value="in_progress" className="bg-card text-foreground">In Progress</option>
              <option value="done" className="bg-card text-foreground">Done</option>
            </select>
          </div>
        )}

        {/* Ambient Sound Toggle */}
        <button
          onClick={() => setIsAmbientPlaying(!isAmbientPlaying)}
          className={cn(
            "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0",
            isAmbientPlaying
              ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-sm"
              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          title="Toggle ambient background noise"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>{isAmbientPlaying ? 'Ambient On' : 'Ambient Off'}</span>
        </button>
      </div>

      {/* Main Circular Timer */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-72 h-72 md:w-80 md:h-80 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="50%"
            cy="50%"
            r="140"
            className="stroke-border"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="140"
            className={cn(
              "transition-all duration-1000 ease-linear",
              isBreakMode ? 'stroke-emerald-500' : mode === 'stopwatch' ? 'stroke-amber-500' : 'stroke-rose-500'
            )}
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Content */}
        <div
          className={cn(
            "absolute flex flex-col items-center justify-center w-64 h-64 rounded-full glass-card transition-all border border-border shadow-xl",
            isRunning ? (isBreakMode ? 'timer-active-break' : 'timer-active-work') : ''
          )}
        >
          <span className="text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-foreground">
            {formatTime(timeLeft)}
          </span>

          <span className="text-xs font-semibold uppercase tracking-widest mt-2 flex items-center gap-1.5">
            {isBreakMode ? (
              <span className="text-emerald-500 font-bold">Break Time</span>
            ) : mode === 'stopwatch' ? (
              <span className="text-amber-500 font-bold">Stopwatch</span>
            ) : (
              <span className="text-rose-500 font-bold">Focus Phase</span>
            )}
          </span>

          {completedCycles > 0 && (
            <span className="text-[11px] mt-2 px-2.5 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
              Completed: {completedCycles} Pomodoros
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleReset}
          className="p-3.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleStartPause}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95",
            isRunning
              ? "bg-muted border border-border text-foreground hover:bg-accent"
              : isBreakMode
                ? "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25"
                : mode === 'stopwatch'
                  ? "bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25"
                  : "bg-linear-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-rose-500/25"
          )}
        >
          {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          onClick={handleSkip}
          className="p-3.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
          title="Skip to Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
