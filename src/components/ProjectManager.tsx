import React, { useState } from 'react';
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FolderPlus,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  Flame,
  Filter,
  ArrowUpDown,
  Search,
  LayoutGrid,
  List,
  Columns,
  Play,
  Edit3,
  X,
  Sparkles,
  Clock,
  RotateCcw
} from 'lucide-react';
import { db } from '../services/db';
import { Project, Task, TaskStatus, TaskPriority, Session } from '../types';
import { cn } from '../lib/utils';
import KanbanBoard from './KanbanBoard';
import ProjectDashboardGrid from './ProjectDashboardGrid';

const COLOR_PALETTE = [
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
];

export const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; colorClass: string; badgeClass: string }> = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    colorClass: 'text-slate-400',
    badgeClass: 'bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20'
  },
  next: {
    label: 'Next',
    icon: ArrowRightCircle,
    colorClass: 'text-indigo-400',
    badgeClass: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25'
  },
  in_progress: {
    label: 'In Progress',
    icon: Flame,
    colorClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    colorClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
  }
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; level: number; badgeClass: string }> = {
  urgent: {
    label: 'Urgent',
    level: 4,
    badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-semibold'
  },
  high: {
    label: 'High',
    level: 3,
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
  },
  medium: {
    label: 'Medium',
    level: 2,
    badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400'
  },
  low: {
    label: 'Low',
    level: 1,
    badgeClass: 'bg-slate-500/10 border-slate-500/20 text-slate-400'
  }
};

export type ViewMode = 'kanban' | 'list' | 'dashboard';

export interface ProjectManagerProps {
  projects?: Project[];
  tasks?: Task[];
  sessions?: Session[];
  onRefresh: () => void;
  onStartTaskFocus?: (projectId: string, taskId?: string) => void;
}

