import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, FolderGit2, History, Settings as SettingsIcon, FileJson, Lock, Shield, Sparkles } from 'lucide-react';
import { db, initDatabase, getSettings } from './services/db';
import Timer from './components/Timer';
import ProjectManager from './components/ProjectManager';
import SessionHistory from './components/SessionHistory';
import SettingsModal from './components/SettingsModal';
import DataBackupModal from './components/DataBackupModal';
import LockScreen from './components/LockScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'projects' | 'history'
  const [isLocked, setIsLocked] = useState(false);
  const [isLockSetup, setIsLockSetup] = useState(false);
  const [activePasscode, setActivePasscode] = useState(null);

  // App data state
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Load database and settings on startup
  const loadAppData = async () => {
    try {
      await initDatabase();
      const currentSettings = await getSettings();
      setSettings(currentSettings);

      const loadedProjects = await db.projects.toArray();
      const loadedTasks = await db.tasks.toArray();
      const loadedSessions = await db.sessions.toArray();

      setProjects(loadedProjects);
      setTasks(loadedTasks);
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

  const handleUnlock = (passcode) => {
    setActivePasscode(passcode);
    setIsLocked(false);
  };

  const handlePasscodeCreated = (passcode) => {
    setActivePasscode(passcode);
    setIsLockSetup(false);
    setIsLocked(false);
    loadAppData();
  };

  if (isInitializing || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse mb-4">
          <TimerIcon className="w-6 h-6 text-rose-500" />
        </div>
        <span className="text-sm font-medium tracking-wide">Loading PomoTrack...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
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
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <TimerIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight font-heading">PomoTrack</h1>
                <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  Offline-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Pomodoro Project Time Tracker</p>
            </div>
          </div>

          {/* Action Icons & Security */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Import / Export Data"
            >
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Preferences"
            >
              <SettingsIcon className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {settings.isPasscodeEnabled && (
              <button
                onClick={() => setIsLocked(true)}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Lock Workspace"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-24">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects & Tasks</span>
              {projects.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {projects.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History Log</span>
            </button>
          </div>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'timer' && (
          <Timer
            settings={settings}
            projects={projects}
            tasks={tasks}
            onSessionLogged={loadAppData}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            tasks={tasks}
            onRefresh={loadAppData}
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
          <span>PomoTrack • Privacy First & Local Storage</span>
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
