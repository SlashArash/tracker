import {
	ArrowRightCircle,
	CheckCircle2,
	Circle,
	Columns,
	Flame,
	FolderPlus,
	LayoutGrid,
	List,
	Plus,
} from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { db } from "../services/db";
import type {
	Project,
	Session,
	Task,
	TaskPriority,
	TaskStatus,
} from "../types";
import KanbanBoard from "./KanbanBoard";
import ProjectDashboardGrid from "./ProjectDashboardGrid";
import NewProjectModal from "./project/NewProjectModal";
import NewTaskModal from "./project/NewTaskModal";
import ProjectFilterBar from "./project/ProjectFilterBar";
import ProjectListView from "./project/ProjectListView";

export const COLOR_PALETTE = [
	"#ec4899", // Pink
	"#f43f5e", // Rose
	"#ef4444", // Red
	"#f97316", // Orange
	"#eab308", // Yellow
	"#10b981", // Emerald
	"#06b6d4", // Cyan
	"#3b82f6", // Blue
	"#6366f1", // Indigo
	"#8b5cf6", // Violet
];

export const STATUS_CONFIG: Record<
	TaskStatus,
	{
		label: string;
		icon: React.ElementType;
		colorClass: string;
		badgeClass: string;
	}
> = {
	not_started: {
		label: "Not Started",
		icon: Circle,
		colorClass: "text-slate-400",
		badgeClass:
			"bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20",
	},
	next: {
		label: "Next",
		icon: ArrowRightCircle,
		colorClass: "text-indigo-400",
		badgeClass:
			"bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25",
	},
	in_progress: {
		label: "In Progress",
		icon: Flame,
		colorClass: "text-amber-400",
		badgeClass:
			"bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25",
	},
	done: {
		label: "Done",
		icon: CheckCircle2,
		colorClass: "text-emerald-400",
		badgeClass:
			"bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25",
	},
};

export const PRIORITY_CONFIG: Record<
	TaskPriority,
	{ label: string; level: number; badgeClass: string }
> = {
	urgent: {
		label: "Urgent",
		level: 4,
		badgeClass: "bg-rose-500/15 border-rose-500/30 text-rose-400 font-semibold",
	},
	high: {
		label: "High",
		level: 3,
		badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
	},
	medium: {
		label: "Medium",
		level: 2,
		badgeClass: "bg-blue-500/15 border-blue-500/30 text-blue-400",
	},
	low: {
		label: "Low",
		level: 1,
		badgeClass: "bg-slate-500/10 border-slate-500/20 text-slate-400",
	},
};

