import type React from "react";
import { useState } from "react";
import type { Project, TaskPriority, TaskStatus } from "../../types";

interface NewTaskModalProps {
	projects: Project[];
	defaultProjectId?: string;
	onSubmit: (taskData: {
		name: string;
		projectId: string;
		status: TaskStatus;
		priority: TaskPriority;
		description?: string;
	}) => void;
	onCancel: () => void;
}

export default function NewTaskModal({
	projects,
	defaultProjectId = "",
	onSubmit,
	onCancel,
}: NewTaskModalProps) {
	// If defaultProjectId matches a valid project, pre-select it; otherwise default to '' (No Project)
	const validDefaultProjectId =
		defaultProjectId &&
		defaultProjectId !== "all" &&
		defaultProjectId !== "uncategorized"
			? defaultProjectId
			: "";

	const [taskName, setTaskName] = useState("");
	const [projectId, setProjectId] = useState(validDefaultProjectId);
	const [status, setStatus] = useState<TaskStatus>("not_started");
	const [priority, setPriority] = useState<TaskPriority>("medium");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!taskName.trim()) return;

		onSubmit({
			name: taskName.trim(),
			projectId,
			status,
			priority,
			description: description.trim() || undefined,
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="glass-card rounded-2xl p-5 border border-border space-y-4 text-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200"
		>
			<h3 className="text-sm font-bold text-foreground">Create New Task</h3>

			<div>
				<label className="block text-xs text-muted-foreground mb-1">
					Task Title *
				</label>
				<input
					type="text"
					value={taskName}
					onChange={(e) => setTaskName(e.target.value)}
					placeholder="e.g. Design homepage hero, Fix navigation bug..."
					className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none"
					required
				/>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{/* Project Selection Dropdown */}
				<div>
					<label className="block text-xs text-muted-foreground mb-1">
						Project
					</label>
					<select
						value={projectId}
						onChange={(e) => setProjectId(e.target.value)}
						className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
					>
						<option value="">No Project (Uncategorized)</option>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				{/* Priority Selection Dropdown */}
				<div>
					<label className="block text-xs text-muted-foreground mb-1">
						Priority
					</label>
					<select
						value={priority}
						onChange={(e) => setPriority(e.target.value as TaskPriority)}
						className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
					>
						<option value="urgent">Urgent</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>

				{/* Status Selection Dropdown */}
				<div>
					<label className="block text-xs text-muted-foreground mb-1">
						Status
					</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as TaskStatus)}
						className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
					>
						<option value="not_started">Not Started</option>
						<option value="next">Next</option>
						<option value="in_progress">In Progress</option>
						<option value="done">Done</option>
					</select>
				</div>
			</div>

			<div>
				<label className="block text-xs text-muted-foreground mb-1">
					Notes / Description (Optional)
				</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Add details, links, or acceptance criteria..."
					rows={2}
					className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl p-3 text-xs focus:outline-none resize-none"
				/>
			</div>

			<div className="flex items-center justify-end gap-2 pt-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-accent transition-colors cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="submit"
					className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
				>
					Save Task
				</button>
			</div>
		</form>
	);
}
