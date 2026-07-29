import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, ArrowUpDown, Check, X, Play, Plus } from 'lucide-react';
import { Project, Task, TaskStatus, TaskPriority } from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../ProjectManager';
import { cn } from '../../lib/utils';

interface ProjectListViewProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectFilter: string;
  expandedProjectId: string | null;
  onSetExpandedProjectId: (id: string | null) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTask: (projectId: string, e: React.FormEvent) => void;
  onUpdateStatus: (task: Task, newStatus: TaskStatus) => void;
  onUpdatePriority: (task: Task, newPriority: TaskPriority) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveInlineTitle: (taskId: string) => void;
  editingTaskId: string | null;
  editingTaskName: string;
  onSetEditingTaskId: (id: string | null) => void;
  onSetEditingTaskName: (name: string) => void;
  newTaskNames: Record<string, string>;
  onSetNewTaskNames: (names: Record<string, string>) => void;
  newTaskStatuses: Record<string, TaskStatus>;
  onSetNewTaskStatuses: (statuses: Record<string, TaskStatus>) => void;
  newTaskPriorities: Record<string, TaskPriority>;
  onSetNewTaskPriorities: (priorities: Record<string, TaskPriority>) => void;
  onStartTaskFocus?: (projectId: string, taskId?: string) => void;
}

