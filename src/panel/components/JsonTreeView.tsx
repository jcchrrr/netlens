import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonTreeViewProps {
  data: unknown;
  initialDepth?: number;
  rootName?: string;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function JsonTreeView({ data, initialDepth = 2, rootName }: JsonTreeViewProps) {
  return (
    <div className="font-mono text-xs">
      <JsonNode
        name={rootName}
        value={data as JsonValue}
        depth={0}
        initialDepth={initialDepth}
      />
    </div>
  );
}

interface JsonNodeProps {
  name?: string;
  value: JsonValue;
  depth: number;
  initialDepth: number;
}

function JsonNode({ name, value, depth, initialDepth }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < initialDepth);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  }, [value]);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;

  // Render primitive values
  if (!isObject) {
    return (
      <div className="group flex items-center gap-1 py-0.5">
        {name !== undefined && (
          <>
            <span className="text-purple-600">{name}</span>
            <span className="text-gray-500">:</span>
          </>
        )}
        <PrimitiveValue value={value} />
        <button
          type="button"
          onClick={handleCopy}
          className="ml-1 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    );
  }

  // Render empty object/array
  if (isEmpty) {
    return (
      <div className="flex items-center gap-1 py-0.5">
        {name !== undefined && (
          <>
            <span className="text-purple-600">{name}</span>
            <span className="text-gray-500">:</span>
          </>
        )}
        <span className="text-gray-500">{isArray ? "[]" : "{}"}</span>
      </div>
    );
  }

  const entries = isArray
    ? (value as JsonValue[]).map((v, i) => [i.toString(), v] as const)
    : Object.entries(value as Record<string, JsonValue>);
  const count = entries.length;
  const preview = isArray ? `Array(${count})` : `{${count} ${count === 1 ? "key" : "keys"}}`;

  return (
    <div>
      {/* Header row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex cursor-pointer items-center gap-1 py-0.5 hover:bg-gray-50"
      >
        <span className="text-gray-400">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
        {name !== undefined && (
          <>
            <span className="text-purple-600">{name}</span>
            <span className="text-gray-500">:</span>
          </>
        )}
        <span className="text-gray-400">{preview}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-1 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>

      {/* Children */}
      {isExpanded && (
        <div className="ml-4 border-l border-gray-200 pl-2">
          {entries.map(([key, val]) => (
            <JsonNode
              key={key}
              name={key}
              value={val}
              depth={depth + 1}
              initialDepth={initialDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrimitiveValue({ value }: { value: string | number | boolean | null }) {
  if (value === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-blue-600">{value.toString()}</span>;
  }

  if (typeof value === "number") {
    return <span className="text-green-600">{value}</span>;
  }

  // String
  const str = value as string;
  const isLong = str.length > 100;
  const displayStr = isLong ? str.slice(0, 100) + "..." : str;

  return (
    <span className={cn("text-amber-600", isLong && "cursor-help")} title={isLong ? str : undefined}>
      "{displayStr}"
    </span>
  );
}
