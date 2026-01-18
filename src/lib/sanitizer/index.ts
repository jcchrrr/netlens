import type { NetworkRequest, SanitizationRule } from "@/lib/utils/types";

/**
 * Sanitize a string value using the provided rules
 */
export function sanitizeValue(value: string, rules: SanitizationRule[]): string {
  if (!value) return value;

  let sanitized = value;
  const enabledRules = rules.filter((r) => r.enabled);

  for (const rule of enabledRules) {
    try {
      const regex = new RegExp(rule.pattern, "gi");
      sanitized = sanitized.replace(regex, rule.replacement);
    } catch (e) {
      // Invalid regex pattern, skip this rule
      console.warn(`Invalid sanitization pattern for rule "${rule.name}":`, e);
    }
  }

  return sanitized;
}

/**
 * Sanitize headers object
 */
export function sanitizeHeaders(
  headers: Record<string, string>,
  rules: SanitizationRule[]
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    // Sanitize the header value
    sanitized[key] = sanitizeValue(value, rules);
  }

  return sanitized;
}

/**
 * Sanitize a network request for sending to LLM
 * Creates a new object with sanitized values
 */
export function sanitizeRequest(
  request: NetworkRequest,
  rules: SanitizationRule[]
): SanitizedRequest {
  return {
    id: request.id,
    timestamp: request.timestamp,
    method: request.method,
    url: sanitizeValue(request.url, rules),
    status: request.status,
    statusText: request.statusText,
    duration: request.duration,
    requestHeaders: sanitizeHeaders(request.requestHeaders, rules),
    requestBody: request.requestBody ? sanitizeValue(request.requestBody, rules) : null,
    requestBodySize: request.requestBodySize,
    responseHeaders: sanitizeHeaders(request.responseHeaders, rules),
    responseBody: request.responseBody ? sanitizeValue(request.responseBody, rules) : null,
    responseBodySize: request.responseBodySize,
    responseMimeType: request.responseMimeType,
    isGraphQL: request.isGraphQL,
    isWebSocket: request.isWebSocket,
  };
}

/**
 * Sanitize multiple requests
 */
export function sanitizeRequests(
  requests: NetworkRequest[],
  rules: SanitizationRule[]
): SanitizedRequest[] {
  return requests.map((r) => sanitizeRequest(r, rules));
}

/**
 * A sanitized version of NetworkRequest (without lazy loading functions)
 */
export interface SanitizedRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  requestBodySize: number;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseBodySize: number;
  responseMimeType: string;
  isGraphQL: boolean;
  isWebSocket: boolean;
}

/**
 * Preview what sanitization will do to a value
 * Returns an object with before/after and what rules matched
 */
export function previewSanitization(
  value: string,
  rules: SanitizationRule[]
): SanitizationPreview {
  const matchedRules: string[] = [];
  let sanitized = value;

  const enabledRules = rules.filter((r) => r.enabled);

  for (const rule of enabledRules) {
    try {
      const regex = new RegExp(rule.pattern, "gi");
      if (regex.test(value)) {
        matchedRules.push(rule.name);
      }
      sanitized = sanitized.replace(regex, rule.replacement);
    } catch {
      // Invalid regex, skip
    }
  }

  return {
    original: value,
    sanitized,
    matchedRules,
    hasChanges: value !== sanitized,
  };
}

export interface SanitizationPreview {
  original: string;
  sanitized: string;
  matchedRules: string[];
  hasChanges: boolean;
}

// Re-export patterns
export { DEFAULT_SANITIZATION_RULES, createSanitizationRule } from "./patterns";
