import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Download, Loader2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { JsonTreeView } from "./JsonTreeView";

interface BodyDisplayProps {
  body: string | null;
  bodySize: number;
  mimeType?: string;
  hasFullBody: boolean;
  getFullBody?: () => Promise<string>;
}

type ViewMode = "tree" | "raw" | "table";

export function BodyDisplay({
  body,
  bodySize,
  mimeType = "",
  hasFullBody,
  getFullBody,
}: BodyDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [fullBody, setFullBody] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayBody = fullBody ?? body;
  const isJson = isJsonMimeType(mimeType) || isJsonContent(displayBody);
  const isLargeBody = bodySize > 500 * 1024; // 500KB

  // Reset state when body changes
  useEffect(() => {
    setFullBody(null);
  }, [body]);

  const handleLoadFull = useCallback(async () => {
    if (!getFullBody || isLoading) return;
    setIsLoading(true);
    try {
      const content = await getFullBody();
      setFullBody(content);
    } catch {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  }, [getFullBody, isLoading]);

  const handleCopy = useCallback(async () => {
    if (!displayBody) return;
    try {
      await navigator.clipboard.writeText(displayBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  }, [displayBody]);

  // Empty state
  if (!body && !fullBody) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No body content
      </div>
    );
  }

  // Determine which tabs to show
  const showTreeTab = isJson;
  const showTableTab = isJson && isArrayOfObjects(displayBody);

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-2 py-1.5">
        {/* View mode tabs */}
        <div className="flex gap-1">
          {showTreeTab && (
            <TabButton
              active={viewMode === "tree"}
              onClick={() => setViewMode("tree")}
            >
              Tree
            </TabButton>
          )}
          <TabButton
            active={viewMode === "raw"}
            onClick={() => setViewMode("raw")}
          >
            Raw
          </TabButton>
          {showTableTab && (
            <TabButton
              active={viewMode === "table"}
              onClick={() => setViewMode("table")}
            >
              Table
            </TabButton>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-gray-400">
            {formatBytes(bodySize)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Copy body"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Load full content banner */}
      {isLargeBody && !hasFullBody && !fullBody && getFullBody && (
        <div className="flex items-center justify-between bg-amber-50 px-3 py-2">
          <span className="text-xs text-amber-700">
            Body truncated ({formatBytes(bodySize)})
          </span>
          <button
            type="button"
            onClick={handleLoadFull}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                Load full content
              </>
            )}
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto p-3">
        {viewMode === "tree" && showTreeTab ? (
          <JsonTreeView data={parseJson(displayBody)} initialDepth={3} />
        ) : viewMode === "table" && showTableTab ? (
          <TableView data={parseJson(displayBody)} />
        ) : (
          <RawView content={displayBody} mimeType={mimeType} />
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

interface RawViewProps {
  content: string | null;
  mimeType: string;
}

function RawView({ content, mimeType }: RawViewProps) {
  if (!content) return null;

  // Format JSON for readability
  const displayContent = isJsonMimeType(mimeType) || isJsonContent(content)
    ? formatJson(content)
    : content;

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-xs text-gray-800">
      {displayContent}
    </pre>
  );
}

interface TableViewProps {
  data: unknown;
}

function TableView({ data }: TableViewProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-sm text-gray-400">No data to display</div>;
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach((item) => {
    if (item && typeof item === "object") {
      Object.keys(item).forEach((key) => allKeys.add(key));
    }
  });
  const columns = Array.from(allKeys);

  if (columns.length === 0) {
    return <div className="text-sm text-gray-400">No columns to display</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1.5 text-left font-medium text-gray-600"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1.5 text-gray-800">
                  {formatCellValue((row as Record<string, unknown>)?.[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <div className="mt-2 text-xs text-gray-400">
          Showing first 100 of {data.length} rows
        </div>
      )}
    </div>
  );
}

// Helper functions

function isJsonMimeType(mimeType: string): boolean {
  return mimeType.includes("json") || mimeType.includes("javascript");
}

function isJsonContent(content: string | null): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

function parseJson(content: string | null): unknown {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function isArrayOfObjects(content: string | null): boolean {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "object" &&
      parsed[0] !== null
    );
  } catch {
    return false;
  }
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
