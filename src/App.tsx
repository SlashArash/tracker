import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, FolderGit2, History, Settings as SettingsIcon, FileJson, Lock, Sparkles, Sun, Moon } from 'lucide-react';
import { db, initDatabase, getSettings, saveSetting } from './services/db';
import { Project, Task, Session, AppSettings } from './types';
import Timer from './components/Timer';
import ProjectManager from './components/ProjectManager';
import SessionHistory from './components/SessionHistory';
import SettingsModal from './components/SettingsModal';
import DataBackupModal from './components/DataBackupModal';
import LockScreen from './components/LockScreen';
import { cn } from './lib/utils';

export type TabType = 'timer' | 'projects' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLockSetup, setIsLockSetup] = useState<boolean>(false);
  const [activePasscode, setActivePasscode] = useState<string | null>(null);

  // Focus navigation state
  const [activeFocusProjectId, setActiveFocusProjectId] = useState<string>('');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string>('');

  // App data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);

  // Load database and settings on startup
  const loadAppData = async () => {
    try {
      await initDatabase();
      const currentSettings = await getSettings();
      setSettings(currentSettings);

      const loadedProjects = await db.projects.toArray();
      const loadedTasks = await db.tasks.toArray();
      const loadedSessions = await db.sessions.toArray();

      const normalizedTasks: Task[] = loadedTasks.map(t => ({
        ...t,
        status: t.status || (t.completed ? 'done' : 'not_started'),
        priority: t.priority || 'medium',
        completed: t.status ? t.status === 'done' : Boolean(t.completed)
      }));

      setProjects(loadedProjects);
      setTasks(normalizedTasks);
      setSessions(loadedSessions);

      // Check if lock is enabled
      if (currentSettings.isPasscodeEnabled && !activePasscode) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    if (settings?.theme) {
      const root = document.documentElement;
      if (settings.theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [settings?.theme]);

  const handleUnlock = (passcode: string) => {
    setActivePasscode(passcode);
    setIsLocked(false);
  };

  const handlePasscodeCreated = (passcode: string) => {
    setActivePasscode(passcode);
    setIsLockSetup(false);
    setIsLocked(false);
    loadAppData();
  };

  const handleToggleTheme = async () => {
    if (!settings) return;
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await saveSetting('theme', newTheme);
    setSettings({ ...settings, theme: newTheme });
  };

  if (isInitializing || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse mb-4">
          <TimerIcon className="w-6 h-6 text-rose-500" />
        </div>
        <span className="text-sm font-medium tracking-wide">Loading Gojodoro...</span>
      </div>
    );
  }

  const isLight = settings.theme === 'light';

  const handleStartTaskFocus = (projectId: string, taskId?: string) => {
    setActiveFocusProjectId(projectId);
    setActiveFocusTaskId(taskId || '');
    setActiveTab('timer');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300 bg-background text-foreground">
      {/* Passcode Lock Overlay */}
      {isLocked && (
        <LockScreen
          isSetupMode={false}
          storedHash={settings.passcodeHash}
          storedSalt={settings.passcodeSalt}
          onUnlock={handleUnlock}
        />
      )}

      {/* Passcode Setup Modal Overlay */}
      {isLockSetup && (
        <LockScreen
          isSetupMode={true}
          onPasscodeCreated={handlePasscodeCreated}
        />
      )}

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border bg-background/80 transition-colors px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <TimerIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight font-heading text-foreground">Gojodoro</h1>
                <span className="hidden sm:inline-block text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  Offline-First
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Pomodoro Project Time Tracker</p>
            </div>
          </div>

          {/* Desktop Integrated Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl border border-border bg-card/60 backdrop-blur-md shadow-xs">
            <button
              onClick={() => setActiveTab('timer')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'timer'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <TimerIcon className="w-3.5 h-3.5" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'projects'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects & Tasks</span>
              {projects.length > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeTab === 'projects'
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {projects.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'history'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <History className="w-3.5 h-3.5" />
              <span>History Log</span>
            </button>
          </nav>

          {/* Action Icons & Security */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Theme Toggle Header Button */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            >
              {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
            </button>

            <button
              onClick={() => setIsBackupOpen(true)}
              className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Import / Export Data"
            >
              <FileJson className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Preferences"
            >
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {settings.isPasscodeEnabled && (
              <button
                onClick={() => setIsLocked(true)}
                className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:text-rose-500 hover:bg-accent transition-colors cursor-pointer"
                title="Lock Workspace"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Glassmorphism Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-background/85 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('timer')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer",
            activeTab === 'timer'
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <TimerIcon className="w-4 h-4" />
          <span className="text-[11px]">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer relative",
            activeTab === 'projects'
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className="relative flex items-center">
            <FolderGit2 className="w-4 h-4" />
            {projects.length > 0 && (
              <span className={cn(
                "absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold leading-none",
                activeTab === 'projects'
                  ? "bg-white text-rose-600"
                  : "bg-rose-500 text-white"
              )}>
                {projects.length}
              </span>
            )}
          </div>
          <span className="text-[11px]">Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer",
            activeTab === 'history'
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <History className="w-4 h-4" />
          <span className="text-[11px]">History</span>
        </button>
      </nav>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-28 md:pb-12">

        {/* Tab Content Views */}
        {activeTab === 'timer' && (
          <Timer
            settings={settings}
            projects={projects}
            tasks={tasks}
            initialProjectId={activeFocusProjectId}
            initialTaskId={activeFocusTaskId}
            onSessionLogged={loadAppData}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            tasks={tasks}
            sessions={sessions}
            onRefresh={loadAppData}
            onStartTaskFocus={handleStartTaskFocus}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistory
            sessions={sessions}
            projects={projects}
            onRefresh={loadAppData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span>Gojodoro • Privacy First & Local Storage</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Web Audio Synthesized
          </span>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshSettings={loadAppData}
        onOpenLockSetup={() => setIsLockSetup(true)}
      />

      <DataBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onRefresh={loadAppData}
      />
    </div>
  );
}
