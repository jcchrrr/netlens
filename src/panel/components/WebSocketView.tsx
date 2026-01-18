import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, Search, Clock } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { JsonTreeView } from "./JsonTreeView";

export interface WebSocketFrame {
  type: "send" | "receive";
  data: string;
  timestamp: number;
  opcode?: number;
}

interface WebSocketViewProps {
  frames: WebSocketFrame[];
  className?: string;
}

export function WebSocketView({ frames, className }: WebSocketViewProps) {
  const [filter, setFilter] = useState<"all" | "send" | "receive">("all");
  const [search, setSearch] = useState("");
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set());

  const filteredFrames = useMemo(() => {
    return frames.filter((frame) => {
      // Filter by direction
      if (filter !== "all" && frame.type !== filter) {
        return false;
      }
      // Filter by search
      if (search && !frame.data.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [frames, filter, search]);

  const toggleFrame = (index: number) => {
    setExpandedFrames((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (frames.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-gray-500", className)}>
        No WebSocket frames captured
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-gray-200 p-2">
        {/* Direction filter */}
        <div className="flex rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2 py-1 text-xs font-medium",
              filter === "all"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("send")}
            className={cn(
              "flex items-center gap-1 border-l border-gray-200 px-2 py-1 text-xs font-medium",
              filter === "send"
                ? "bg-green-50 text-green-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <ArrowUp className="h-3 w-3" />
            Sent
          </button>
          <button
            type="button"
            onClick={() => setFilter("receive")}
            className={cn(
              "flex items-center gap-1 border-l border-gray-200 px-2 py-1 text-xs font-medium",
              filter === "receive"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <ArrowDown className="h-3 w-3" />
            Received
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search frames..."
            className="w-full rounded border border-gray-200 py-1 pl-7 pr-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Frame count */}
      <div className="border-b border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-500">
        {filteredFrames.length} frame{filteredFrames.length !== 1 ? "s" : ""}
        {filter !== "all" && ` (${filter})`}
      </div>

      {/* Frames list */}
      <div className="flex-1 overflow-y-auto">
        {filteredFrames.map((frame, index) => (
          <FrameRow
            key={index}
            frame={frame}
            expanded={expandedFrames.has(index)}
            onToggle={() => toggleFrame(index)}
          />
        ))}
        {filteredFrames.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400">
            No frames match the filter
          </div>
        )}
      </div>
    </div>
  );
}

interface FrameRowProps {
  frame: WebSocketFrame;
  expanded: boolean;
  onToggle: () => void;
}

function FrameRow({ frame, expanded, onToggle }: FrameRowProps) {
  const isSend = frame.type === "send";
  const isJson = isJsonString(frame.data);
  const parsedData = isJson ? JSON.parse(frame.data) : null;

  // Truncate preview if too long
  const preview =
    frame.data.length > 100 ? frame.data.slice(0, 100) + "..." : frame.data;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-gray-50",
          expanded && "bg-gray-50"
        )}
      >
        {/* Direction icon */}
        <div
          className={cn(
            "shrink-0 rounded p-1",
            isSend ? "bg-green-100" : "bg-blue-100"
          )}
        >
          {isSend ? (
            <ArrowUp className="h-3 w-3 text-green-600" />
          ) : (
            <ArrowDown className="h-3 w-3 text-blue-600" />
          )}
        </div>

        {/* Preview */}
        <div className="min-w-0 flex-1">
          <pre className="truncate font-mono text-xs text-gray-700">
            {preview}
          </pre>
        </div>

        {/* Timestamp */}
        <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {formatTime(frame.timestamp)}
        </div>

        {/* Size */}
        <div className="shrink-0 text-xs text-gray-400">
          {formatSize(frame.data.length)}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-2">
          {isJson && parsedData ? (
            <JsonTreeView data={parsedData} />
          ) : (
            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-gray-700">
              {frame.data}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function isJsonString(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