export default function ProjectListView({
  projects,
  tasks,
  selectedProjectFilter,
  expandedProjectId,
  onSetExpandedProjectId,
  onDeleteProject,
  onAddTask,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteTask,
  onSaveInlineTitle,
  editingTaskId,
  editingTaskName,
  onSetEditingTaskId,
  onSetEditingTaskName,
  newTaskNames,
  onSetNewTaskNames,
  newTaskStatuses,
  onSetNewTaskStatuses,
  newTaskPriorities,
  onSetNewTaskPriorities,
  onStartTaskFocus
}: ProjectListViewProps) {
  // Sort state per project
  const [sortBy, setSortBy] = useState<Record<string, 'priority' | 'status' | 'date'>>({});
  // Visible task limit for pagination per project
  const [visibleListTaskCounts, setVisibleListTaskCounts] = useState<Record<string, number>>({});

  if (projects.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
        No projects created yet. Click <span className="text-foreground font-medium">"New Project"</span> to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects
        .filter(p => selectedProjectFilter === 'all' || p.id === selectedProjectFilter)
        .map((proj) => {
          const rawProjectTasks = tasks.filter((t) => t.projectId === proj.id);
          const isExpanded = expandedProjectId === proj.id || projects.length === 1 || selectedProjectFilter !== 'all';
          const currentSort = sortBy[proj.id] || 'priority';

          // Sort tasks
          const sortedTasks = [...rawProjectTasks].sort((a, b) => {
            if (currentSort === 'priority') {
              const levelA = PRIORITY_CONFIG[a.priority || 'medium']?.level || 2;
              const levelB = PRIORITY_CONFIG[b.priority || 'medium']?.level || 2;
              return levelB - levelA;
            } else if (currentSort === 'status') {
              const statusOrder: Record<TaskStatus, number> = {
                in_progress: 1,
                next: 2,
                not_started: 3,
                done: 4
              };
              return (statusOrder[a.status || 'not_started'] || 3) - (statusOrder[b.status || 'not_started'] || 3);
            } else {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
          });

          const projectDoneCount = rawProjectTasks.filter(t => t.status === 'done' || t.completed).length;

          return (
            <div key={proj.id} className="glass-panel rounded-2xl border border-border/80 overflow-hidden transition-all shadow-xs">
              {/* Project Header Bar */}
              <div
                className="flex items-center justify-between p-4 bg-card/60 cursor-pointer hover:bg-card/90 transition-colors"
                onClick={() => onSetExpandedProjectId(isExpanded ? null : proj.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                  <h3 className="font-semibold text-foreground text-base tracking-tight">{proj.name}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border">
                    {projectDoneCount}/{rawProjectTasks.length} done
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(proj.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="text-muted-foreground p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Tasks Section */}
              {isExpanded && (
                <div className="p-4 bg-background/40 border-t border-border space-y-4">
                  {/* Sort Selector Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
                    <span className="text-muted-foreground font-medium">
                      Showing {sortedTasks.length} tasks
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" /> Sort:
                      </span>
                      <select
                        value={currentSort}
                        onChange={(e) => setSortBy({ ...sortBy, [proj.id]: e.target.value as any })}
                        className="bg-card border border-border text-foreground rounded-lg px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                        <option value="date">Date Created</option>
                      </select>
                    </div>
                  </div>

                  {/* Tasks Rows */}
                  <div className="max-h-105 overflow-y-auto space-y-2 pr-1">
                    {sortedTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">
                        No tasks match the selected criteria.
                      </p>
                    ) : (
                      (() => {
                        const limit = visibleListTaskCounts[proj.id] || 5;
                        const displayedTasks = sortedTasks.slice(0, limit);
                        const remainingCount = sortedTasks.length - displayedTasks.length;

                        return (
                          <>
                            {displayedTasks.map((task) => {
                              const statusCfg = STATUS_CONFIG[task.status || 'not_started'] || STATUS_CONFIG.not_started;
                              const priorityCfg = PRIORITY_CONFIG[task.priority || 'medium'] || PRIORITY_CONFIG.medium;
                              const StatusIcon = statusCfg.icon;

                              return (
                                <div
                                  key={task.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-card hover:bg-card/90 border border-border gap-2 transition-all group"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Quick Toggle Status Icon */}
                                    <button
                                      onClick={() => {
                                        const nextStatusMap: Record<TaskStatus, TaskStatus> = {
                                          not_started: 'next',
                                          next: 'in_progress',
                                          in_progress: 'done',
                                          done: 'not_started'
                                        };
                                        onUpdateStatus(task, nextStatusMap[task.status || 'not_started']);
                                      }}
                                      className="cursor-pointer shrink-0 transition-transform hover:scale-110"
                                      title={`Status: ${statusCfg.label} (Click to cycle)`}
                                    >
                                      <StatusIcon className={cn("w-4 h-4", statusCfg.colorClass)} />
                                    </button>

                                    {/* Inline Editable Task Name */}
                                    {editingTaskId === task.id ? (
                                      <div className="flex items-center gap-1 flex-1">
                                        <input
                                          type="text"
                                          value={editingTaskName}
                                          onChange={(e) => onSetEditingTaskName(e.target.value)}
                                          className="flex-1 bg-input border border-rose-500 text-foreground text-xs rounded-lg px-2 py-1 focus:outline-none"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => onSaveInlineTitle(task.id)}
                                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md cursor-pointer"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onSetEditingTaskId(null)}
                                          className="p-1 text-slate-400 hover:bg-slate-500/10 rounded-md cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span
                                        onClick={() => {
                                          onSetEditingTaskId(task.id);
                                          onSetEditingTaskName(task.name);
                                        }}
                                        className={cn(
                                          "text-sm font-medium transition-colors wrap-break-word flex-1 cursor-pointer hover:text-rose-400",
                                          task.status === 'done' ? "line-through text-muted-foreground" : "text-foreground"
                                        )}
                                        title="Click to edit title"
                                      >
                                        {task.name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Badges & Actions */}
                                  <div className="flex items-center gap-2 shrink-0 ml-7 sm:ml-0">
                                    {/* Direct Focus Launcher Button */}
                                    {onStartTaskFocus && task.status !== 'done' && (
                                      <button
                                        onClick={() => onStartTaskFocus(proj.id, task.id)}
                                        className="flex items-center gap-1 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                                        title="Start Focus Session"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>Focus</span>
                                      </button>
                                    )}

                                    {/* Priority Dropdown Selector */}
                                    <select
                                      value={task.priority || 'medium'}
                                      onChange={(e) => onUpdatePriority(task, e.target.value as TaskPriority)}
                                      className={cn(
                                        "px-2 py-0.5 rounded-lg border text-[11px] font-medium focus:outline-none cursor-pointer transition-colors",
                                        priorityCfg.badgeClass
                                      )}
                                      title="Change Priority"
                                    >
                                      <option value="urgent" className="bg-card text-foreground">Urgent</option>
                                      <option value="high" className="bg-card text-foreground">High</option>
                                      <option value="medium" className="bg-card text-foreground">Medium</option>
                                      <option value="low" className="bg-card text-foreground">Low</option>
                                    </select>

                                    {/* Status Dropdown Selector */}
                                    <select
                                      value={task.status || 'not_started'}
                                      onChange={(e) => onUpdateStatus(task, e.target.value as TaskStatus)}
                                      className={cn(
                                        "px-2 py-0.5 rounded-lg border text-[11px] font-medium focus:outline-none cursor-pointer transition-colors",
                                        statusCfg.badgeClass
                                      )}
                                      title="Change Status"
                                    >
                                      <option value="not_started" className="bg-card text-foreground">Not Started</option>
                                      <option value="next" className="bg-card text-foreground">Next</option>
                                      <option value="in_progress" className="bg-card text-foreground">In Progress</option>
                                      <option value="done" className="bg-card text-foreground">Done</option>
                                    </select>

                                    {/* Delete Task Button */}
                                    <button
                                      onClick={() => onDeleteTask(task.id)}
                                      className="p-1 text-muted-foreground hover:text-rose-400 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                                      title="Delete Task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Load More Button */}
                            {remainingCount > 0 && (
                              <button
                                onClick={() => setVisibleListTaskCounts({ ...visibleListTaskCounts, [proj.id]: limit + 5 })}
                                className="w-full py-2 rounded-xl bg-card hover:bg-card/80 border border-dashed border-border/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                              >
                                <span>Load More (+{remainingCount} remaining)</span>
                              </button>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>

                  {/* Add Task Input Form */}
                  <form onSubmit={(e) => onAddTask(proj.id, e)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/40">
                    <input
                      type="text"
                      value={newTaskNames[proj.id] || ''}
                      onChange={(e) => onSetNewTaskNames({ ...newTaskNames, [proj.id]: e.target.value })}
                      placeholder="Add a new task..."
                      className="flex-1 bg-input border border-border text-foreground rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex items-center gap-2">
                      {/* Initial Priority Selection */}
                      <select
                        value={newTaskPriorities[proj.id] || 'medium'}
                        onChange={(e) => onSetNewTaskPriorities({ ...newTaskPriorities, [proj.id]: e.target.value as TaskPriority })}
                        className="bg-card border border-border text-foreground rounded-xl px-2.5 py-2 text-xs focus:outline-none cursor-pointer"
                        title="Initial Priority"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Initial Status Selection */}
                      <select
                        value={newTaskStatuses[proj.id] || 'not_started'}
                        onChange={(e) => onSetNewTaskStatuses({ ...newTaskStatuses, [proj.id]: e.target.value as TaskStatus })}
                        className="bg-card border border-border text-foreground rounded-xl px-2.5 py-2 text-xs focus:outline-none cursor-pointer"
                        title="Initial Status"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="next">Next</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>

                      <button
                        type="submit"
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
