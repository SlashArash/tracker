import React from 'react';
import { Timer as TimerIcon, FolderGit2, History, Settings as SettingsIcon, FileJson, Lock, Sun, Moon } from 'lucide-react';
import { Project, AppSettings } from '../types';
import { TabType } from '../App';
import { cn } from '../lib/utils';

interface HeaderProps {
  activeTab: TabType;
  projects: Project[];
  settings: AppSettings;
  onTabSwitch: (tab: TabType) => void;
  onToggleTheme: () => void;
  onOpenBackup: () => void;
  onOpenSettings: () => void;
  onLock: () => void;
}

export default function Header({
  activeTab,
  projects,
  settings,
  onTabSwitch,
  onToggleTheme,
  onOpenBackup,
  onOpenSettings,
  onLock
}: HeaderProps) {
  const isLight = settings.theme === 'light';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border bg-background/80 transition-colors px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
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
            onClick={() => onTabSwitch('timer')}
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
            onClick={() => onTabSwitch('projects')}
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
            onClick={() => onTabSwitch('history')}
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
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          >
            {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={onOpenBackup}
            className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Import / Export Data"
          >
            <FileJson className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Preferences"
          >
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {settings.isPasscodeEnabled && (
            <button
              onClick={onLock}
              className="p-2 rounded-xl border border-border bg-card text-card-foreground hover:text-rose-500 hover:bg-accent transition-colors cursor-pointer"
              title="Lock Workspace"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
