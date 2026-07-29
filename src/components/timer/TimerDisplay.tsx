import { cn } from "../../lib/utils";
import type { ExtendedTimerMode } from "../Timer";

interface TimerDisplayProps {
	timeLeft: number;
	isRunning: boolean;
	mode: ExtendedTimerMode;
	completedCycles: number;
	strokeDasharray: number;
	strokeDashoffset: number;
	formatTime: (seconds: number) => string;
}

export default function TimerDisplay({
	timeLeft,
	isRunning,
	mode,
	completedCycles,
	strokeDasharray,
	strokeDashoffset,
	formatTime,
}: TimerDisplayProps) {
	const isBreakMode = mode === "shortBreak" || mode === "longBreak";

	return (
		<div className="relative flex items-center justify-center my-2">
			<svg className="w-72 h-72 md:w-80 md:h-80 transform -rotate-90">
				{/* Background circle track */}
				<circle
					cx="50%"
					cy="50%"
					r="140"
					className="stroke-border"
					strokeWidth="12"
					fill="transparent"
				/>
				{/* Progress circle */}
				<circle
					cx="50%"
					cy="50%"
					r="140"
					className={cn(
						"transition-all duration-1000 ease-linear",
						isBreakMode
							? "stroke-emerald-500"
							: mode === "stopwatch"
								? "stroke-amber-500"
								: "stroke-rose-500",
					)}
					strokeWidth="12"
					strokeDasharray={strokeDasharray}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					fill="transparent"
				/>
			</svg>

			{/* Inner Content */}
			<div
				className={cn(
					"absolute flex flex-col items-center justify-center w-64 h-64 rounded-full glass-card transition-all border border-border shadow-xl",
					isRunning
						? isBreakMode
							? "timer-active-break"
							: "timer-active-work"
						: "",
				)}
			>
				<span className="text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-foreground">
					{formatTime(timeLeft)}
				</span>

				<span className="text-xs font-semibold uppercase tracking-widest mt-2 flex items-center gap-1.5">
					{isBreakMode ? (
						<span className="text-emerald-500 font-bold">Break Time</span>
					) : mode === "stopwatch" ? (
						<span className="text-amber-500 font-bold">Stopwatch</span>
					) : (
						<span className="text-rose-500 font-bold">Focus Phase</span>
					)}
				</span>

				{completedCycles > 0 && (
					<span className="text-[11px] mt-2 px-2.5 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
						Completed: {completedCycles} Pomodoros
					</span>
				)}
			</div>
		</div>
	);
}
