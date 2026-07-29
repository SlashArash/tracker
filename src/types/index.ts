export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export type TaskStatus = 'not_started' | 'next' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPomodoros?: number;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface Session {
  id: string;
  projectId: string | null;
  taskId: string | null;
  categoryName: string;
  taskName: string | null;
  mode: TimerMode;
  durationSeconds: number;
  completedAt: string;
}

export type SoundAlertOption = 'chime' | 'bell' | 'synth';
export type AmbientSoundOption = 'none' | 'white' | 'pink' | 'rain';
export type ThemeOption = 'dark' | 'light';

export interface AppSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundVolume: number;
  soundAlert: SoundAlertOption;
  ambientSound: AmbientSoundOption;
  isPasscodeEnabled: boolean;
  passcodeHash: string | null;
  passcodeSalt: string | null;
  theme: ThemeOption;
  [key: string]: any;
}

export interface EncryptedPayload {
  version: number;
  encrypted: boolean;
  salt: string;
  iv: string;
  data: string;
}

export interface BackupExportData {
  version: number;
  exportDate: string;
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  settings: Record<string, any>;
}

export interface LogCompletedSessionParams {
  projectId?: string | null;
  taskId?: string | null;
  mode?: TimerMode;
  durationSeconds?: number;
  categoryName?: string;
  taskName?: string | null;
}
