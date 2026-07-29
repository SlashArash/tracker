import React, { useState, useEffect, useRef } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { playAlertSound, startAmbientSound, stopAmbientSound } from '../services/audio';
import { logCompletedSession, db } from '../services/db';
import { AppSettings, Project, Task, TaskStatus, TimerMode } from '../types';
import TimerModeTabs from './timer/TimerModeTabs';
import TimerTaskSelector from './timer/TimerTaskSelector';
import TimerDisplay from './timer/TimerDisplay';
import TimerControls from './timer/TimerControls';

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

  const handleSelectMode = (newMode: ExtendedTimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'work') setTimeLeft(settings.workDuration * 60);
    else if (newMode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
    else if (newMode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
    else setTimeLeft(0);
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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4">
      {/* Mode Switcher Tabs */}
      <TimerModeTabs mode={mode} onSelectMode={handleSelectMode} />

      {/* Task & Project Selector Card */}
      <TimerTaskSelector
        projects={projects}
        tasks={tasks}
        selectedProjectId={selectedProjectId}
        selectedTaskId={selectedTaskId}
        selectedProject={selectedProject}
        selectedTask={selectedTask}
        availableTasks={availableTasks}
        isAmbientPlaying={isAmbientPlaying}
        onSelectProject={(projId) => setSelectedProjectId(projId)}
        onSelectTask={(taskId) => setSelectedTaskId(taskId)}
        onUpdateTaskStatus={handleUpdateTaskStatusDirectly}
        onToggleAmbient={() => setIsAmbientPlaying(!isAmbientPlaying)}
      />

      {/* Main Circular Timer */}
      <TimerDisplay
        timeLeft={timeLeft}
        isRunning={isRunning}
        mode={mode}
        completedCycles={completedCycles}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        formatTime={formatTime}
      />

      {/* Control Buttons */}
      <TimerControls
        isRunning={isRunning}
        mode={mode}
        onStartPause={handleStartPause}
        onReset={handleReset}
        onSkip={handleSkip}
      />
    </div>
  );
}
