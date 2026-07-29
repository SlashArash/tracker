import { Check } from "lucide-react";
import type React from "react";
import { cn } from "../../lib/utils";
import { COLOR_PALETTE } from "../ProjectManager";

interface NewProjectModalProps {
	newProjectName: string;
	onNameChange: (name: string) => void;
	newProjectColor: string;
	onColorChange: (color: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
}

export default function NewProjectModal({
	newProjectName,
	onNameChange,
	newProjectColor,
	onColorChange,
	onSubmit,
	onCancel,
}: NewProjectModalProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="glass-card rounded-2xl p-5 border border-border space-y-4 text-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200"
		>
			<h3 className="text-sm font-bold text-foreground">Create New Project</h3>
			<div>
				<label className="block text-xs text-muted-foreground mb-1">
					Project Name
				</label>
				<input
					type="text"
					value={newProjectName}
					onChange={(e) => onNameChange(e.target.value)}
					placeholder="e.g. Website Redesign, Mobile App, Research"
					className="w-full bg-input border border-border focus:border-rose-500 text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none"
				/>
			</div>

			<div>
				<label className="block text-xs text-muted-foreground mb-1.5">
					Badge Color
				</label>
				<div className="flex flex-wrap items-center gap-2">
					{COLOR_PALETTE.map((color) => (
						<button
							key={color}
							type="button"
							onClick={() => onColorChange(color)}
							className={cn(
								"w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center",
								newProjectColor === color
									? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background"
									: "opacity-80 hover:opacity-100",
							)}
							style={{ backgroundColor: color }}
						>
							{newProjectColor === color && (
								<Check className="w-3.5 h-3.5 text-white" />
							)}
						</button>
					))}
				</div>
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
					Save Project
				</button>
			</div>
		</form>
	);
}
