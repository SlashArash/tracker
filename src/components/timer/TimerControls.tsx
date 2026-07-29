import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ExtendedTimerMode } from "../Timer";

interface TimerControlsProps {
	isRunning: boolean;
	mode: ExtendedTimerMode;
	onStartPause: () => void;
	onReset: () => void;
	onSkip: () => void;
}

export default function TimerControls({
	isRunning,
	mode,
	onStartPause,
	onReset,
	onSkip,
}: TimerControlsProps) {
	const isBreakMode = mode === "shortBreak" || mode === "longBreak";

	return (
		<div className="flex items-center gap-4 mt-8">
			<button
				onClick={onReset}
				className="p-3.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
				title="Reset Timer"
			>
				<RotateCcw className="w-5 h-5" />
			</button>

			<button
				onClick={onStartPause}
				className={cn(
					"flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95",
					isRunning
						? "bg-muted border border-border text-foreground hover:bg-accent"
						: isBreakMode
							? "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25"
							: mode === "stopwatch"
								? "bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25"
								: "bg-linear-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-rose-500/25",
				)}
			>
				{isRunning ? (
					<Pause className="w-6 h-6 fill-current" />
				) : (
					<Play className="w-6 h-6 fill-current" />
				)}
				<span>{isRunning ? "Pause" : "Start Focus"}</span>
			</button>

			<button
				onClick={onSkip}
				className="p-3.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
				title="Skip to Next"
			>
				<SkipForward className="w-5 h-5" />
			</button>
		</div>
	);
}
