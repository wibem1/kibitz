import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initializeDiagnostics, installDiagnosticListeners } from "./lib/diagnostics";
import { maybeCheckForUpdatesOnLaunch } from "./lib/updates";
import "./tokens.css";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import "./board-treatments.css";
import "./app.css";

// One launch-time update check, gated by the Settings toggle (default ON)
// and a no-network short-circuit while the updater is unconfigured.
void maybeCheckForUpdatesOnLaunch();
// Collect event categories only: never browser error messages, paths or secrets.
try { initializeDiagnostics(window.localStorage); } catch { /* storage blocked */ }
installDiagnosticListeners(window);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