export type ViewMode = "kanban" | "list" | "dashboard";

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
	onStartTaskFocus,
}: ProjectManagerProps) {
	const [viewMode, setViewMode] = useQueryState(
		"view",
		parseAsStringLiteral(["kanban", "list", "dashboard"] as const).withDefault(
			"kanban",
		),
	);

	// New Project Form State
	const [newProjectName, setNewProjectName] = useState("");
	const [newProjectColor, setNewProjectColor] = useState(COLOR_PALETTE[0]);
	const [isCreatingProject, setIsCreatingProject] = useState(false);
	const [isCreatingTask, setIsCreatingTask] = useState(false);
	const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
		null,
	);

	// Global Command Center State persisted in URL search params via nuqs
	const [searchQuery, setSearchQuery] = useQueryState(
		"q",
		parseAsString.withDefault(""),
	);
	const [selectedProjectFilter, setSelectedProjectFilter] = useQueryState(
		"project",
		parseAsString.withDefault("all"),
	);
	const [selectedStatusFilter, setSelectedStatusFilter] = useQueryState(
		"status",
		parseAsStringLiteral([
			"all",
			"not_started",
			"next",
			"in_progress",
			"done",
		] as const).withDefault("all"),
	);
	const [selectedPriorityFilter, setSelectedPriorityFilter] = useQueryState(
		"priority",
		parseAsStringLiteral([
			"all",
			"urgent",
			"high",
			"medium",
			"low",
		] as const).withDefault("all"),
	);

	// New task form state per project in list view
	const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
	const [newTaskStatuses, setNewTaskStatuses] = useState<
		Record<string, TaskStatus>
	>({});
	const [newTaskPriorities, setNewTaskPriorities] = useState<
		Record<string, TaskPriority>
	>({});

	// Inline Title Editing state
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingTaskName, setEditingTaskName] = useState("");

	const handleAddProject = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim()) return;

		const projectId = `proj_${Date.now()}`;
		await db.projects.add({
			id: projectId,
			name: newProjectName.trim(),
			color: newProjectColor,
			createdAt: new Date().toISOString(),
		});

		setNewProjectName("");
		setIsCreatingProject(false);
		setExpandedProjectId(projectId);
		onRefresh();
	};

	const handleCreateTaskFromModal = async (taskData: {
		name: string;
		projectId: string;
		status: TaskStatus;
		priority: TaskPriority;
		description?: string;
	}) => {
		await db.tasks.add({
			id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			projectId: taskData.projectId,
			name: taskData.name,
			status: taskData.status,
			priority: taskData.priority,
			description: taskData.description,
			completed: taskData.status === "done",
			createdAt: new Date().toISOString(),
		});

		setIsCreatingTask(false);
		onRefresh();
	};

	const handleDeleteProject = async (projectId: string) => {
		if (!window.confirm("Delete this project and all its tasks?")) return;
		await db.projects.delete(projectId);
		const projectTasks = tasks.filter((t) => t.projectId === projectId);
		for (const t of projectTasks) {
			await db.tasks.delete(t.id);
		}
		onRefresh();
	};

	const handleAddTask = async (projectId: string, e: React.FormEvent) => {
		e.preventDefault();
		const taskName = newTaskNames[projectId];
		if (!taskName?.trim()) return;

		const status = newTaskStatuses[projectId] || "not_started";
		const priority = newTaskPriorities[projectId] || "medium";

		await db.tasks.add({
			id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			projectId,
			name: taskName.trim(),
			status,
			priority,
			completed: status === "done",
			createdAt: new Date().toISOString(),
		});

		setNewTaskNames({ ...newTaskNames, [projectId]: "" });
		onRefresh();
	};

	const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
		const isCompleted = newStatus === "done";
		await db.tasks.update(task.id, {
			status: newStatus,
			completed: isCompleted,
		});
		onRefresh();
	};

	const handleUpdatePriority = async (
		task: Task,
		newPriority: TaskPriority,
	) => {
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
		const doneTasks = tasks.filter((t) => t.status === "done" || t.completed);
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
		if (selectedProjectFilter === "uncategorized") {
			if (t.projectId) return false;
		} else if (
			selectedProjectFilter !== "all" &&
			t.projectId !== selectedProjectFilter
		) {
			return false;
		}
		if (selectedStatusFilter !== "all" && t.status !== selectedStatusFilter)
			return false;
		if (
			selectedPriorityFilter !== "all" &&
			t.priority !== selectedPriorityFilter
		)
			return false;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			const nameMatches = t.name.toLowerCase().includes(q);
			const descMatches = t.description?.toLowerCase().includes(q);
			if (!nameMatches && !descMatches) return false;
		}
		return true;
	});

	const completedCount = tasks.filter(
		(t) => t.status === "done" || t.completed,
	).length;

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
						Organize work streams, assign priorities, and jump directly into
						focus sessions
					</p>
				</div>

				<div className="flex items-center gap-3">
					{/* View Mode Toggle Pill Bar */}
					<div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card shadow-sm">
						<button
							onClick={() => setViewMode("kanban")}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
								viewMode === "kanban"
									? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
									: "text-muted-foreground hover:text-foreground hover:bg-accent",
							)}
							title="Kanban Board View"
						>
							<Columns className="w-3.5 h-3.5" />
							<span>Board</span>
						</button>

						<button
							onClick={() => setViewMode("list")}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
								viewMode === "list"
									? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
									: "text-muted-foreground hover:text-foreground hover:bg-accent",
							)}
							title="Interactive List View"
						>
							<List className="w-3.5 h-3.5" />
							<span>List</span>
						</button>

						<button
							onClick={() => setViewMode("dashboard")}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
								viewMode === "dashboard"
									? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
									: "text-muted-foreground hover:text-foreground hover:bg-accent",
							)}
							title="Project Dashboard Overview"
						>
							<LayoutGrid className="w-3.5 h-3.5" />
							<span>Dashboard</span>
						</button>
					</div>

					<button
						onClick={() => setIsCreatingTask(!isCreatingTask)}
						className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer shrink-0"
					>
						<Plus className="w-4 h-4" />
						<span className="hidden sm:inline">New Task</span>
					</button>

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
			<ProjectFilterBar
				searchQuery={searchQuery}
				onSearchChange={(q) => setSearchQuery(q)}
				selectedProjectFilter={selectedProjectFilter}
				onProjectFilterChange={(p) => setSelectedProjectFilter(p)}
				selectedStatusFilter={selectedStatusFilter}
				onStatusFilterChange={(s) => setSelectedStatusFilter(s)}
				selectedPriorityFilter={selectedPriorityFilter}
				onPriorityFilterChange={(pr) => setSelectedPriorityFilter(pr)}
				projects={projects}
				completedCount={completedCount}
				onClearCompleted={handleClearCompletedTasks}
			/>

			{/* New Task Form Overlay */}
			{isCreatingTask && (
				<NewTaskModal
					projects={projects}
					defaultProjectId={selectedProjectFilter}
					onSubmit={handleCreateTaskFromModal}
					onCancel={() => setIsCreatingTask(false)}
				/>
			)}

			{/* New Project Form Overlay */}
			{isCreatingProject && (
				<NewProjectModal
					newProjectName={newProjectName}
					onNameChange={(name) => setNewProjectName(name)}
					newProjectColor={newProjectColor}
					onColorChange={(color) => setNewProjectColor(color)}
					onSubmit={handleAddProject}
					onCancel={() => setIsCreatingProject(false)}
				/>
			)}

			{/* Render View Mode Content */}
			{viewMode === "kanban" && (
				<KanbanBoard
					projects={projects}
					tasks={filteredTasks}
					sessions={sessions}
					onRefresh={onRefresh}
					onStartTaskFocus={onStartTaskFocus}
					selectedProjectFilter={selectedProjectFilter}
				/>
			)}

			{viewMode === "dashboard" && (
				<ProjectDashboardGrid
					projects={projects}
					tasks={filteredTasks}
					sessions={sessions}
					onRefresh={onRefresh}
					onSelectProjectFilter={(projId) => {
						setSelectedProjectFilter(projId);
						setViewMode("kanban");
					}}
					onStartProjectFocus={(projId) => {
						if (onStartTaskFocus) onStartTaskFocus(projId);
					}}
					onOpenCreateProject={() => setIsCreatingProject(true)}
				/>
			)}

			{viewMode === "list" && (
				<ProjectListView
					projects={projects}
					tasks={filteredTasks}
					selectedProjectFilter={selectedProjectFilter}
					expandedProjectId={expandedProjectId}
					onSetExpandedProjectId={(id) => setExpandedProjectId(id)}
					onDeleteProject={handleDeleteProject}
					onAddTask={handleAddTask}
					onUpdateStatus={handleUpdateStatus}
					onUpdatePriority={handleUpdatePriority}
					onDeleteTask={handleDeleteTask}
					onSaveInlineTitle={handleSaveInlineTitle}
					editingTaskId={editingTaskId}
					editingTaskName={editingTaskName}
					onSetEditingTaskId={(id) => setEditingTaskId(id)}
					onSetEditingTaskName={(name) => setEditingTaskName(name)}
					newTaskNames={newTaskNames}
					onSetNewTaskNames={(names) => setNewTaskNames(names)}
					newTaskStatuses={newTaskStatuses}
					onSetNewTaskStatuses={(statuses) => setNewTaskStatuses(statuses)}
					newTaskPriorities={newTaskPriorities}
					onSetNewTaskPriorities={(priorities) =>
						setNewTaskPriorities(priorities)
					}
					onStartTaskFocus={onStartTaskFocus}
				/>
			)}
		</div>
	);
}
