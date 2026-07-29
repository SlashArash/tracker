import React, { useState } from 'react';
import { X, Settings, Volume2, Clock, Lock, CheckCircle2, Shield, Sun, Moon } from 'lucide-react';
import { saveSettingsBulk } from '../services/db';
import { AppSettings, SoundAlertOption, AmbientSoundOption, ThemeOption } from '../types';

export interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onRefreshSettings: () => void;
  onOpenLockSetup: () => void;
}

export default function SettingsModal({
  isOpen,
  settings,
  onClose,
  onRefreshSettings,
  onOpenLockSetup
}: SettingsModalProps) {
  const [workDuration, setWorkDuration] = useState<number | string>(settings.workDuration || 25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number | string>(settings.shortBreakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState<number | string>(settings.longBreakDuration || 15);
  const [longBreakInterval, setLongBreakInterval] = useState<number | string>(settings.longBreakInterval || 4);
  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(settings.autoStartBreaks || false);
  const [soundVolume, setSoundVolume] = useState<number | string>(settings.soundVolume ?? 0.7);
  const [soundAlert, setSoundAlert] = useState<SoundAlertOption>(settings.soundAlert || 'chime');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundOption>(settings.ambientSound || 'rain');
  const [theme, setTheme] = useState<ThemeOption>(settings.theme || 'dark');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettingsBulk({
      workDuration: Number(workDuration),
      shortBreakDuration: Number(shortBreakDuration),
      longBreakDuration: Number(longBreakDuration),
      longBreakInterval: Number(longBreakInterval),
      autoStartBreaks,
      soundVolume: Number(soundVolume),
      soundAlert,
      ambientSound,
      theme
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onRefreshSettings();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 light:bg-slate-900/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-700 light:border-slate-300 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">Preferences & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 light:text-slate-500 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 light:text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="py-4 space-y-5 text-xs text-slate-300 light:text-slate-700">
          {/* Timer Durations */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-100 light:text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Timer Intervals (Minutes)</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Pomodoro</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  className="w-full bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-center font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shortBreakDuration}
                  onChange={(e) => setShortBreakDuration(e.target.value)}
                  className="w-full bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(e.target.value)}
                  className="w-full bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-center font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Long Break Interval</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={longBreakInterval}
                  onChange={(e) => setLongBreakInterval(e.target.value)}
                  className="w-20 bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-center font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 light:text-slate-600">pomodoros before long break</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-800 light:border-slate-200" />

          {/* Sound & Ambient Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-100 light:text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sound & Audio Effects</span>
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 light:text-slate-600">Master Volume</label>
                <span className="font-mono text-slate-300 light:text-slate-700">{Math.round(Number(soundVolume) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(e.target.value)}
                className="w-full accent-rose-500 bg-slate-800 light:bg-slate-200 rounded-lg h-2 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Completion Bell</label>
                <select
                  value={soundAlert}
                  onChange={(e) => setSoundAlert(e.target.value as SoundAlertOption)}
                  className="w-full bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="chime" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Harmonic Chime</option>
                  <option value="bell" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Resonant Bell</option>
                  <option value="ping" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Short Ping</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 light:text-slate-600 mb-1">Ambient Background</label>
                <select
                  value={ambientSound}
                  onChange={(e) => setAmbientSound(e.target.value as AmbientSoundOption)}
                  className="w-full bg-slate-900 light:bg-slate-50 border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="rain" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Gentle Rain (Brown)</option>
                  <option value="pink" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Pink Noise</option>
                  <option value="white" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">White Noise</option>
                  <option value="none" className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoStartBreaks"
                checked={autoStartBreaks}
                onChange={(e) => setAutoStartBreaks(e.target.checked)}
                className="rounded border-slate-700 light:border-slate-300 text-rose-500 focus:ring-rose-500 bg-slate-900 light:bg-slate-100 cursor-pointer"
              />
              <label htmlFor="autoStartBreaks" className="text-slate-300 light:text-slate-700 cursor-pointer">
                Auto-start breaks when Pomodoro finishes
              </label>
            </div>
          </div>

          <hr className="border-slate-800 light:border-slate-200" />

          {/* Theme Settings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-100 light:text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Appearance & Theme</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-600 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-800 light:border-slate-200" />

          {/* Local Lock Setup Button */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-100 light:text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security & Access Lock</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLockSetup();
              }}
              className="w-full bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700 light:border-slate-300 text-slate-200 light:text-slate-800 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{settings.isPasscodeEnabled ? 'Change Passcode' : 'Set Up Passcode Lock'}</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-rose-500/20 cursor-pointer mt-4"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
