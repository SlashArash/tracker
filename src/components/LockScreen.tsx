import {
	AlertCircle,
	ArrowRight,
	KeyRound,
	Lock,
	ShieldCheck,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { hashPasscode, verifyPasscode } from "../services/crypto";
import { saveSetting } from "../services/db";

export interface LockScreenProps {
	isSetupMode: boolean;
	storedHash?: string | null;
	storedSalt?: string | null;
	onUnlock?: (passcode: string) => void;
	onPasscodeCreated?: (
		passcode: string,
		hashB64: string,
		saltB64: string,
	) => void;
}

export default function LockScreen({
	isSetupMode,
	storedHash,
	storedSalt,
	onUnlock,
	onPasscodeCreated,
}: LockScreenProps) {
	const [passcode, setPasscode] = useState("");
	const [confirmPasscode, setConfirmPasscode] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!passcode) return;

		setLoading(true);
		try {
			const isValid = await verifyPasscode(
				passcode,
				storedHash || null,
				storedSalt || null,
			);
			if (isValid) {
				onUnlock?.(passcode);
			} else {
				setError("Incorrect passcode. Please try again.");
				setPasscode("");
			}
		} catch (_err) {
			setError("Error verifying passcode.");
		} finally {
			setLoading(false);
		}
	};

	const handleCreatePasscode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (passcode.length < 4) {
			setError("Passcode must be at least 4 characters long.");
			return;
		}
		if (passcode !== confirmPasscode) {
			setError("Passcodes do not match.");
			return;
		}

		setLoading(true);
		try {
			const { hashB64, saltB64 } = await hashPasscode(passcode);
			await saveSetting("isPasscodeEnabled", true);
			await saveSetting("passcodeHash", hashB64);
			await saveSetting("passcodeSalt", saltB64);
			onPasscodeCreated?.(passcode, hashB64, saltB64);
		} catch (_err) {
			setError("Failed to save passcode.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 light:bg-slate-900/50 backdrop-blur-xl p-4">
			<div className="w-full max-w-md glass-card rounded-2xl p-8 border border-slate-700/50 light:border-slate-300 shadow-2xl relative overflow-hidden">
				{/* Glow backdrop accent */}
				<div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

				<div className="flex flex-col items-center text-center mb-6">
					<div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4">
						{isSetupMode ? (
							<ShieldCheck className="w-7 h-7 text-white" />
						) : (
							<Lock className="w-7 h-7 text-white" />
						)}
					</div>
					<h2 className="text-2xl font-bold text-slate-100 light:text-slate-900 tracking-tight">
						{isSetupMode ? "Set Up Passcode Lock" : "Application Locked"}
					</h2>
					<p className="text-sm text-slate-400 light:text-slate-500 mt-1">
						{isSetupMode
							? "Protect your local project sessions with a master key."
							: "Enter your master passcode to access your workspace."}
					</p>
				</div>

				{error && (
					<div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 light:text-rose-700 text-xs flex items-center gap-2">
						<AlertCircle className="w-4 h-4 shrink-0" />
						<span>{error}</span>
					</div>
				)}

				{isSetupMode ? (
					<form onSubmit={handleCreatePasscode} className="space-y-4">
						<div>
							<label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
								New Passcode / PIN
							</label>
							<div className="relative">
								<input
									type="password"
									value={passcode}
									onChange={(e) => setPasscode(e.target.value)}
									placeholder="Enter passcode (min 4 chars)"
									className="w-full bg-slate-900/80 light:bg-slate-50 border border-slate-700 light:border-slate-300 focus:border-rose-500 text-slate-100 light:text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
								/>
								<KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 light:text-slate-400" />
							</div>
						</div>

						<div>
							<label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
								Confirm Passcode
							</label>
							<div className="relative">
								<input
									type="password"
									value={confirmPasscode}
									onChange={(e) => setConfirmPasscode(e.target.value)}
									placeholder="Re-enter passcode"
									className="w-full bg-slate-900/80 light:bg-slate-50 border border-slate-700 light:border-slate-300 focus:border-rose-500 text-slate-100 light:text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
								/>
								<KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 light:text-slate-400" />
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full mt-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
						>
							{loading ? "Deriving Keys..." : "Save & Enable Lock"}
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>
				) : (
					<form onSubmit={handleUnlock} className="space-y-4">
						<div>
							<label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
								Passcode
							</label>
							<div className="relative">
								<input
									type="password"
									value={passcode}
									onChange={(e) => setPasscode(e.target.value)}
									placeholder="••••••••"
									className="w-full bg-slate-900/80 light:bg-slate-50 border border-slate-700 light:border-slate-300 focus:border-rose-500 text-slate-100 light:text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all text-center tracking-widest text-lg"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
						>
							{loading ? "Verifying..." : "Unlock Workspace"}
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
