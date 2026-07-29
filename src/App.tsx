import { Timer as TimerIcon } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import DataBackupModal from "./components/DataBackupModal";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LockScreen from "./components/LockScreen";
import MobileNav from "./components/MobileNav";
import ProjectManager from "./components/ProjectManager";
import SessionHistory from "./components/SessionHistory";
import SettingsModal from "./components/SettingsModal";
import Timer from "./components/Timer";
import { db, getSettings, initDatabase, saveSetting } from "./services/db";
import type { AppSettings, Project, Session, Task } from "./types";

export type TabType = "timer" | "projects" | "history";

export default function App() {
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsStringLiteral(["timer", "projects", "history"] as const).withDefault(
			"timer",
		),
	);
	const [isLocked, setIsLocked] = useState<boolean>(false);
	const [isLockSetup, setIsLockSetup] = useState<boolean>(false);
	const [activePasscode, setActivePasscode] = useState<string | null>(null);

	// Focus navigation search params state
	const [activeFocusProjectId, setActiveFocusProjectId] = useQueryState(
		"project",
		parseAsString.withDefault(""),
	);
	const [activeFocusTaskId, setActiveFocusTaskId] = useQueryState(
		"task",
		parseAsString.withDefault(""),
	);

	// Search param setters for clearing filters on tab switch
	const [, setViewParam] = useQueryState("view", parseAsString);
	const [, setStatusParam] = useQueryState("status", parseAsString);
	const [, setPriorityParam] = useQueryState("priority", parseAsString);
	const [, setQParam] = useQueryState("q", parseAsString);

	const handleTabSwitch = (newTab: TabType) => {
		setActiveTab(newTab);
		// Clear filters and focus search params from URL when explicitly switching tabs
		setActiveFocusProjectId(null);
		setActiveFocusTaskId(null);
		setViewParam(null);
		setStatusParam(null);
		setPriorityParam(null);
		setQParam(null);
	};

	// App data state
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [settings, setSettings] = useState<AppSettings | null>(null);
	const [isInitializing, setIsInitializing] = useState<boolean>(true);

	// Modals state
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);

	// Load database and settings on startup
	const loadAppData = async () => {
		try {
			await initDatabase();
			const currentSettings = await getSettings();
			setSettings(currentSettings);

			const loadedProjects = await db.projects.toArray();
			const loadedTasks = await db.tasks.toArray();
			const loadedSessions = await db.sessions.toArray();

			const normalizedTasks: Task[] = loadedTasks.map((t) => ({
				...t,
				status: t.status || (t.completed ? "done" : "not_started"),
				priority: t.priority || "medium",
				completed: t.status ? t.status === "done" : Boolean(t.completed),
			}));

			setProjects(loadedProjects);
			setTasks(normalizedTasks);
			setSessions(loadedSessions);

			// Check if lock is enabled
			if (currentSettings.isPasscodeEnabled && !activePasscode) {
				setIsLocked(true);
			}
		} catch (err) {
			console.error("Failed to load application data:", err);
		} finally {
			setIsInitializing(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
	useEffect(() => {
		loadAppData();
	}, []);

	useEffect(() => {
		if (settings?.theme) {
			const root = document.documentElement;
			if (settings.theme === "dark") {
				root.classList.add("dark");
				root.classList.remove("light");
			} else {
				root.classList.add("light");
				root.classList.remove("dark");
			}
		}
	}, [settings?.theme]);

	const handleUnlock = (passcode: string) => {
		setActivePasscode(passcode);
		setIsLocked(false);
	};

	const handlePasscodeCreated = (passcode: string) => {
		setActivePasscode(passcode);
		setIsLockSetup(false);
		setIsLocked(false);
		loadAppData();
	};

	const handleToggleTheme = async () => {
		if (!settings) return;
		const newTheme = settings.theme === "light" ? "dark" : "light";
		await saveSetting("theme", newTheme);
		setSettings({ ...settings, theme: newTheme });
	};

	if (isInitializing || !settings) {
		return (
			<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
				<div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse mb-4">
					<TimerIcon className="w-6 h-6 text-rose-500" />
				</div>
				<span className="text-sm font-medium tracking-wide">
					Loading Gojodoro...
				</span>
			</div>
		);
	}

	const handleStartTaskFocus = (projectId: string, taskId?: string) => {
		setActiveFocusProjectId(projectId);
		setActiveFocusTaskId(taskId || "");
		setActiveTab("timer");
	};

	return (
		<div className="min-h-screen flex flex-col font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300 bg-background text-foreground">
			{/* Passcode Lock Overlay */}
			{isLocked && (
				<LockScreen
					isSetupMode={false}
					storedHash={settings.passcodeHash}
					storedSalt={settings.passcodeSalt}
					onUnlock={handleUnlock}
				/>
			)}

			{/* Passcode Setup Modal Overlay */}
			{isLockSetup && (
				<LockScreen
					isSetupMode={true}
					onPasscodeCreated={handlePasscodeCreated}
				/>
			)}

			{/* Top Header Navbar */}
			<Header
				activeTab={activeTab}
				projects={projects}
				settings={settings}
				onTabSwitch={handleTabSwitch}
				onToggleTheme={handleToggleTheme}
				onOpenBackup={() => setIsBackupOpen(true)}
				onOpenSettings={() => setIsSettingsOpen(true)}
				onLock={() => setIsLocked(true)}
			/>

			{/* Mobile Floating Bottom Navigation Bar */}
			<MobileNav
				activeTab={activeTab}
				projects={projects}
				onTabSwitch={handleTabSwitch}
			/>

			{/* Main App Container */}
			<main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-28 md:pb-12">
				{/* Tab Content Views */}
				<div className={activeTab === "timer" ? "block" : "hidden"}>
					<Timer
						settings={settings}
						projects={projects}
						tasks={tasks}
						initialProjectId={activeFocusProjectId}
						initialTaskId={activeFocusTaskId}
						onSessionLogged={loadAppData}
					/>
				</div>

				<div className={activeTab === "projects" ? "block" : "hidden"}>
					<ProjectManager
						projects={projects}
						tasks={tasks}
						sessions={sessions}
						onRefresh={loadAppData}
						onStartTaskFocus={handleStartTaskFocus}
					/>
				</div>

				<div className={activeTab === "history" ? "block" : "hidden"}>
					<SessionHistory
						sessions={sessions}
						projects={projects}
						onRefresh={loadAppData}
					/>
				</div>
			</main>

			{/* Footer */}
			<Footer />

			{/* Modals */}
			<SettingsModal
				isOpen={isSettingsOpen}
				settings={settings}
				onClose={() => setIsSettingsOpen(false)}
				onRefreshSettings={loadAppData}
				onOpenLockSetup={() => setIsLockSetup(true)}
			/>

			<DataBackupModal
				isOpen={isBackupOpen}
				onClose={() => setIsBackupOpen(false)}
				onRefresh={loadAppData}
			/>
		</div>
	);
}
