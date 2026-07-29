import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, AlertCircle, FileJson, CheckCircle2 } from 'lucide-react';
import { db, clearAllData, getSettings } from '../services/db';
import { encryptData, decryptData } from '../services/crypto';

export interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function DataBackupModal({ isOpen, onClose, onRefresh }: DataBackupModalProps) {
  const [exportPasscode, setExportPasscode] = useState('');
  const [importPasscode, setImportPasscode] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      const projects = await db.projects.toArray();
      const tasks = await db.tasks.toArray();
      const sessions = await db.sessions.toArray();
      const settings = await getSettings();

      const backupPayload = {
        app: 'Gojodoro',
        exportedAt: new Date().toISOString(),
        version: 1,
        data: {
          projects,
          tasks,
          sessions,
          settings
        }
      };

      let finalContentString = JSON.stringify(backupPayload, null, 2);
      let filename = `Gojodoro-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (useEncryption) {
        if (!exportPasscode) {
          setMessage({ type: 'error', text: 'Please provide a passcode to encrypt the export file.' });
          setLoading(false);
          return;
        }
        finalContentString = await encryptData(finalContentString, exportPasscode);
        filename = `Gojodoro-encrypted-backup-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([finalContentString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `Backup file "${filename}" downloaded successfully!` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to export backup data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a JSON backup file to import.' });
      return;
    }

    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const text = await importFile.text();
      let parsed = JSON.parse(text);

      // Check if file is encrypted payload
      if (parsed.encrypted) {
        if (!importPasscode) {
          setMessage({ type: 'error', text: 'This file is encrypted. Enter the decryption passcode.' });
          setLoading(false);
          return;
        }
        const decryptedStr = await decryptData(parsed, importPasscode);
        parsed = JSON.parse(decryptedStr);
      }

      if (!parsed.data || !Array.isArray(parsed.data.projects) || !Array.isArray(parsed.data.sessions)) {
        throw new Error('Invalid Gojodoro backup file structure.');
      }

      // Restore data to IndexedDB
      await clearAllData();

      if (parsed.data.projects?.length > 0) {
        await db.projects.bulkAdd(parsed.data.projects);
      }
      if (parsed.data.tasks?.length > 0) {
        await db.tasks.bulkAdd(parsed.data.tasks);
      }
      if (parsed.data.sessions?.length > 0) {
        await db.sessions.bulkAdd(parsed.data.sessions);
      }
      if (parsed.data.settings) {
        const entries = Object.entries(parsed.data.settings).map(([key, value]) => ({ key, value }));
        await db.settings.bulkPut(entries);
      }

      setMessage({ type: 'success', text: 'Data imported successfully! Reloading workspace...' });
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err?.message || 'Failed to parse or decrypt backup file.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 light:bg-slate-900/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 border border-slate-700 light:border-slate-300 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">Import & Export Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 light:text-emerald-700'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300 light:text-rose-700'
              }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="py-5 space-y-6">
          {/* Export Section */}
          <div className="bg-slate-900/60 light:bg-slate-50 rounded-xl p-4 border border-slate-800/80 light:border-slate-200 space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-rose-400" />
              <span>Export JSON Backup</span>
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Download your projects, tasks, and session logs to a JSON file.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="encryptExport"
                checked={useEncryption}
                onChange={(e) => setUseEncryption(e.target.checked)}
                className="rounded border-slate-700 light:border-slate-300 text-rose-500 focus:ring-rose-500 bg-slate-900 light:bg-slate-100 cursor-pointer"
              />
              <label htmlFor="encryptExport" className="text-xs text-slate-300 light:text-slate-700 cursor-pointer flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Encrypt backup with passcode
              </label>
            </div>

            {useEncryption && (
              <input
                type="password"
                value={exportPasscode}
                onChange={(e) => setExportPasscode(e.target.value)}
                placeholder="Enter passcode for file encryption"
                className="w-full bg-slate-950 light:bg-white border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
              />
            )}

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-white light:text-slate-800 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700 light:border-slate-300"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Exporting...' : 'Download Backup File'}</span>
            </button>
          </div>

          {/* Import Section */}
          <form onSubmit={handleImport} className="bg-slate-900/60 light:bg-slate-50 rounded-xl p-4 border border-slate-800/80 light:border-slate-200 space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import JSON Backup</span>
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Restore your workspace from a previously exported `.json` file.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 light:text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 light:file:bg-slate-200 file:text-white light:file:text-slate-800 hover:file:bg-slate-700 light:hover:file:bg-slate-300 cursor-pointer"
            />

            <input
              type="password"
              value={importPasscode}
              onChange={(e) => setImportPasscode(e.target.value)}
              placeholder="Decryption passcode (if file is encrypted)"
              className="w-full bg-slate-950 light:bg-white border border-slate-700 light:border-slate-300 text-slate-100 light:text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={loading || !importFile}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Restoring...' : 'Restore Data from File'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
