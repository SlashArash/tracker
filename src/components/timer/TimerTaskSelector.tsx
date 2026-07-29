import React from 'react';
import { CloudRain } from 'lucide-react';
import { Project, Task, TaskStatus } from '../../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../ProjectManager';
import { cn } from '../../lib/utils';

interface TimerTaskSelectorProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string;
  selectedTaskId: string;
  selectedProject?: Project;
  selectedTask?: Task;
  availableTasks: Task[];
  isAmbientPlaying: boolean;
  onSelectProject: (projectId: string) => void;
  onSelectTask: (taskId: string) => void;
  onUpdateTaskStatus: (status: TaskStatus) => void;
  onToggleAmbient: () => void;
}

export default function TimerTaskSelector({
  projects,
  selectedProjectId,
  selectedTaskId,
  selectedProject,
  selectedTask,
  availableTasks,
  isAmbientPlaying,
  onSelectProject,
  onSelectTask,
  onUpdateTaskStatus,
  onToggleAmbient
}: TimerTaskSelectorProps) {
  return (
    <div className="w-full glass-panel rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-3 border border-border">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div
          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: selectedProject ? selectedProject.color : 'hsl(var(--muted-foreground))' }}
        />
        <div className="flex flex-col text-left w-full">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assigned Task</span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                onSelectProject(e.target.value);
                onSelectTask('');
              }}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer border-b border-transparent hover:border-border transition-colors text-foreground"
            >
              <option value="" className="bg-card text-card-foreground">Uncategorized</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-card-foreground">
                  {p.name}
                </option>
              ))}
            </select>

            {selectedProjectId && availableTasks.length > 0 && (
              <span className="text-muted-foreground text-xs">/</span>
            )}

            {selectedProjectId && availableTasks.length > 0 && (
              <select
                value={selectedTaskId}
                onChange={(e) => onSelectTask(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer border-b border-transparent hover:border-border transition-colors text-foreground max-w-50 truncate"
              >
                <option value="" className="bg-card text-muted-foreground">Select Task (Optional)</option>
                {availableTasks.map((t) => {
                  const priorityText = t.priority ? `[${t.priority.toUpperCase()}] ` : '';
                  return (
                    <option key={t.id} value={t.id} className="bg-card text-card-foreground">
                      {priorityText}{t.name}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Selected Task Details & Controls */}
      {selectedTask && (
        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-lg border text-[10px] uppercase font-semibold",
            PRIORITY_CONFIG[selectedTask.priority || 'medium']?.badgeClass
          )}>
            {selectedTask.priority || 'medium'}
          </span>

          {/* Status Selector Direct Control */}
          <select
            value={selectedTask.status || 'not_started'}
            onChange={(e) => onUpdateTaskStatus(e.target.value as TaskStatus)}
            className={cn(
              "px-2 py-0.5 rounded-lg border text-[10px] font-semibold focus:outline-none cursor-pointer",
              STATUS_CONFIG[selectedTask.status || 'not_started']?.badgeClass
            )}
            title="Update Status"
          >
            <option value="not_started" className="bg-card text-foreground">Not Started</option>
            <option value="next" className="bg-card text-foreground">Next</option>
            <option value="in_progress" className="bg-card text-foreground">In Progress</option>
            <option value="done" className="bg-card text-foreground">Done</option>
          </select>
        </div>
      )}

      {/* Ambient Sound Toggle */}
      <button
        onClick={onToggleAmbient}
        className={cn(
          "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0",
          isAmbientPlaying
            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-sm"
            : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        title="Toggle ambient background noise"
      >
        <CloudRain className="w-3.5 h-3.5" />
        <span>{isAmbientPlaying ? 'Ambient On' : 'Ambient Off'}</span>
      </button>
    </div>
  );
}
