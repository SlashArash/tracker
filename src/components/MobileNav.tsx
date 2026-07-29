import { FolderGit2, History, Timer as TimerIcon } from "lucide-react";
import type { TabType } from "../App";
import { cn } from "../lib/utils";
import type { Project } from "../types";

interface MobileNavProps {
	activeTab: TabType;
	projects: Project[];
	onTabSwitch: (tab: TabType) => void;
}

export default function MobileNav({
	activeTab,
	projects,
	onTabSwitch,
}: MobileNavProps) {
	return (
		<nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-background/85 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-around">
			<button
				onClick={() => onTabSwitch("timer")}
				className={cn(
					"flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer",
					activeTab === "timer"
						? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
						: "text-muted-foreground hover:text-foreground hover:bg-accent/50",
				)}
			>
				<TimerIcon className="w-4 h-4" />
				<span className="text-[11px]">Timer</span>
			</button>

			<button
				onClick={() => onTabSwitch("projects")}
				className={cn(
					"flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer relative",
					activeTab === "projects"
						? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
						: "text-muted-foreground hover:text-foreground hover:bg-accent/50",
				)}
			>
				<div className="relative flex items-center">
					<FolderGit2 className="w-4 h-4" />
					{projects.length > 0 && (
						<span
							className={cn(
								"absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold leading-none",
								activeTab === "projects"
									? "bg-white text-rose-600"
									: "bg-rose-500 text-white",
							)}
						>
							{projects.length}
						</span>
					)}
				</div>
				<span className="text-[11px]">Projects</span>
			</button>

			<button
				onClick={() => onTabSwitch("history")}
				className={cn(
					"flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer",
					activeTab === "history"
						? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-semibold"
						: "text-muted-foreground hover:text-foreground hover:bg-accent/50",
				)}
			>
				<History className="w-4 h-4" />
				<span className="text-[11px]">History</span>
			</button>
		</nav>
	);
}
