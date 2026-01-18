import {
  Pause,
  Play,
  Trash2,
  Shield,
  Zap,
  HelpCircle,
  Settings,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore } from "@/stores/ui";
import { useChatStore } from "@/stores/chat";
import { useNetLensChat } from "@/lib/llm";
import { cn } from "@/lib/utils";
import type { CaptureScope } from "@/lib/utils/types";

const SCOPE_LABELS: Record<CaptureScope, string> = {
  page: "Page only",
  "page-iframes": "Page + iframes",
  all: "All traffic",
};

export function Toolbar() {
  const isPaused = useRequestsStore((s) => s.isPaused);
  const setPaused = useRequestsStore((s) => s.setPaused);
  const clearRequests = useRequestsStore((s) => s.clearRequests);
  const selected = useRequestsStore((s) => s.selected);

  const captureScope = useSettingsStore((s) => s.captureScope);
  const setCaptureScope = useSettingsStore((s) => s.setCaptureScope);
  const isConfigured = useSettingsStore((s) => s.isConfigured);

  const openSettings = useUIStore((s) => s.openSettings);

  const isStreaming = useChatStore((s) => s.isStreaming);

  const { sendQuickAction } = useNetLensChat();

  const hasSelection = selected.size > 0;
  const canUseActions = hasSelection && isConfigured() && !isStreaming;

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCaptureScope(e.target.value as CaptureScope);
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-3">
      {/* Left side: Logo, Scope, Controls */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-800">NetLens</span>
          <span className="text-[10px] text-gray-400">v0.1</span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-300" />

        {/* Scope dropdown */}
        <div className="relative">
          <select
            value={captureScope}
            onChange={handleScopeChange}
            className="appearance-none rounded border border-gray-300 bg-white py-1 pl-2 pr-7 text-xs text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Pause/Resume button */}
        <button
          type="button"
          onClick={() => setPaused(!isPaused)}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
            isPaused
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          title={isPaused ? "Resume capture" : "Pause capture"}
        >
          {isPaused ? (
            <>
              <Play className="h-3.5 w-3.5" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </>
          )}
        </button>

        {/* Clear button */}
        <button
          type="button"
          onClick={clearRequests}
          className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          title="Clear all requests"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Right side: Quick actions, Settings */}
      <div className="flex items-center gap-2">
        {/* Quick action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => sendQuickAction("security")}
            disabled={!canUseActions}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              canUseActions
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "cursor-not-allowed bg-gray-50 text-gray-400"
            )}
            title="Security audit"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            Security
          </button>

          <button
            type="button"
            onClick={() => sendQuickAction("performance")}
            disabled={!canUseActions}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              canUseActions
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "cursor-not-allowed bg-gray-50 text-gray-400"
            )}
            title="Performance audit"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Perf
          </button>

          <button
            type="button"
            onClick={() => sendQuickAction("explain")}
            disabled={!canUseActions}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              canUseActions
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "cursor-not-allowed bg-gray-50 text-gray-400"
            )}
            title="Explain request"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <HelpCircle className="h-3.5 w-3.5" />
            )}
            Explain
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-300" />

        {/* Settings button */}
        <button
          type="button"
          onClick={openSettings}
          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          title="Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
