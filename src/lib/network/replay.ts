import type { NetworkRequest, RequestTiming } from "@/lib/utils/types";
import { generateId } from "@/lib/utils/format";

/**
 * Options for replaying a request
 */
export interface ReplayOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

/**
 * Result of a replay operation
 */
export interface ReplayResult {
  success: boolean;
  request?: NetworkRequest;
  error?: string;
}

/**
 * Headers that should not be set manually (browser-controlled)
 */
const FORBIDDEN_HEADERS = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);

/**
 * Filter out headers that cannot be set manually
 */
function filterHeaders(headers: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (!FORBIDDEN_HEADERS.has(lowerKey) && !lowerKey.startsWith("sec-")) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Parse response headers from Headers object
 */
function parseResponseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Replay a network request using fetch
 * Returns a new NetworkRequest with the response
 */
export async function replayRequest(options: ReplayOptions): Promise<ReplayResult> {
  const { method, url, headers, body } = options;

  // Validate URL
  try {
    new URL(url);
  } catch {
    return { success: false, error: "Invalid URL" };
  }

  const startTime = performance.now();
  const timestamp = Date.now();

  try {
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: filterHeaders(headers),
      // Only include body for methods that support it
      body: ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? body : undefined,
      // Don't follow redirects automatically so we can capture them
      redirect: "follow",
      // Include credentials (cookies) for same-origin requests
      credentials: "same-origin",
    };

    // Execute the request
    const response = await fetch(url, fetchOptions);

    // Calculate timing
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Get response body
    const responseText = await response.text();

    // Build timing info (simplified since we don't have detailed browser timing)
    const timing: RequestTiming = {
      blocked: 0,
      dns: 0,
      connect: 0,
      ssl: 0,
      send: 0,
      wait: duration * 0.8, // Estimate: most time is waiting
      receive: duration * 0.2,
    };

    // Determine content type
    const contentType = response.headers.get("content-type") || "";

    // Create the new NetworkRequest
    const replayedRequest: NetworkRequest = {
      id: generateId(),
      timestamp,
      method: method.toUpperCase(),
      url,
      requestHeaders: headers,
      requestBody: body,
      requestBodySize: body ? new TextEncoder().encode(body).length : 0,
      status: response.status,
      statusText: response.statusText,
      responseHeaders: parseResponseHeaders(response.headers),
      responseBody: responseText,
      responseBodySize: new TextEncoder().encode(responseText).length,
      responseMimeType: contentType,
      timing,
      duration,
      isGraphQL: isGraphQLRequest(url, body),
      isWebSocket: false,
      isReplayed: true,
      resourceType: "xhr",
      hasFullResponseBody: true,
    };

    return { success: true, request: replayedRequest };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Request failed";

    // Check for common errors
    if (errorMessage.includes("Failed to fetch")) {
      return {
        success: false,
        error: "Request blocked by CORS or network error. Try from a page on the same domain.",
      };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Simple GraphQL detection for replayed requests
 */
function isGraphQLRequest(url: string, body: string | null): boolean {
  // Check URL
  if (url.includes("/graphql")) {
    return true;
  }

  // Check body
  if (body) {
    try {
      const parsed = JSON.parse(body);
      return "query" in parsed || "mutation" in parsed;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Create ReplayOptions from an existing NetworkRequest
 */
export function createReplayOptions(request: NetworkRequest): ReplayOptions {
  return {
    method: request.method,
    url: request.url,
    headers: { ...request.requestHeaders },
    body: request.requestBody,
  };
}
