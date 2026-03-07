import { useState, useEffect } from "react";
import { SearchPanel } from "./SearchPanel";
import { DeadlinesPanel } from "./DeadlinesPanel";
import { HistoryPanel } from "./HistoryPanel";
import type { ItFileEntry, DeadlineEntry } from "../hooks/useWorkspace";
import { QueryPanel } from "./QueryPanel";
import { ExplorerPanel } from "./ExplorerPanel";

export type SidebarPanel =
  | "explorer"
  | "search"
  | "query"
  | "deadlines"
  | "recent";

interface SidebarProps {
  visible: boolean;
  files: ItFileEntry[];
  activeFilePath: string | null;
  folderPath: string | null;
  folderName: string | null;
  deadlines: DeadlineEntry[];
  recentFiles: string[];
  isFileUnsaved: boolean;
  onFileOpen: (path: string) => void;
  onRefresh: () => void;
}

const PANELS: { id: SidebarPanel; icon: string; label: string }[] = [
  { id: "explorer", icon: "📁", label: "Explorer" },
  { id: "search", icon: "🔍", label: "Search" },
  { id: "query", icon: "⚡", label: "Query" },
  { id: "deadlines", icon: "📅", label: "Deadlines" },
  { id: "recent", icon: "🕐", label: "Recent" },
];

export function Sidebar({
  visible,
  files,
  activeFilePath,
  folderPath,
  folderName,
  deadlines,
  recentFiles,
  isFileUnsaved,
  onFileOpen,
  onRefresh,
}: SidebarProps) {
  const [activePanel, setActivePanel] = useState<SidebarPanel>(
    () =>
      (localStorage.getItem("it-sidebar-panel") as SidebarPanel) || "explorer",
  );

  useEffect(() => {
    localStorage.setItem("it-sidebar-panel", activePanel);
  }, [activePanel]);

  // Listen for keyboard shortcuts to switch panels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setActivePanel("explorer");
      } else if (mod && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setActivePanel("search");
      } else if (mod && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (PANELS[idx]) setActivePanel(PANELS[idx].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="sidebar-container">
      <div className="sidebar-rail">
        {PANELS.map((p) => (
          <button
            key={p.id}
            className={`rail-btn ${activePanel === p.id ? "active" : ""}`}
            onClick={() => setActivePanel(p.id)}
            title={p.label}
          >
            {p.icon}
          </button>
        ))}
      </div>

      <div className="sidebar-panel">
        <div className="sidebar-panel-header">
          {PANELS.find((p) => p.id === activePanel)?.label?.toUpperCase()}
        </div>

        {activePanel === "explorer" && (
          <ExplorerPanel
            files={files}
            activeFilePath={activeFilePath}
            folderPath={folderPath}
            folderName={folderName}
            isFileUnsaved={isFileUnsaved}
            onFileOpen={onFileOpen}
            onRefresh={onRefresh}
          />
        )}
        {activePanel === "search" && (
          <SearchPanel folderPath={folderPath} onFileOpen={onFileOpen} />
        )}
        {activePanel === "query" && (
          <QueryPanel folderPath={folderPath} onFileOpen={onFileOpen} />
        )}
        {activePanel === "deadlines" && (
          <DeadlinesPanel deadlines={deadlines} onFileOpen={onFileOpen} />
        )}
        {activePanel === "recent" && (
          <HistoryPanel recentFiles={recentFiles} onFileOpen={onFileOpen} />
        )}
      </div>
    </div>
  );
}
