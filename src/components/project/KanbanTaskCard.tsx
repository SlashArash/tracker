import type {
	DraggableProvided,
	DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import {
	ArrowRightCircle,
	Check,
	ChevronDown,
	ChevronUp,
	Clock,
	Edit3,
	GripVertical,
	Play,
	Trash2,
	X,
} from "lucide-react";
import React from "react";
import { cn } from "../../lib/utils";
import type { Project, Task, TaskPriority } from "../../types";

export interface KanbanTaskCardProps {
	task: Task;
	project?: Project;
	pomodoroCount: number;
	isEditing: boolean;
	editingName: string;
	setEditingName: (val: string) => void;
	isExpanded: boolean;
	editingNote: string;
	setEditingNote: (val: string) => void;
	draggableProvided: DraggableProvided;
	draggableSnapshot?: DraggableStateSnapshot;
	onStartEditing: (task: Task) => void;
	onSaveEditing: (taskId: string) => void;
	onCancelEditing: () => void;
	onSaveNote: (taskId: string) => void;
	onToggleExpand: (task: Task) => void;
	onUpdatePriority: (task: Task, priority: TaskPriority) => void;
	onMoveTaskStatus: (task: Task) => void;
	onDeleteTask: (taskId: string) => void;
	onStartTaskFocus?: (projectId: string, taskId: string) => void;
}

const PRIORITY_BADGES: Record<TaskPriority, string> = {
	urgent: "bg-rose-500/15 border-rose-500/30 text-rose-400 font-semibold",
	high: "bg-amber-500/15 border-amber-500/30 text-amber-400",
	medium: "bg-blue-500/15 border-blue-500/30 text-blue-400",
	low: "bg-slate-500/10 border-slate-500/20 text-slate-400",
};

export const KanbanTaskCard = React.memo(function KanbanTaskCard({
	task,
	project,
	pomodoroCount,
	isEditing,
	editingName,
	setEditingName,
	isExpanded,
	editingNote,
	setEditingNote,
	draggableProvided,
	draggableSnapshot,
	onStartEditing,
	onSaveEditing,
	onCancelEditing,
	onSaveNote,
	onToggleExpand,
	onUpdatePriority,
	onMoveTaskStatus,
	onDeleteTask,
	onStartTaskFocus,
}: KanbanTaskCardProps) {
	const badgeClass = PRIORITY_BADGES[task.priority || "medium"];
	const isDragging = draggableSnapshot?.isDragging ?? false;

	return (
		<div
			ref={draggableProvided.innerRef}
			{...draggableProvided.draggableProps}
			className={cn(
				"group relative rounded-xl bg-card border p-3 transition-all space-y-2.5",
				isDragging
					? "shadow-2xl ring-2 ring-rose-500/60 bg-card border-rose-500/50 z-[9999] opacity-98 scale-[1.03] cursor-grabbing"
					: "border-border/80 shadow-xs hover:bg-card/90 hover:shadow-md",
			)}
		>
			{/* Project Badge & Drag Handle */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5 min-w-0 flex-1">
					<div
						{...draggableProvided.dragHandleProps}
						className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground/80 transition-colors p-0.5 rounded touch-none"
						title="Drag task to move status"
					>
						<GripVertical className="w-3.5 h-3.5" />
					</div>
					<span
						className="w-2.5 h-2.5 rounded-full shrink-0"
						style={{ backgroundColor: project ? project.color : "#94a3b8" }}
					/>
					<span className="text-[11px] font-semibold text-muted-foreground truncate">
						{project ? project.name : "Uncategorized"}
					</span>
				</div>

				{/* Priority Chip Select */}
				<select
					value={task.priority || "medium"}
					onChange={(e) =>
						onUpdatePriority(task, e.target.value as TaskPriority)
					}
					className={cn(
						"px-1.5 py-0.5 rounded-md border text-[10px] font-semibold focus:outline-none cursor-pointer shrink-0 transition-colors",
						badgeClass,
					)}
				>
					<option value="urgent" className="bg-card text-foreground">
						Urgent
					</option>
					<option value="high" className="bg-card text-foreground">
						High
					</option>
					<option value="medium" className="bg-card text-foreground">
						Medium
					</option>
					<option value="low" className="bg-card text-foreground">
						Low
					</option>
				</select>
			</div>

			{/* Task Title (Inline editable) */}
			{isEditing ? (
				<div className="flex items-center gap-1">
					<input
						type="text"
						value={editingName}
						onChange={(e) => setEditingName(e.target.value)}
						className="flex-1 bg-input border border-rose-500 text-foreground text-xs rounded-lg px-2 py-1 focus:outline-none"
					/>
					<button
						onClick={() => onSaveEditing(task.id)}
						className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md cursor-pointer"
					>
						<Check className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={onCancelEditing}
						className="p-1 text-slate-400 hover:bg-slate-500/10 rounded-md cursor-pointer"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			) : (
				<div className="flex items-start justify-between gap-2 group/title">
					<h4
						onClick={() => onStartEditing(task)}
						className={cn(
							"text-xs font-semibold leading-snug text-foreground cursor-pointer hover:text-rose-400 transition-colors wrap-break-word flex-1",
							task.status === "done" && "line-through text-muted-foreground",
						)}
						title="Click to edit title"
					>
						{task.name}
					</h4>
					<button
						onClick={() => onStartEditing(task)}
						className="opacity-0 group-hover/title:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
					>
						<Edit3 className="w-3 h-3" />
					</button>
				</div>
			)}

			{/* Task Note / Description Section */}
			{task.description && (
				<p className="text-[11px] text-muted-foreground/90 bg-muted/50 p-1.5 rounded-lg border border-border/40 line-clamp-2">
					{task.description}
				</p>
			)}

			{/* Expandable note editor */}
			{isExpanded && (
				<div className="pt-2 border-t border-border/50 space-y-1.5">
					<label className="text-[10px] font-semibold text-muted-foreground block">
						Task Note / Description
					</label>
					<textarea
						value={editingNote}
						onChange={(e) => setEditingNote(e.target.value)}
						placeholder="Add task notes or context..."
						rows={2}
						className="w-full bg-input border border-border focus:border-indigo-500 text-foreground text-xs rounded-lg p-2 focus:outline-none resize-none"
					/>
					<div className="flex justify-end gap-1">
						<button
							onClick={() => onToggleExpand(task)}
							className="px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
						>
							Cancel
						</button>
						<button
							onClick={() => onSaveNote(task.id)}
							className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500 text-white rounded-md hover:bg-rose-600 cursor-pointer"
						>
							Save Note
						</button>
					</div>
				</div>
			)}

			{/* Footer Details: Sessions Counter, Move Buttons, Start Focus */}
			<div className="flex items-center justify-between pt-2 border-t border-border/40 gap-1 text-[11px]">
				{/* Pomodoro Session Badge */}
				<div
					className="flex items-center gap-1 text-muted-foreground font-medium cursor-pointer hover:text-foreground"
					onClick={() => onToggleExpand(task)}
					title="Click to view/edit notes"
				>
					<Clock className="w-3 h-3 text-rose-400" />
					<span>
						{pomodoroCount} {pomodoroCount === 1 ? "session" : "sessions"}
					</span>
					{isExpanded ? (
						<ChevronUp className="w-3 h-3" />
					) : (
						<ChevronDown className="w-3 h-3" />
					)}
				</div>

				{/* Quick Actions */}
				<div className="flex items-center gap-1">
					{/* Move Status Buttons */}
					{(task.status || "not_started") !== "done" && (
						<button
							onClick={() => onMoveTaskStatus(task)}
							className="p-1 rounded-md text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
							title="Move to next status stage"
						>
							<ArrowRightCircle className="w-3.5 h-3.5" />
						</button>
					)}

					{/* Direct Start Focus Launcher */}
					{onStartTaskFocus && task.status !== "done" && (
						<button
							onClick={() => onStartTaskFocus(task.projectId, task.id)}
							className="flex items-center gap-1 bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shadow-xs cursor-pointer"
							title="Start Pomodoro Focus Session for this task"
						>
							<Play className="w-2.5 h-2.5 fill-current" />
							<span>Focus</span>
						</button>
					)}

					{/* Delete Button */}
					<button
						onClick={() => onDeleteTask(task.id)}
						className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
						title="Delete Task"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</div>
	);
});