export default function ProjectManager({
  projects = [],
  tasks = [],
  sessions = [],
  onRefresh,
  onStartTaskFocus
}: ProjectManagerProps) {
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsStringLiteral(['kanban', 'list', 'dashboard'] as const).withDefault('kanban')
  );

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(COLOR_PALETTE[0]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Global Command Center State persisted in URL search params via nuqs
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [selectedProjectFilter, setSelectedProjectFilter] = useQueryState('project', parseAsString.withDefault('all'));
  const [selectedStatusFilter, setSelectedStatusFilter] = useQueryState(
    'status',
    parseAsStringLiteral(['all', 'not_started', 'next', 'in_progress', 'done'] as const).withDefault('all')
  );
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useQueryState(
    'priority',
    parseAsStringLiteral(['all', 'urgent', 'high', 'medium', 'low'] as const).withDefault('all')
  );

  // New task form state per project in list view
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [newTaskStatuses, setNewTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [newTaskPriorities, setNewTaskPriorities] = useState<Record<string, TaskPriority>>({});

  // Inline Title Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');

  // Sort state per project in list view
  const [sortBy, setSortBy] = useState<Record<string, 'priority' | 'status' | 'date'>>({});

  // Visible task limit for pagination in list view (default 5)
  const [visibleListTaskCounts, setVisibleListTaskCounts] = useState<Record<string, number>>({});

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const projectId = 'proj_' + Date.now();
    await db.projects.add({
      id: projectId,
      name: newProjectName.trim(),
      color: newProjectColor,
      createdAt: new Date().toISOString()
    });

    setNewProjectName('');
    setIsCreatingProject(false);
    setExpandedProjectId(projectId);
    onRefresh();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await db.projects.delete(projectId);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    for (const t of projectTasks) {
      await db.tasks.delete(t.id);
    }
    onRefresh();
  };

  const handleAddTask = async (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    const taskName = newTaskNames[projectId];
    if (!taskName || !taskName.trim()) return;

    const status = newTaskStatuses[projectId] || 'not_started';
    const priority = newTaskPriorities[projectId] || 'medium';

    await db.tasks.add({
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      projectId,
      name: taskName.trim(),
      status,
      priority,
      completed: status === 'done',
      createdAt: new Date().toISOString()
    });

    setNewTaskNames({ ...newTaskNames, [projectId]: '' });
    onRefresh();
  };

  const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
    const isCompleted = newStatus === 'done';
    await db.tasks.update(task.id, {
      status: newStatus,
      completed: isCompleted
    });
    onRefresh();
  };

  const handleUpdatePriority = async (task: Task, newPriority: TaskPriority) => {
    await db.tasks.update(task.id, { priority: newPriority });
    onRefresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId);
    onRefresh();
  };

  const handleSaveInlineTitle = async (taskId: string) => {
    if (editingTaskName.trim()) {
      await db.tasks.update(taskId, { name: editingTaskName.trim() });
      onRefresh();
    }
    setEditingTaskId(null);
  };

  const handleClearCompletedTasks = async () => {
    const doneTasks = tasks.filter(t => t.status === 'done' || t.completed);
    if (doneTasks.length === 0) return;

    if (window.confirm(`Clear ${doneTasks.length} completed tasks?`)) {
      for (const t of doneTasks) {
        await db.tasks.delete(t.id);
      }
      onRefresh();
    }
  };

  // Global filtering logic across tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectFilter !== 'all' && t.projectId !== selectedProjectFilter) return false;
    if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
    if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatches = t.name.toLowerCase().includes(q);
      const descMatches = t.description?.toLowerCase().includes(q);
      if (!nameMatches && !descMatches) return false;
    }
    return true;
  });

  const completedCount = tasks.filter(t => t.status === 'done' || t.completed).length;

  return (
    <div className="w-full max-w-6xl mx-auto py-2 space-y-6">
      {/* Top Header Bar & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-heading flex items-center gap-2">
            <span>Projects & Tasks</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {tasks.length} total tasks
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize work streams, assign priorities, and jump directly into focus sessions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle Pill Bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === 'kanban'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title="Kanban Board View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === 'list'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title="Interactive List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            <button
              onClick={() => setViewMode('dashboard')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === 'dashboard'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title="Project Dashboard Overview"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="flex items-center gap-2 bg-linear-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* Global Command Center: Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-3.5 border border-border/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Instant Search Bar */}
        <div className="relative flex-1 min-w-50">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -rotate-0 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by name or notes..."
            className="w-full pl-9 pr-8 py-2 bg-input/60 border border-border focus:border-rose-500 text-foreground rounded-xl text-xs focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="bg-card border border-border text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="bg-card border border-border text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="next">Next Up</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value as any)}
            className="bg-card border border-border text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear Done Tasks Button */}
          {completedCount > 0 && (
            <button
              onClick={handleClearCompletedTasks}
              className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Clear all completed tasks"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Done ({completedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* New Project Form Overlay */}
      {isCreatingProject && (
        <form onSubmit={handleAddProject} className="glass-card rounded-2xl p-5 border border-border space-y-4 text-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-foreground">Create New Project</h3>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Website Redesign, Mobile App, Research"
              className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Badge Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewProjectColor(color)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center",
                    newProjectColor === color ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {newProjectColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-accent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
            >
              Save Project
            </button>
          </div>
        </form>
      )}

      {/* Render View Mode Content */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          projects={projects}
          tasks={filteredTasks}
          sessions={sessions}
          onRefresh={onRefresh}
          onStartTaskFocus={onStartTaskFocus}
        />
      )}

      {viewMode === 'dashboard' && (
        <ProjectDashboardGrid
          projects={projects}
          tasks={filteredTasks}
          sessions={sessions}
          onRefresh={onRefresh}
          onSelectProjectFilter={(projId) => {
            setSelectedProjectFilter(projId);
            setViewMode('kanban');
          }}
          onStartProjectFocus={(projId) => {
            if (onStartTaskFocus) onStartTaskFocus(projId);
          }}
          onOpenCreateProject={() => setIsCreatingProject(true)}
        />
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
              No projects created yet. Click <span className="text-foreground font-medium">"New Project"</span> to get started.
            </div>
          ) : (
            projects
              .filter(p => selectedProjectFilter === 'all' || p.id === selectedProjectFilter)
              .map((proj) => {
                const rawProjectTasks = filteredTasks.filter((t) => t.projectId === proj.id);
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
                      onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
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
                            handleDeleteProject(proj.id);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-muted-foreground p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Tasks Table Section */}
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

                        {/* Tasks Rows with Height Limit & Vertical Scroll */}
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
                                              handleUpdateStatus(task, nextStatusMap[task.status || 'not_started']);
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
                                                onChange={(e) => setEditingTaskName(e.target.value)}
                                                className="flex-1 bg-input border border-rose-500 text-foreground text-xs rounded-lg px-2 py-1 focus:outline-none"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => handleSaveInlineTitle(task.id)}
                                                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => setEditingTaskId(null)}
                                                className="p-1 text-slate-400 hover:bg-slate-500/10 rounded-md"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span
                                              onClick={() => {
                                                setEditingTaskId(task.id);
                                                setEditingTaskName(task.name);
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
                                            onChange={(e) => handleUpdatePriority(task, e.target.value as TaskPriority)}
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
                                            onChange={(e) => handleUpdateStatus(task, e.target.value as TaskStatus)}
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
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1 text-muted-foreground hover:text-rose-400 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
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
                        <form onSubmit={(e) => handleAddTask(proj.id, e)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/40">
                          <input
                            type="text"
                            value={newTaskNames[proj.id] || ''}
                            onChange={(e) => setNewTaskNames({ ...newTaskNames, [proj.id]: e.target.value })}
                            placeholder="Add a new task..."
                            className="flex-1 bg-input border border-border text-foreground rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                          />

                          <div className="flex items-center gap-2">
                            {/* Initial Priority Selection */}
                            <select
                              value={newTaskPriorities[proj.id] || 'medium'}
                              onChange={(e) => setNewTaskPriorities({ ...newTaskPriorities, [proj.id]: e.target.value as TaskPriority })}
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
                              onChange={(e) => setNewTaskStatuses({ ...newTaskStatuses, [proj.id]: e.target.value as TaskStatus })}
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
              })
          )}
        </div>
      )}
    </div>
  );
}
