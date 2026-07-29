import { Search, Trash2, X } from "lucide-react";
import type { Project, TaskPriority, TaskStatus } from "../../types";

interface ProjectFilterBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	selectedProjectFilter: string;
	onProjectFilterChange: (projId: string) => void;
	selectedStatusFilter: string;
	onStatusFilterChange: (status: TaskStatus | "all") => void;
	selectedPriorityFilter: string;
	onPriorityFilterChange: (priority: TaskPriority | "all") => void;
	projects: Project[];
	completedCount: number;
	onClearCompleted: () => void;
}

export default function ProjectFilterBar({
	searchQuery,
	onSearchChange,
	selectedProjectFilter,
	onProjectFilterChange,
	selectedStatusFilter,
	onStatusFilterChange,
	selectedPriorityFilter,
	onPriorityFilterChange,
	projects,
	completedCount,
	onClearCompleted,
}: ProjectFilterBarProps) {
	return (
		<div className="glass-panel rounded-2xl p-3.5 border border-border/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
			{/* Instant Search Bar */}
			<div className="relative flex-1 min-w-50">
				<Search className="w-4 h-4 absolute left-3 top-1/2 transform -rotate-0 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search tasks by name or notes..."
					className="w-full pl-9 pr-8 py-2 bg-input/60 border border-border focus:border-rose-500 text-foreground rounded-xl text-xs focus:outline-none transition-colors"
				/>
				{searchQuery && (
					<button
						onClick={() => onSearchChange("")}
						className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
					onChange={(e) => onProjectFilterChange(e.target.value)}
					className="bg-card border border-border text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
				>
					<option value="all">All Projects ({projects.length})</option>
					<option value="uncategorized">No Project (Uncategorized)</option>
					{projects.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>

				{/* Status Filter */}
				<select
					value={selectedStatusFilter}
					onChange={(e) => onStatusFilterChange(e.target.value as any)}
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
					onChange={(e) => onPriorityFilterChange(e.target.value as any)}
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
						onClick={onClearCompleted}
						className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
						title="Clear all completed tasks"
					>
						<Trash2 className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">
							Clear Done ({completedCount})
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
