import { NuqsAdapter } from "nuqs/adapters/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<NuqsAdapter>
				<App />
			</NuqsAdapter>
		</React.StrictMode>,
	);
}
