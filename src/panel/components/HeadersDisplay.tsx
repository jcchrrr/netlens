import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeadersDisplayProps {
  headers: Record<string, string>;
  type?: "request" | "response";
}

// Important headers to highlight
const IMPORTANT_HEADERS = new Set([
  // Request headers
  "authorization",
  "content-type",
  "accept",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-api-key",
  "x-auth-token",
  // Response headers
  "set-cookie",
  "cache-control",
  "content-length",
  "content-encoding",
  "access-control-allow-origin",
  "x-request-id",
  "x-correlation-id",
  "location",
]);

// Security-sensitive headers to mark differently
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
]);

export function HeadersDisplay({ headers, type = "request" }: HeadersDisplayProps) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">
        No {type} headers
      </div>
    );
  }

  // Sort: important headers first, then alphabetically
  const sortedEntries = [...entries].sort((a, b) => {
    const aImportant = IMPORTANT_HEADERS.has(a[0].toLowerCase());
    const bImportant = IMPORTANT_HEADERS.has(b[0].toLowerCase());
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="divide-y divide-gray-100">
      {sortedEntries.map(([name, value]) => (
        <HeaderRow key={name} name={name} value={value} />
      ))}
    </div>
  );
}

interface HeaderRowProps {
  name: string;
  value: string;
}

function HeaderRow({ name, value }: HeaderRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  }, [value]);

  const lowerName = name.toLowerCase();
  const isImportant = IMPORTANT_HEADERS.has(lowerName);
  const isSensitive = SENSITIVE_HEADERS.has(lowerName);

  return (
    <div className="group flex items-start gap-2 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              isImportant ? "text-blue-600" : "text-gray-600"
            )}
          >
            {name}
          </span>
          {isSensitive && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
              sensitive
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-0.5 break-all font-mono text-xs",
            isSensitive ? "text-gray-400" : "text-gray-800"
          )}
        >
          {isSensitive ? maskSensitiveValue(value) : value}
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
        title="Copy value"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function maskSensitiveValue(value: string): string {
  if (value.length <= 8) {
    return "••••••••";
  }
  // Show first 4 chars, mask the rest
  return value.slice(0, 4) + "••••" + "••••";
}
