import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, FolderPlus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../services/db';
import { Project, Task } from '../types';
import { cn } from '../lib/utils';

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

export interface ProjectManagerProps {
  projects?: Project[];
  tasks?: Task[];
  onRefresh: () => void;
}

export default function ProjectManager({ projects = [], tasks = [], onRefresh }: ProjectManagerProps) {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(COLOR_PALETTE[0]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});

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

    await db.tasks.add({
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      projectId,
      name: taskName.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    });

    setNewTaskNames({ ...newTaskNames, [projectId]: '' });
    onRefresh();
  };

  const handleToggleTask = async (task: Task) => {
    await db.tasks.update(task.id, { completed: !task.completed });
    onRefresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId);
    onRefresh();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-6">
      {/* Header & Add Project Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Projects & Tasks</h2>
          <p className="text-xs text-muted-foreground">Organize your work streams and task lists</p>
        </div>

        <button
          onClick={() => setIsCreatingProject(!isCreatingProject)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Form */}
      {isCreatingProject && (
        <form onSubmit={handleAddProject} className="glass-card rounded-2xl p-5 border border-border space-y-4 text-foreground">
          <h3 className="text-sm font-semibold text-foreground">Create New Project</h3>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Website Redesign, Client Presentation"
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

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
            No projects created yet. Click <span className="text-foreground font-medium">"New Project"</span> to get started.
          </div>
        ) : (
          projects.map((proj) => {
            const projectTasks = tasks.filter((t) => t.projectId === proj.id);
            const isExpanded = expandedProjectId === proj.id || projects.length === 1;

            return (
              <div key={proj.id} className="glass-panel rounded-2xl border border-border overflow-hidden transition-all">
                {/* Project Header Bar */}
                <div
                  className="flex items-center justify-between p-4 bg-card/60 cursor-pointer hover:bg-card/90 transition-colors"
                  onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                    <h3 className="font-semibold text-foreground text-base">{proj.name}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border">
                      {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
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

                {/* Expanded Tasks Section */}
                {isExpanded && (
                  <div className="p-4 bg-background/40 border-t border-border space-y-4">
                    {/* Tasks list */}
                    <div className="space-y-2">
                      {projectTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">No tasks in this project yet.</p>
                      ) : (
                        projectTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-card hover:bg-accent border border-border transition-all group"
                          >
                            <button
                              onClick={() => handleToggleTask(task)}
                              className="flex items-center gap-3 text-left w-full cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
                              )}
                              <span className={cn(
                                "text-sm",
                                task.completed ? "line-through text-muted-foreground" : "text-foreground"
                              )}>
                                {task.name}
                              </span>
                            </button>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-muted-foreground hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Task Input */}
                    <form onSubmit={(e) => handleAddTask(proj.id, e)} className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newTaskNames[proj.id] || ''}
                        onChange={(e) => setNewTaskNames({ ...newTaskNames, [proj.id]: e.target.value })}
                        placeholder="Add a new task..."
                        className="flex-1 bg-input border border-border text-foreground rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="bg-muted hover:bg-accent text-foreground px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-border"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
