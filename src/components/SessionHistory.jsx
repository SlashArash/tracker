import React from 'react';
import { History, Clock, Trash2, Calendar, CheckCircle, Tag, Layers } from 'lucide-react';
import { db } from '../services/db';

export default function SessionHistory({ sessions = [], projects = [], onRefresh }) {
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session log entry?')) return;
    await db.sessions.delete(sessionId);
    onRefresh();
  };

  // Helper formatting seconds to "Xm Ys" or "Xh Ym"
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs > 0 ? secs + 's' : ''}`;
    }
    return `${secs}s`;
  };

  // Calculate totals
  const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalSessionsCount = sessions.length;

  // Filter today's sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.completedAt && s.completedAt.startsWith(todayStr));
  const todaySeconds = todaySessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-6">
      {/* Header & Stats Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight">Time Tracking History</h2>
        <p className="text-xs text-slate-400 light:text-slate-500">Log of all your focused pomodoros and stopwatch sessions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Today's Focus</span>
            <span className="text-xl font-bold text-slate-100 light:text-slate-900 font-mono">{formatDuration(todaySeconds)}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Total Logged Time</span>
            <span className="text-xl font-bold text-slate-100 light:text-slate-900 font-mono">{formatDuration(totalSeconds)}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Total Sessions</span>
            <span className="text-xl font-bold text-slate-100 light:text-slate-900 font-mono">{totalSessionsCount}</span>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 light:border-slate-200 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 light:text-slate-900 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400 light:text-slate-500" />
          <span>Session Log</span>
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 light:text-slate-400 text-sm">
            No completed sessions recorded yet. Start a timer to log your time!
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions
              .slice()
              .reverse()
              .map((sess) => {
                const proj = projects.find(p => p.id === sess.projectId);
                const categoryColor = proj ? proj.color : '#94a3b8';
                const dateObj = new Date(sess.completedAt);
                const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateFormatted = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 hover:bg-slate-900 light:hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: categoryColor }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100 light:text-slate-900">
                            {sess.categoryName || 'Uncategorized'}
                          </span>
                          {sess.taskName && (
                            <span className="text-xs text-slate-400 light:text-slate-500 font-normal">
                              • {sess.taskName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 light:text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateFormatted} at {timeFormatted}
                          </span>
                          <span className="capitalize text-slate-400 light:text-slate-600 font-medium">
                            {sess.mode === 'stopwatch' ? 'Stopwatch' : 'Pomodoro'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold font-mono text-emerald-400 light:text-emerald-600 bg-emerald-500/10 light:bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-500/20 light:border-emerald-200">
                        {formatDuration(sess.durationSeconds)}
                      </span>

                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1.5 rounded-lg text-slate-600 light:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
