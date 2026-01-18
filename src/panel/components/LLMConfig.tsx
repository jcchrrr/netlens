import { useState, useCallback, useEffect } from "react";
import { Check, X, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { validateApiKey, getOllamaModels, getProviderName } from "@/lib/llm";
import { cn } from "@/lib/utils";
import type { LLMProvider } from "@/lib/utils/types";

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export function LLMConfig() {
  const provider = useSettingsStore((s) => s.provider);
  const claudeApiKey = useSettingsStore((s) => s.claudeApiKey);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const ollamaModel = useSettingsStore((s) => s.ollamaModel);

  const setProvider = useSettingsStore((s) => s.setProvider);
  const setClaudeApiKey = useSettingsStore((s) => s.setClaudeApiKey);
  const setOpenaiApiKey = useSettingsStore((s) => s.setOpenaiApiKey);
  const setOllamaConfig = useSettingsStore((s) => s.setOllamaConfig);

  // Local state
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Get current API key based on provider
  const currentApiKey = provider === "claude" ? claudeApiKey : openaiApiKey;

  // Load Ollama models when URL changes
  useEffect(() => {
    if (provider === "ollama") {
      loadOllamaModels();
    }
  }, [provider, ollamaUrl]);

  const loadOllamaModels = useCallback(async () => {
    setLoadingModels(true);
    const models = await getOllamaModels(ollamaUrl);
    setOllamaModels(models);
    setLoadingModels(false);

    // Auto-select first model if current is not in list
    if (models.length > 0 && !models.includes(ollamaModel)) {
      setOllamaConfig(ollamaUrl, models[0]);
    }
  }, [ollamaUrl, ollamaModel, setOllamaConfig]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setValidationStatus("idle");
    setValidationError(null);
  };

  const handleApiKeyChange = (key: string) => {
    if (provider === "claude") {
      setClaudeApiKey(key);
    } else {
      setOpenaiApiKey(key);
    }
    setValidationStatus("idle");
    setValidationError(null);
  };

  const handleValidate = useCallback(async () => {
    if (provider === "ollama") {
      setValidationStatus("validating");
      const result = await validateApiKey("ollama", "", ollamaUrl);
      setValidationStatus(result.valid ? "valid" : "invalid");
      setValidationError(result.error || null);
    } else {
      if (!currentApiKey) {
        setValidationError("Please enter an API key");
        return;
      }
      setValidationStatus("validating");
      const result = await validateApiKey(provider, currentApiKey);
      setValidationStatus(result.valid ? "valid" : "invalid");
      setValidationError(result.error || null);
    }
  }, [provider, currentApiKey, ollamaUrl]);

  return (
    <div className="space-y-4">
      {/* Provider selector */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Provider
        </label>
        <div className="flex gap-2">
          {(["claude", "openai", "ollama"] as LLMProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                provider === p
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {getProviderName(p).split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* API Key input (Claude/OpenAI) */}
      {provider !== "ollama" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={currentApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={
                provider === "claude"
                  ? "sk-ant-..."
                  : "sk-..."
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-20 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title={showApiKey ? "Hide" : "Show"}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {provider === "claude"
              ? "Get your API key from console.anthropic.com"
              : "Get your API key from platform.openai.com"}
          </p>
        </div>
      )}

      {/* Ollama configuration */}
      {provider === "ollama" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ollama URL
            </label>
            <input
              type="url"
              value={ollamaUrl}
              onChange={(e) => setOllamaConfig(e.target.value, ollamaModel)}
              placeholder="http://localhost:11434"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Default: http://localhost:11434
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Model</label>
              <button
                type="button"
                onClick={loadOllamaModels}
                disabled={loadingModels}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <RefreshCw
                  className={cn("h-3 w-3", loadingModels && "animate-spin")}
                />
                Refresh
              </button>
            </div>
            <select
              value={ollamaModel}
              onChange={(e) => setOllamaConfig(ollamaUrl, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ollamaModels.length === 0 ? (
                <option value="">No models found</option>
              ) : (
                ollamaModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              )}
            </select>
            {ollamaModels.length === 0 && !loadingModels && (
              <p className="mt-1 text-xs text-amber-600">
                Make sure Ollama is running and has models installed
              </p>
            )}
          </div>
        </>
      )}

      {/* Validation button and status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleValidate}
          disabled={validationStatus === "validating"}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {validationStatus === "validating" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </span>
          ) : (
            "Test Connection"
          )}
        </button>

        {/* Status indicator */}
        {validationStatus === "valid" && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Connected
          </span>
        )}
        {validationStatus === "invalid" && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <X className="h-4 w-4" />
            {validationError || "Connection failed"}
          </span>
        )}
      </div>
    </div>
  );
}
