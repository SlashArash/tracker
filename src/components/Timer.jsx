import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, FolderGit2, CheckCircle2, CloudRain, Flame, Coffee, Sparkles } from 'lucide-react';
import { playAlertSound, startAmbientSound, stopAmbientSound } from '../services/audio';
import { logCompletedSession } from '../services/db';

export default function Timer({
  settings,
  projects = [],
  tasks = [],
  onSessionLogged
}) {
  const [mode, setMode] = useState('work'); // 'work' | 'shortBreak' | 'longBreak' | 'stopwatch'
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Reference for timer interval
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedTimeRef = useRef(0); // For stopwatch mode

  // Filter tasks matching selected project
  const availableTasks = tasks.filter(t => t.projectId === selectedProjectId && !t.completed);

  // Selected object details
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
      startAmbientSound(settings.ambientSound || 'rain', settings.soundVolume || 0.5);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [isRunning, isAmbientPlaying, settings.ambientSound, settings.soundVolume]);

  // Main countdown / countup timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
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

    // Calculate logged duration
    let targetDuration = 0;
    if (mode === 'work') targetDuration = settings.workDuration * 60;
    else if (mode === 'shortBreak') targetDuration = settings.shortBreakDuration * 60;
    else if (mode === 'longBreak') targetDuration = settings.longBreakDuration * 60;

    // Log session to IndexedDB if it was a work or stopwatch session
    if (mode === 'work' || mode === 'stopwatch') {
      const durationLogged = mode === 'stopwatch' ? timeLeft : targetDuration;
      await logCompletedSession({
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        mode,
        durationSeconds: durationLogged,
        categoryName: selectedProject ? selectedProject.name : 'Uncategorized',
        taskName: selectedTask ? selectedTask.name : null
      });

      if (onSessionLogged) onSessionLogged();
    }

    // Auto-advance mode logic
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

  const handleStartPause = () => {
    setIsRunning(!isRunning);
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

  // Helper formatting mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate SVG Circle Stroke Offset
  const totalDurationSeconds =
    mode === 'work'
      ? settings.workDuration * 60
      : mode === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : mode === 'longBreak'
      ? settings.longBreakDuration * 60
      : 3600; // placeholder max for stopwatch

  const progressFraction = mode === 'stopwatch'
    ? (timeLeft % 3600) / 3600
    : (totalDurationSeconds - timeLeft) / totalDurationSeconds;

  const strokeDasharray = 2 * Math.PI * 140; // R = 140
  const strokeDashoffset = strokeDasharray * (1 - Math.min(1, Math.max(0, progressFraction)));

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4">
      {/* Mode Switcher Tabs */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-lg mb-8 transition-colors ${
        isLight ? 'bg-white border-slate-200/80 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <button
          onClick={() => { setIsRunning(false); setMode('work'); setTimeLeft(settings.workDuration * 60); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mode === 'work'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Pomodoro
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('shortBreak'); setTimeLeft(settings.shortBreakDuration * 60); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mode === 'shortBreak'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          Short Break
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('longBreak'); setTimeLeft(settings.longBreakDuration * 60); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mode === 'longBreak'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Long Break
        </button>

        <button
          onClick={() => { setIsRunning(false); setMode('stopwatch'); setTimeLeft(0); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            mode === 'stopwatch'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Stopwatch
        </button>
      </div>

      {/* Task & Project Selector Card */}
      <div className={`w-full glass-panel rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-3 border transition-colors ${
        isLight ? 'bg-white/90 border-slate-200 shadow-slate-200/40' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div
            className="w-4 h-4 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: selectedProject ? selectedProject.color : (isLight ? '#64748b' : '#94a3b8') }}
          />
          <div className="flex flex-col text-left w-full">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>Assigned Task</span>
            <div className="flex items-center gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTaskId('');
                }}
                className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer border-b border-transparent hover:border-slate-400 transition-colors ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                <option value="" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-300'}>Uncategorized</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'}>
                    {p.name}
                  </option>
                ))}
              </select>

              {selectedProjectId && availableTasks.length > 0 && (
                <span className={isLight ? 'text-slate-400 text-xs' : 'text-slate-600 text-xs'}>/</span>
              )}

              {selectedProjectId && availableTasks.length > 0 && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer border-b border-transparent hover:border-slate-400 transition-colors ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  <option value="" className={isLight ? 'bg-white text-slate-500' : 'bg-slate-900 text-slate-400'}>Select Task (Optional)</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Ambient Sound Toggle */}
        <button
          onClick={() => setIsAmbientPlaying(!isAmbientPlaying)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            isAmbientPlaying
              ? isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/10'
              : isLight
              ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
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
            className={isLight ? 'stroke-slate-200' : 'stroke-slate-800/60'}
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="140"
            className={`transition-all duration-1000 ease-linear ${
              isBreakMode
                ? 'stroke-emerald-500'
                : mode === 'stopwatch'
                ? 'stroke-amber-500'
                : 'stroke-rose-500'
            }`}
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Content */}
        <div
          className={`absolute flex flex-col items-center justify-center w-64 h-64 rounded-full glass-card transition-all ${
            isLight ? 'bg-white/95 border-slate-200/80 shadow-xl shadow-slate-200/60' : ''
          } ${
            isRunning
              ? isBreakMode
                ? 'timer-active-break'
                : 'timer-active-work'
              : ''
          }`}
        >
          <span className={`text-5xl md:text-6xl font-extrabold font-mono tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white drop-shadow-md'
          }`}>
            {formatTime(timeLeft)}
          </span>

          <span className="text-xs font-semibold uppercase tracking-widest mt-2 flex items-center gap-1.5">
            {isBreakMode ? (
              <span className={isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400 font-medium'}>Break Time</span>
            ) : mode === 'stopwatch' ? (
              <span className={isLight ? 'text-amber-600 font-bold' : 'text-amber-400 font-medium'}>Stopwatch</span>
            ) : (
              <span className={isLight ? 'text-rose-600 font-bold' : 'text-rose-400 font-medium'}>Focus Phase</span>
            )}
          </span>

          {completedCycles > 0 && (
            <span className={`text-[11px] mt-2 px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900/80 text-slate-500 border-slate-800'
            }`}>
              Completed: {completedCycles} Pomodoros
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handleReset}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-slate-200/50'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleStartPause}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 ${
            isRunning
              ? isLight
                ? 'bg-slate-200 border border-slate-300 text-slate-900 hover:bg-slate-300'
                : 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700'
              : isBreakMode
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25'
              : mode === 'stopwatch'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25'
              : 'bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-rose-500/25'
          }`}
        >
          {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          onClick={handleSkip}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-slate-200/50'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Skip to Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
