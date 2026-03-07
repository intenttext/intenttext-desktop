import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SearchResult {
  file: string;
  relative_path: string;
  line: number;
  content: string;
}

interface SearchPanelProps {
  folderPath: string | null;
  onFileOpen: (path: string) => void;
}

export function SearchPanel({ folderPath, onFileOpen }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const doSearch = useCallback(
    async (q: string) => {
      if (!folderPath || !q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await invoke<SearchResult[]>("search_workspace", {
          dir: folderPath,
          query: q,
        });
        setResults(res);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [folderPath],
  );

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 300);
    },
    [doSearch],
  );

  // Group results by file
  const grouped = new Map<string, SearchResult[]>();
  for (const r of results) {
    const list = grouped.get(r.relative_path) ?? [];
    list.push(r);
    grouped.set(r.relative_path, list);
  }

  if (!folderPath) {
    return (
      <div className="sidebar-empty">
        <p>Open a folder to search</p>
      </div>
    );
  }

  return (
    <div className="search-panel">
      <div className="search-input-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="Search in workspace..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
        />
      </div>

      {searching && <div className="search-status">Searching...</div>}

      {!searching && query && results.length === 0 && (
        <div className="search-status">No results</div>
      )}

      <div className="search-results">
        {Array.from(grouped.entries()).map(([relPath, items]) => (
          <div key={relPath} className="search-file-group">
            <div className="search-file-name">{relPath}</div>
            {items.map((item, i) => (
              <div
                key={i}
                className="search-result-line"
                onClick={() => onFileOpen(item.file)}
              >
                <span className="search-line-num">L{item.line}</span>
                <span className="search-line-content">
                  {highlightMatch(item.content, query)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
