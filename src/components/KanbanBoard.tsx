import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { db } from "../services/db";
import type {
	Project,
	Session,
	Task,
	TaskPriority,
	TaskStatus,
} from "../types";
import { STATUS_CONFIG } from "./ProjectManager";
import { KanbanTaskCard } from "./project/KanbanTaskCard";

export interface KanbanBoardProps {
	projects: Project[];
	tasks: Task[];
	sessions?: Session[];
	selectedProjectFilter?: string;
	onRefresh: () => void;
	onStartTaskFocus?: (projectId: string, taskId: string) => void;
}

const KANBAN_COLUMNS: {
	status: TaskStatus;
	label: string;
	bgHeader: string;
	borderHeader: string;
}[] = [
	{
		status: "not_started",
		label: "Not Started",
		bgHeader: "bg-slate-500/10 text-slate-400",
		borderHeader: "border-slate-500/30",
	},
	{
		status: "next",
		label: "Next Up",
		bgHeader: "bg-indigo-500/15 text-indigo-400",
		borderHeader: "border-indigo-500/30",
	},
	{
		status: "in_progress",
		label: "In Progress",
		bgHeader: "bg-amber-500/15 text-amber-400",
		borderHeader: "border-amber-500/30",
	},
	{
		status: "done",
		label: "Completed",
		bgHeader: "bg-emerald-500/15 text-emerald-400",
		borderHeader: "border-emerald-500/30",
	},
];

