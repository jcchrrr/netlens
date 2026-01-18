/**
 * Format bytes to human readable string
 * @example formatBytes(1024) => "1.0 KB"
 * @example formatBytes(1536) => "1.5 KB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Show decimal only for KB and above
  if (i === 0) {
    return `${bytes} B`;
  }

  return `${value.toFixed(1)} ${units[i]}`;
}

/**
 * Format duration in milliseconds to human readable string
 * @example formatDuration(234) => "234ms"
 * @example formatDuration(1500) => "1.5s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Truncate URL for display
 * @example truncateUrl("https://api.example.com/very/long/path", 30) => "https://api.example.com/ve..."
 */
export function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength - 3)}...`;
}

/**
 * Extract pathname from URL for compact display
 * @example getUrlPath("https://api.example.com/users/123?foo=bar") => "/users/123"
 */
export function getUrlPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

/**
 * Extract host from URL
 * @example getUrlHost("https://api.example.com/users") => "api.example.com"
 */
export function getUrlHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return url;
  }
}

/**
 * Get Tailwind color class for HTTP method
 */
export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-yellow-100 text-yellow-700",
    PATCH: "bg-orange-100 text-orange-700",
    DELETE: "bg-red-100 text-red-700",
    OPTIONS: "bg-gray-100 text-gray-700",
    HEAD: "bg-purple-100 text-purple-700",
  };

  return colors[method.toUpperCase()] || "bg-gray-100 text-gray-700";
}

/**
 * Get Tailwind color class for HTTP status code
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "text-green-600";
  }
  if (status >= 300 && status < 400) {
    return "text-blue-600";
  }
  if (status >= 400 && status < 500) {
    return "text-orange-600";
  }
  if (status >= 500) {
    return "text-red-600";
  }
  return "text-gray-600";
}

/**
 * Check if status code indicates an error
 */
export function isErrorStatus(status: number): boolean {
  return status >= 400;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format timestamp to time string
 * @example formatTime(Date.now()) => "14:32:05"
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Parse JSON safely, return null on failure
 */
export function safeJsonParse(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Check if string is valid JSON
 */
export function isValidJson(str: string): boolean {
  return safeJsonParse(str) !== null;
}

/**
 * Pretty print JSON with indentation
 */
export function prettyJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
