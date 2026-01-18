import { useState, useCallback } from "react";
import { Plus, X, Info } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";
import type { CaptureScope } from "@/lib/utils/types";

const SCOPE_OPTIONS: { value: CaptureScope; label: string; description: string }[] = [
  {
    value: "page",
    label: "Page only",
    description: "Only capture requests from the main page",
  },
  {
    value: "page-iframes",
    label: "Page + iframes",
    description: "Include requests from embedded iframes",
  },
  {
    value: "all",
    label: "All traffic",
    description: "Capture all network traffic",
  },
];

export function CaptureConfig() {
  const captureScope = useSettingsStore((s) => s.captureScope);
  const setCaptureScope = useSettingsStore((s) => s.setCaptureScope);
  const exclusionPatterns = useSettingsStore((s) => s.exclusionPatterns);
  const addExclusionPattern = useSettingsStore((s) => s.addExclusionPattern);
  const removeExclusionPattern = useSettingsStore((s) => s.removeExclusionPattern);
  const maxRequests = useSettingsStore((s) => s.maxRequests);
  const setMaxRequests = useSettingsStore((s) => s.setMaxRequests);

  const [newPattern, setNewPattern] = useState("");
  const [patternError, setPatternError] = useState<string | null>(null);

  const handleAddPattern = useCallback(() => {
    const pattern = newPattern.trim();
    if (!pattern) return;

    // Validate pattern
    if (exclusionPatterns.includes(pattern)) {
      setPatternError("Pattern already exists");
      return;
    }

    // Try to compile as regex to validate
    try {
      new RegExp(pattern);
    } catch {
      setPatternError("Invalid regex pattern");
      return;
    }

    addExclusionPattern(pattern);
    setNewPattern("");
    setPatternError(null);
  }, [newPattern, exclusionPatterns, addExclusionPattern]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPattern();
    }
  };

  return (
    <div className="space-y-4">
      {/* Capture scope */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Capture Scope
        </label>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                captureScope === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="captureScope"
                value={option.value}
                checked={captureScope === option.value}
                onChange={() => setCaptureScope(option.value)}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {option.label}
                </div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Exclusion patterns */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Exclusion Patterns
          </label>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-gray-400" />
            <div className="absolute bottom-full left-0 mb-1 hidden w-48 rounded bg-gray-800 p-2 text-xs text-white group-hover:block">
              Regex patterns for URLs to exclude from capture
            </div>
          </div>
        </div>

        {/* Pattern list */}
        {exclusionPatterns.length > 0 && (
          <div className="mb-2 space-y-1">
            {exclusionPatterns.map((pattern) => (
              <div
                key={pattern}
                className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5"
              >
                <code className="text-xs text-gray-600">{pattern}</code>
                <button
                  type="button"
                  onClick={() => removeExclusionPattern(pattern)}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new pattern */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPattern}
            onChange={(e) => {
              setNewPattern(e.target.value);
              setPatternError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., \.png$|\.jpg$"
            className={cn(
              "flex-1 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1",
              patternError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            )}
          />
          <button
            type="button"
            onClick={handleAddPattern}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {patternError && (
          <p className="mt-1 text-xs text-red-600">{patternError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Common patterns: analytics, fonts, images
        </p>
      </div>

      {/* Max requests (FIFO limit) */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Max Requests
          </label>
          <span className="text-sm text-gray-500">{maxRequests}</span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={100}
          value={maxRequests}
          onChange={(e) => setMaxRequests(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>100</span>
          <span>2000</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Older requests are removed when limit is reached (FIFO)
        </p>
      </div>
    </div>
  );
}
