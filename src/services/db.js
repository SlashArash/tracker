import Dexie from 'dexie';

export const db = new Dexie('PomoTrackDB');

db.version(1).stores({
  projects: 'id, name, color, createdAt',
  tasks: 'id, projectId, name, completed, createdAt',
  sessions: 'id, projectId, taskId, mode, durationSeconds, completedAt',
  settings: 'key'
});

// Default initial settings
export const DEFAULT_SETTINGS = {
  workDuration: 25, // minutes
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundVolume: 0.7,
  soundAlert: 'chime', // chime, bell, synth
  ambientSound: 'none', // none, white, pink, rain
  isPasscodeEnabled: false,
  passcodeHash: null,
  passcodeSalt: null
};

// Seed default settings if empty
export async function initDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.settings.put({ key, value });
    }
  }

  const projectsCount = await db.projects.count();
  if (projectsCount === 0) {
    // Add default sample project
    const sampleProjectId = 'proj_' + Date.now();
    await db.projects.add({
      id: sampleProjectId,
      name: 'General Deep Work',
      color: '#ec4899', // Pink
      createdAt: new Date().toISOString()
    });

    await db.tasks.add({
      id: 'task_' + Date.now(),
      projectId: sampleProjectId,
      name: 'Focus Session Task',
      completed: false,
      createdAt: new Date().toISOString()
    });
  }
}

// Helper getter & setter for settings
export async function getSettings() {
  const rows = await db.settings.toArray();
  const settingsMap = { ...DEFAULT_SETTINGS };
  rows.forEach(item => {
    settingsMap[item.key] = item.value;
  });
  return settingsMap;
}

export async function saveSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function saveSettingsBulk(settingsObj) {
  const entries = Object.entries(settingsObj).map(([key, value]) => ({ key, value }));
  await db.settings.bulkPut(entries);
}

// Session log helpers
export async function logCompletedSession({ projectId, taskId, mode, durationSeconds, categoryName, taskName }) {
  const session = {
    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    projectId: projectId || null,
    taskId: taskId || null,
    categoryName: categoryName || 'Uncategorized',
    taskName: taskName || null,
    mode: mode || 'work',
    durationSeconds: durationSeconds || 0,
    completedAt: new Date().toISOString()
  };
  await db.sessions.add(session);
  return session;
}

// Reset / Purge DB for imports
export async function clearAllData() {
  await db.projects.clear();
  await db.tasks.clear();
  await db.sessions.clear();
  await db.settings.clear();
}
