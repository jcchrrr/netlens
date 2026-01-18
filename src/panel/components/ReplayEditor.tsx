import { useState, useCallback } from "react";
import { Play, X, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { NetworkRequest } from "@/lib/utils/types";
import type { ReplayOptions } from "@/lib/network";
import { replayRequest, createReplayOptions } from "@/lib/network";
import { useRequestsStore } from "@/stores/requests";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

interface ReplayEditorProps {
  request: NetworkRequest;
  onClose: () => void;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function ReplayEditor({ request, onClose }: ReplayEditorProps) {
  const addRequest = useRequestsStore((s) => s.addRequest);
  const openDrawer = useUIStore((s) => s.openDrawer);

  // Initialize state from request
  const initialOptions = createReplayOptions(request);
  const [method, setMethod] = useState(initialOptions.method);
  const [url, setUrl] = useState(initialOptions.url);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    Object.entries(initialOptions.headers).map(([key, value]) => ({ key, value }))
  );
  const [body, setBody] = useState(initialOptions.body || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert headers array to object
  const headersToObject = useCallback((): Record<string, string> => {
    const obj: Record<string, string> = {};
    for (const { key, value } of headers) {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
    }
    return obj;
  }, [headers]);

  // Handle header changes
  const updateHeader = (index: number, field: "key" | "value", newValue: string) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: newValue } : h))
    );
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  // Execute replay
  const handleReplay = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const options: ReplayOptions = {
      method,
      url,
      headers: headersToObject(),
      body: ["POST", "PUT", "PATCH"].includes(method) ? body : null,
    };

    const result = await replayRequest(options);

    setIsLoading(false);

    if (result.success && result.request) {
      // Add the replayed request to the store
      addRequest(result.request);
      // Open drawer for the new request
      openDrawer(result.request.id);
      // Close editor
      onClose();
    } else {
      setError(result.error || "Replay failed");
    }
  }, [method, url, body, headersToObject, addRequest, openDrawer, onClose]);

  const showBody = ["POST", "PUT", "PATCH"].includes(method);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-blue-50 px-3 py-2">
        <span className="text-sm font-medium text-blue-700">Edit & Replay</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-blue-600 hover:bg-blue-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {/* Method and URL */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Headers */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Headers</label>
              <button
                type="button"
                onClick={addHeader}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    placeholder="Header name"
                    className="w-1/3 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(index)}
                    className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {headers.length === 0 && (
                <p className="text-xs text-gray-400">No headers</p>
              )}
            </div>
          </div>

          {/* Body (for POST/PUT/PATCH) */}
          {showBody && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Request Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {/* Format JSON button */}
              <button
                type="button"
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(JSON.parse(body), null, 2);
                    setBody(formatted);
                  } catch {
                    // Not valid JSON, ignore
                  }
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
              >
                Format JSON
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReplay}
            disabled={isLoading || !url.trim()}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white",
              isLoading || !url.trim()
                ? "cursor-not-allowed bg-blue-300"
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
