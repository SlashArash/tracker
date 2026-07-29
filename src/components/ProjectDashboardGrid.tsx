import {
	ArrowRight,
	Check,
	FolderPlus,
	Play,
	Plus,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { db } from "../services/db";
import type { Project, Session, Task } from "../types";

export interface ProjectDashboardGridProps {
	projects: Project[];
	tasks: Task[];
	sessions?: Session[];
	onRefresh: () => void;
	onSelectProjectFilter?: (projectId: string) => void;
	onStartProjectFocus?: (projectId: string) => void;
	onOpenCreateProject?: () => void;
}

const COLOR_PALETTE = [
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

export default function ProjectDashboardGrid({
	projects,
	tasks,
	sessions = [],
	onRefresh,
	onSelectProjectFilter,
	onStartProjectFocus,
	onOpenCreateProject,
}: ProjectDashboardGridProps) {
	const [editingColorProjectId, setEditingColorProjectId] = useState<
		string | null
	>(null);

	// Quick Add Task Form per project grid card
	const [quickTaskTitle, setQuickTaskTitle] = useState<Record<string, string>>(
		{},
	);

	const handleUpdateProjectColor = async (
		projectId: string,
		newColor: string,
	) => {
		await db.projects.update(projectId, { color: newColor });
		setEditingColorProjectId(null);
		onRefresh();
	};

	const handleDeleteProject = async (projectId: string) => {
		if (!window.confirm("Delete this project and all its associated tasks?"))
			return;
		await db.projects.delete(projectId);
		const projectTasks = tasks.filter((t) => t.projectId === projectId);
		for (const t of projectTasks) {
			await db.tasks.delete(t.id);
		}
		onRefresh();
	};

	const handleAddQuickTask = async (projectId: string, e: React.FormEvent) => {
		e.preventDefault();
		const title = quickTaskTitle[projectId];
		if (!title?.trim()) return;

		await db.tasks.add({
			id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			projectId,
			name: title.trim(),
			status: "next",
			priority: "medium",
			completed: false,
			createdAt: new Date().toISOString(),
		});

		setQuickTaskTitle({ ...quickTaskTitle, [projectId]: "" });
		onRefresh();
	};

	// Helper to format total focus seconds into readable hours/minutes
	const getProjectFocusStats = (projectId: string) => {
		const projSessions = sessions.filter(
			(s) =>
				(projectId ? s.projectId === projectId : !s.projectId) &&
				(s.mode === "work" || s.mode === ("stopwatch" as any)),
		);
		const totalSeconds = projSessions.reduce(
			(acc, curr) => acc + (curr.durationSeconds || 0),
			0,
		);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);

		return {
			sessionCount: projSessions.length,
			totalSeconds,
			formattedTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
		};
	};

	const uncategorizedTasks = tasks.filter(
		(t) => !t.projectId || t.projectId === "",
	);
	const uncategorizedProject: Project = {
		id: "",
		name: "Uncategorized Tasks",
		color: "#94a3b8",
		createdAt: new Date().toISOString(),
	};

	const displayGridProjects = [...projects];
	if (uncategorizedTasks.length > 0 || projects.length === 0) {
		displayGridProjects.push(uncategorizedProject);
	}

	return (
		<div className="space-y-6">
			{/* Grid Header Actions */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-base font-bold text-foreground tracking-tight">
						Project Overview Dashboard
					</h3>
					<p className="text-xs text-muted-foreground">
						High-level status, metrics, and progress tracking across projects
					</p>
				</div>

				{onOpenCreateProject && (
					<button
						onClick={onOpenCreateProject}
						className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer"
					>
						<FolderPlus className="w-4 h-4" />
						<span>New Project</span>
					</button>
				)}
			</div>

			{displayGridProjects.length === 0 ? (
				<div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground text-sm space-y-3">
					<p>No projects created yet.</p>
					{onOpenCreateProject && (
						<button
							onClick={onOpenCreateProject}
							className="inline-flex items-center gap-2 bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors shadow-md"
						>
							<Plus className="w-4 h-4" />
							<span>Create Your First Project</span>
						</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{displayGridProjects.map((proj) => {
						const projTasks =
							proj.id === ""
								? uncategorizedTasks
								: tasks.filter((t) => t.projectId === proj.id);
						const doneTasks = projTasks.filter(
							(t) => t.status === "done" || t.completed,
						);
						const inProgressTasks = projTasks.filter(
							(t) => t.status === "in_progress",
						);
						const nextTasks = projTasks.filter((t) => t.status === "next");

						const completionRate =
							projTasks.length > 0
								? Math.round((doneTasks.length / projTasks.length) * 100)
								: 0;
						const stats = getProjectFocusStats(proj.id);
						const isEditingColor = editingColorProjectId === proj.id;

						return (
							<div
								key={proj.id || "uncategorized"}
								className="glass-panel rounded-2xl border border-border/80 p-5 bg-card/60 backdrop-blur-md transition-all hover:border-border hover:shadow-lg flex flex-col justify-between space-y-4 group"
							>
								{/* Top Bar: Color, Title & Delete */}
								<div>
									<div className="flex items-center justify-between gap-3 mb-3">
										<div className="flex items-center gap-2.5 min-w-0">
											{/* Interactive Color Badge */}
											<button
												onClick={() =>
													proj.id &&
													setEditingColorProjectId(
														isEditingColor ? null : proj.id,
													)
												}
												className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-125 cursor-pointer ring-2 ring-white/20"
												style={{ backgroundColor: proj.color }}
												title={
													proj.id
														? "Click to customize badge color"
														: "Uncategorized"
												}
											/>
											<h4 className="font-bold text-base text-foreground tracking-tight truncate">
												{proj.name}
											</h4>
										</div>

										{proj.id && (
											<button
												onClick={() => handleDeleteProject(proj.id)}
												className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
												title="Delete Project"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>

									{/* Palette Selector Popover */}
									{isEditingColor && (
										<div className="mb-4 p-2.5 bg-card border border-border rounded-xl flex flex-wrap gap-1.5 animate-in fade-in zoom-in-95 duration-150">
											{COLOR_PALETTE.map((c) => (
												<button
													key={c}
													type="button"
													onClick={() => handleUpdateProjectColor(proj.id, c)}
													className={cn(
														"w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center",
														proj.color === c
															? "scale-110 ring-2 ring-white"
															: "opacity-70 hover:opacity-100",
													)}
													style={{ backgroundColor: c }}
												>
													{proj.color === c && (
														<Check className="w-3 h-3 text-white" />
													)}
												</button>
											))}
										</div>
									)}

									{/* Progress Bar & Percentage */}
									<div className="space-y-1.5">
										<div className="flex items-center justify-between text-xs font-semibold">
											<span className="text-muted-foreground">
												Completion Rate
											</span>
											<span className="text-foreground font-mono">
												{completionRate}%
											</span>
										</div>

										<div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/50">
											<div
												className="h-full rounded-full transition-all duration-500"
												style={{
													width: `${completionRate}%`,
													backgroundColor: proj.color,
												}}
											/>
										</div>
									</div>
								</div>

								{/* Metrics Badges */}
								<div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-center">
									<div className="p-2 rounded-xl bg-card border border-border/40">
										<span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
											Done
										</span>
										<span className="text-sm font-bold text-emerald-400 font-mono">
											{doneTasks.length}/{projTasks.length}
										</span>
									</div>

									<div className="p-2 rounded-xl bg-card border border-border/40">
										<span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
											Active
										</span>
										<span className="text-sm font-bold text-amber-400 font-mono">
											{inProgressTasks.length + nextTasks.length}
										</span>
									</div>

									<div className="p-2 rounded-xl bg-card border border-border/40">
										<span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
											Logged
										</span>
										<span className="text-sm font-bold text-indigo-400 font-mono">
											{stats.formattedTime}
										</span>
									</div>
								</div>

								{/* Quick Add Task Input Form */}
								<form
									onSubmit={(e) => handleAddQuickTask(proj.id, e)}
									className="flex items-center gap-1.5"
								>
									<input
										type="text"
										value={quickTaskTitle[proj.id] || ""}
										onChange={(e) =>
											setQuickTaskTitle({
												...quickTaskTitle,
												[proj.id]: e.target.value,
											})
										}
										placeholder="Add task to project..."
										className="flex-1 bg-input border border-border text-foreground rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
									/>
									<button
										type="submit"
										className="p-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
										title="Add Task"
									>
										<Plus className="w-4 h-4" />
									</button>
								</form>

								{/* Bottom Actions */}
								<div className="flex items-center justify-between pt-1 text-xs">
									{onSelectProjectFilter && (
										<button
											onClick={() => onSelectProjectFilter(proj.id)}
											className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors cursor-pointer"
										>
											<span>View Tasks</span>
											<ArrowRight className="w-3.5 h-3.5" />
										</button>
									)}

									{onStartProjectFocus && (
										<button
											onClick={() => onStartProjectFocus(proj.id)}
											className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-xl font-semibold transition-all shadow-xs cursor-pointer ml-auto"
										>
											<Play className="w-3 h-3 fill-current" />
											<span>Start Focus</span>
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
