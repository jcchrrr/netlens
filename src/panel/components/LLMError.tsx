import { AlertCircle, RefreshCw, Settings, Wifi, Key, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export type LLMErrorType =
  | "api_key"
  | "rate_limit"
  | "network"
  | "server"
  | "context_length"
  | "unknown";

interface LLMErrorProps {
  error: string;
  errorType?: LLMErrorType;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function LLMError({
  error,
  errorType = "unknown",
  onRetry,
  onOpenSettings,
  className,
}: LLMErrorProps) {
  const { icon: Icon, title, suggestion } = getErrorInfo(errorType, error);

  return (
    <div
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 p-4",
        className
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0">
          <Icon className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800">{title}</h4>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          {suggestion && (
            <p className="mt-2 text-xs text-red-600">{suggestion}</p>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 rounded bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
            {onOpenSettings && (errorType === "api_key" || errorType === "server") && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 rounded bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                <Settings className="h-3.5 w-3.5" />
                Open Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorInfo {
  icon: typeof AlertCircle;
  title: string;
  suggestion: string | null;
}

function getErrorInfo(errorType: LLMErrorType, _error: string): ErrorInfo {
  switch (errorType) {
    case "api_key":
      return {
        icon: Key,
        title: "Authentication Error",
        suggestion: "Please check your API key in settings.",
      };
    case "rate_limit":
      return {
        icon: AlertCircle,
        title: "Rate Limited",
        suggestion: "You've exceeded the API rate limit. Please wait a moment before retrying.",
      };
    case "network":
      return {
        icon: Wifi,
        title: "Network Error",
        suggestion: "Please check your internet connection and try again.",
      };
    case "server":
      return {
        icon: Server,
        title: "Server Error",
        suggestion: "The LLM service is experiencing issues. Please try again later.",
      };
    case "context_length":
      return {
        icon: AlertCircle,
        title: "Context Too Long",
        suggestion: "Try selecting fewer requests or using the search filter to narrow down the data.",
      };
    default:
      return {
        icon: AlertCircle,
        title: "Error",
        suggestion: null,
      };
  }
}

/**
 * Detect error type from error message
 */
export function detectErrorType(error: string): LLMErrorType {
  const lowerError = error.toLowerCase();

  if (
    lowerError.includes("api key") ||
    lowerError.includes("apikey") ||
    lowerError.includes("unauthorized") ||
    lowerError.includes("authentication") ||
    lowerError.includes("401")
  ) {
    return "api_key";
  }

  if (
    lowerError.includes("rate limit") ||
    lowerError.includes("ratelimit") ||
    lowerError.includes("too many requests") ||
    lowerError.includes("429")
  ) {
    return "rate_limit";
  }

  if (
    lowerError.includes("network") ||
    lowerError.includes("fetch") ||
    lowerError.includes("connection") ||
    lowerError.includes("timeout") ||
    lowerError.includes("econnrefused")
  ) {
    return "network";
  }

  if (
    lowerError.includes("500") ||
    lowerError.includes("502") ||
    lowerError.includes("503") ||
    lowerError.includes("504") ||
    lowerError.includes("server error")
  ) {
    return "server";
  }

  if (
    lowerError.includes("context") ||
    lowerError.includes("token") ||
    lowerError.includes("too long") ||
    lowerError.includes("maximum")
  ) {
    return "context_length";
  }

  return "unknown";
}