export default function KanbanBoard({
	projects,
	tasks,
	sessions = [],
	selectedProjectFilter = "all",
	onRefresh,
	onStartTaskFocus,
}: KanbanBoardProps) {
	// Determine active default project based on filter
	const activeDefaultProject =
		selectedProjectFilter &&
		selectedProjectFilter !== "all" &&
		selectedProjectFilter !== "uncategorized"
			? selectedProjectFilter
			: "";

	// Column-specific new task input state
	const [columnInput, setColumnInput] = useState<Record<TaskStatus, string>>({
		not_started: "",
		next: "",
		in_progress: "",
		done: "",
	});
	const [columnSelectedProject, setColumnSelectedProject] = useState<
		Record<TaskStatus, string>
	>({
		not_started: activeDefaultProject,
		next: activeDefaultProject,
		in_progress: activeDefaultProject,
		done: activeDefaultProject,
	});

	// Sync column project selection whenever active filter changes
	useEffect(() => {
		setColumnSelectedProject({
			not_started: activeDefaultProject,
			next: activeDefaultProject,
			in_progress: activeDefaultProject,
			done: activeDefaultProject,
		});
	}, [activeDefaultProject]);

	const [showAddForm, setShowAddForm] = useState<Record<TaskStatus, boolean>>({
		not_started: false,
		next: false,
		in_progress: false,
		done: false,
	});

	// Column visible item counts for pagination (default 5)
	const [visibleCounts, setVisibleCounts] = useState<
		Record<TaskStatus, number>
	>({
		not_started: 5,
		next: 5,
		in_progress: 5,
		done: 5,
	});

	// Inline Task Edit State
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState<string>("");

	// Expandable task notes state
	const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
	const [editingNote, setEditingNote] = useState<string>("");

	// Calculate completed pomodoros per task
	const getTaskPomodoroCount = (taskId: string): number => {
		return sessions.filter(
			(s) =>
				s.taskId === taskId &&
				(s.mode === "work" || s.mode === ("stopwatch" as any)),
		).length;
	};

	const handleQuickAddTask = async (status: TaskStatus, e: React.FormEvent) => {
		e.preventDefault();
		const taskName = columnInput[status];
		if (!taskName?.trim()) return;

		const projectId =
			columnSelectedProject[status] !== undefined
				? columnSelectedProject[status]
				: activeDefaultProject;

		await db.tasks.add({
			id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
			projectId,
			name: taskName.trim(),
			status,
			priority: status === "in_progress" ? "high" : "medium",
			completed: status === "done",
			estimatedPomodoros: 1,
			createdAt: new Date().toISOString(),
		});

		setColumnInput({ ...columnInput, [status]: "" });
		setShowAddForm({ ...showAddForm, [status]: false });
		onRefresh();
	};

	const handleMoveTaskStatus = async (task: Task) => {
		const taskStatus = (task.status || "not_started") as TaskStatus;
		const nextMap: Record<TaskStatus, TaskStatus> = {
			not_started: "next",
			next: "in_progress",
			in_progress: "done",
			done: "not_started",
		};
		const newStatus = nextMap[taskStatus];

		await db.tasks.update(task.id, {
			status: newStatus,
			completed: newStatus === "done",
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

	const handleStartEditing = (task: Task) => {
		setEditingTaskId(task.id);
		setEditingName(task.name);
	};

	const handleSaveEditing = async (taskId: string) => {
		if (editingName.trim()) {
			await db.tasks.update(taskId, { name: editingName.trim() });
			onRefresh();
		}
		setEditingTaskId(null);
	};

	const handleSaveNote = async (taskId: string) => {
		await db.tasks.update(taskId, { description: editingNote });
		setEditingNote("");
		onRefresh();
	};

	const handleToggleExpand = (task: Task) => {
		const isExpanded = expandedTaskId === task.id;
		setExpandedTaskId(isExpanded ? null : task.id);
		setEditingNote(task.description || "");
	};

	const handleDragEnd = async (result: DropResult) => {
		const { destination, source, draggableId } = result;

		if (!destination) return;

		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		) {
			return;
		}

		const newStatus = destination.droppableId as TaskStatus;

		await db.tasks.update(draggableId, {
			status: newStatus,
			completed: newStatus === "done",
		});

		onRefresh();
	};

	const projectMap = React.useMemo(() => {
		const map = new Map<string, Project>();
		projects.forEach((p) => {
			map.set(p.id, p);
		});
		return map;
	}, [projects]);

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<div className="w-full space-y-4">
				{/* Board Columns Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
					{KANBAN_COLUMNS.map((col) => {
						const colTasks = tasks.filter(
							(t) => (t.status || "not_started") === col.status,
						);
						const statusCfg = STATUS_CONFIG[col.status];
						const StatusIcon = statusCfg.icon;

						return (
							<div
								key={col.status}
								className="glass-panel rounded-2xl border border-border/80 p-3.5 flex flex-col min-h-156 bg-card/40 backdrop-blur-md transition-all shadow-sm"
							>
								{/* Column Header */}
								<div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"p-1.5 rounded-lg border",
												col.bgHeader,
												col.borderHeader,
											)}
										>
											<StatusIcon className="w-4 h-4" />
										</div>
										<h3 className="font-bold text-sm text-foreground tracking-tight">
											{col.label}
										</h3>
										<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
											{colTasks.length}
										</span>
									</div>

									<button
										onClick={() => {
											const isOpening = !showAddForm[col.status];
											if (isOpening) {
												setColumnSelectedProject((prev) => ({
													...prev,
													[col.status]: activeDefaultProject,
												}));
											}
											setShowAddForm({
												...showAddForm,
												[col.status]: isOpening,
											});
										}}
										className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
										title={`Add Task to ${col.label}`}
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>

								{/* Quick Add Form in Column */}
								{showAddForm[col.status] && (
									<form
										onSubmit={(e) => handleQuickAddTask(col.status, e)}
										className="mb-3 p-3 rounded-xl bg-card border border-border space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
									>
										<input
											type="text"
											value={columnInput[col.status] || ""}
											onChange={(e) =>
												setColumnInput({
													...columnInput,
													[col.status]: e.target.value,
												})
											}
											placeholder="Task name..."
											className="w-full bg-input border border-border focus:border-rose-500 text-foreground text-xs rounded-lg p-2 focus:outline-none"
										/>

										<select
											value={
												columnSelectedProject[col.status] !== undefined
													? columnSelectedProject[col.status]
													: activeDefaultProject
											}
											onChange={(e) =>
												setColumnSelectedProject({
													...columnSelectedProject,
													[col.status]: e.target.value,
												})
											}
											className="w-full bg-card border border-border text-foreground text-[11px] rounded-lg p-1.5 focus:outline-none cursor-pointer"
										>
											<option value="">No Project (Uncategorized)</option>
											{projects.map((p) => (
												<option key={p.id} value={p.id}>
													Project: {p.name}
												</option>
											))}
										</select>

										<div className="flex items-center justify-end gap-1.5 pt-1">
											<button
												type="button"
												onClick={() =>
													setShowAddForm({
														...showAddForm,
														[col.status]: false,
													})
												}
												className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted rounded-lg cursor-pointer"
											>
												Cancel
											</button>
											<button
												type="submit"
												className="px-3 py-1 text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg cursor-pointer shadow-sm"
											>
												Add
											</button>
										</div>
									</form>
								)}

								{/* Column Task Cards Droppable Area */}
								<Droppable
									droppableId={col.status}
									renderClone={(provided, snapshot, rubric) => {
										const task = colTasks[rubric.source.index];
										if (!task) return null;
										return (
											<KanbanTaskCard
												task={task}
												project={projectMap.get(task.projectId)}
												pomodoroCount={getTaskPomodoroCount(task.id)}
												isEditing={editingTaskId === task.id}
												editingName={editingName}
												setEditingName={setEditingName}
												isExpanded={expandedTaskId === task.id}
												editingNote={editingNote}
												setEditingNote={setEditingNote}
												draggableProvided={provided}
												draggableSnapshot={snapshot}
												onStartEditing={handleStartEditing}
												onSaveEditing={handleSaveEditing}
												onCancelEditing={() => setEditingTaskId(null)}
												onSaveNote={handleSaveNote}
												onToggleExpand={handleToggleExpand}
												onUpdatePriority={handleUpdatePriority}
												onMoveTaskStatus={handleMoveTaskStatus}
												onDeleteTask={handleDeleteTask}
												onStartTaskFocus={onStartTaskFocus}
											/>
										);
									}}
								>
									{(droppableProvided, snapshot) => (
										<div
											ref={droppableProvided.innerRef}
											{...droppableProvided.droppableProps}
											className={cn(
												"flex-1 max-h-135 overflow-y-auto space-y-3 pr-1 rounded-xl transition-colors p-1",
												snapshot.isDraggingOver &&
													"bg-rose-500/5 ring-1 ring-rose-500/30 ring-dashed",
											)}
										>
											{colTasks.length === 0 ? (
												<div className="h-32 border-2 border-dashed border-border/40 rounded-xl flex items-center justify-center text-muted-foreground text-xs italic">
													No tasks
												</div>
											) : (
												(() => {
													const limit = visibleCounts[col.status] || 5;
													const displayedTasks = colTasks.slice(0, limit);
													const remainingCount =
														colTasks.length - displayedTasks.length;

													return (
														<>
															{displayedTasks.map((task, index) => (
																<Draggable
																	key={task.id}
																	draggableId={task.id}
																	index={index}
																>
																	{(draggableProvided, draggableSnapshot) => (
																		<KanbanTaskCard
																			task={task}
																			project={projectMap.get(task.projectId)}
																			pomodoroCount={getTaskPomodoroCount(
																				task.id,
																			)}
																			isEditing={editingTaskId === task.id}
																			editingName={editingName}
																			setEditingName={setEditingName}
																			isExpanded={expandedTaskId === task.id}
																			editingNote={editingNote}
																			setEditingNote={setEditingNote}
																			draggableProvided={draggableProvided}
																			draggableSnapshot={draggableSnapshot}
																			onStartEditing={handleStartEditing}
																			onSaveEditing={handleSaveEditing}
																			onCancelEditing={() =>
																				setEditingTaskId(null)
																			}
																			onSaveNote={handleSaveNote}
																			onToggleExpand={handleToggleExpand}
																			onUpdatePriority={handleUpdatePriority}
																			onMoveTaskStatus={handleMoveTaskStatus}
																			onDeleteTask={handleDeleteTask}
																			onStartTaskFocus={onStartTaskFocus}
																		/>
																	)}
																</Draggable>
															))}

															{/* Load More Button */}
															{remainingCount > 0 && (
																<button
																	onClick={() =>
																		setVisibleCounts({
																			...visibleCounts,
																			[col.status]: limit + 5,
																		})
																	}
																	className="w-full py-2 rounded-xl bg-card hover:bg-card/80 border border-dashed border-border/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
																>
																	<span>
																		Load More (+{remainingCount} remaining)
																	</span>
																</button>
															)}
														</>
													);
												})()
											)}
											{droppableProvided.placeholder}
										</div>
									)}
								</Droppable>
							</div>
						);
					})}
				</div>
			</div>
		</DragDropContext>
	);
}
