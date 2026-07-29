import { Sparkles } from "lucide-react";

export default function Footer() {
	return (
		<footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
			<div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
				<span>Gojodoro • Privacy First & Local Storage</span>
				<span className="flex items-center gap-1 text-slate-400">
					<Sparkles className="w-3.5 h-3.5 text-rose-400" /> Web Audio
					Synthesized
				</span>
			</div>
		</footer>
	);
}
