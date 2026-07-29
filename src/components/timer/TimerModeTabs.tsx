import { Coffee, Flame, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ExtendedTimerMode } from "../Timer";

interface TimerModeTabsProps {
	mode: ExtendedTimerMode;
	onSelectMode: (mode: ExtendedTimerMode) => void;
}

export default function TimerModeTabs({
	mode,
	onSelectMode,
}: TimerModeTabsProps) {
	return (
		<div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-border bg-card shadow-lg mb-8 transition-colors">
			<button
				onClick={() => onSelectMode("work")}
				className={cn(
					"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
					mode === "work"
						? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
						: "text-muted-foreground hover:text-foreground hover:bg-accent",
				)}
			>
				<Flame className="w-3.5 h-3.5" />
				Pomodoro
			</button>

			<button
				onClick={() => onSelectMode("shortBreak")}
				className={cn(
					"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
					mode === "shortBreak"
						? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
						: "text-muted-foreground hover:text-foreground hover:bg-accent",
				)}
			>
				<Coffee className="w-3.5 h-3.5" />
				Short Break
			</button>

			<button
				onClick={() => onSelectMode("longBreak")}
				className={cn(
					"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
					mode === "longBreak"
						? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
						: "text-muted-foreground hover:text-foreground hover:bg-accent",
				)}
			>
				<Sparkles className="w-3.5 h-3.5" />
				Long Break
			</button>

			<button
				onClick={() => onSelectMode("stopwatch")}
				className={cn(
					"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
					mode === "stopwatch"
						? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
						: "text-muted-foreground hover:text-foreground hover:bg-accent",
				)}
			>
				<RotateCcw className="w-3.5 h-3.5" />
				Stopwatch
			</button>
		</div>
	);
}
