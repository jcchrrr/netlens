import type { NetworkRequest, RequestTiming } from "@/lib/utils/types";
import { generateId } from "@/lib/utils/format";
import { isGraphQLRequest } from "@/lib/utils/graphql";

/**
 * Maximum body size to store in memory (500KB)
 * Larger bodies will be lazy-loaded
 */
const MAX_BODY_SIZE = 500 * 1024;

/**
 * Timing object structure from HAR entries
 */
interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  receive?: number;
}

/**
 * Parse timing information from HAR entry
 */
function parseTiming(entry: chrome.devtools.network.Request): RequestTiming {
  // Access timings from the HAR entry (it's part of the HAR spec)
  const timings = (entry as unknown as { timings?: HarTimings }).timings;

  if (!timings) {
    return {
      blocked: 0,
      dns: 0,
      connect: 0,
      ssl: 0,
      send: 0,
      wait: 0,
      receive: 0,
    };
  }

  return {
    blocked: Math.max(0, timings.blocked || 0),
    dns: Math.max(0, timings.dns || 0),
    connect: Math.max(0, timings.connect || 0),
    ssl: Math.max(0, timings.ssl || 0),
    send: Math.max(0, timings.send || 0),
    wait: Math.max(0, timings.wait || 0),
    receive: Math.max(0, timings.receive || 0),
  };
}

/**
 * Parse headers from HAR format to Record
 */
function parseHeaders(
  headers: chrome.devtools.network.Request["request"]["headers"]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const header of headers) {
    result[header.name] = header.value;
  }
  return result;
}

/**
 * Get request body from HAR entry
 */
function getRequestBody(entry: chrome.devtools.network.Request): string | null {
  const postData = entry.request.postData;
  if (!postData) return null;

  // If we have text content, return it
  if (postData.text) {
    return postData.text;
  }

  // If we have params (form data), serialize them
  if (postData.params && postData.params.length > 0) {
    return postData.params.map((p) => `${p.name}=${p.value || ""}`).join("&");
  }

  return null;
}

/**
 * Calculate total request body size
 */
function getRequestBodySize(entry: chrome.devtools.network.Request): number {
  const postData = entry.request.postData;
  if (!postData) return 0;

  if (postData.text) {
    return new Blob([postData.text]).size;
  }

  return 0;
}

/**
 * Determine resource type from entry
 */
function getResourceType(entry: chrome.devtools.network.Request): string {
  // The _resourceType property is available in Chrome DevTools
  const resourceType = (entry as { _resourceType?: string })._resourceType;
  if (resourceType) return resourceType;

  // Fallback: infer from MIME type
  const mimeType = entry.response.content.mimeType || "";

  if (mimeType.includes("json")) return "fetch";
  if (mimeType.includes("javascript")) return "script";
  if (mimeType.includes("css")) return "stylesheet";
  if (mimeType.includes("html")) return "document";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("font")) return "font";

  return "other";
}

/**
 * Check if request is a WebSocket upgrade
 */
function isWebSocketRequest(entry: chrome.devtools.network.Request): boolean {
  const upgradeHeader = entry.request.headers.find(
    (h) => h.name.toLowerCase() === "upgrade"
  );
  return upgradeHeader?.value.toLowerCase() === "websocket";
}

/**
 * Parse a HAR entry into our NetworkRequest format
 */
export async function parseHarEntry(
  entry: chrome.devtools.network.Request
): Promise<NetworkRequest> {
  const requestHeaders = parseHeaders(entry.request.headers);
  const responseHeaders = parseHeaders(entry.response.headers);
  const requestBody = getRequestBody(entry);
  const timing = parseTiming(entry);

  // Calculate duration
  const duration = entry.time || 0;

  // Get response body size
  const responseBodySize = entry.response.content.size || 0;

  // Determine if we should load the full body now or lazy-load
  const shouldLoadBody = responseBodySize <= MAX_BODY_SIZE;

  let responseBody: string | null = null;
  let hasFullResponseBody = false;

  if (shouldLoadBody) {
    try {
      responseBody = await new Promise<string>((resolve, reject) => {
        entry.getContent((content, _encoding) => {
          if (content === undefined) {
            reject(new Error("No content"));
          } else {
            resolve(content || "");
          }
        });
      });
      hasFullResponseBody = true;
    } catch {
      // Content not available
      responseBody = null;
      hasFullResponseBody = false;
    }
  }

  // Create lazy loader for large bodies
  const getFullResponseBody = !shouldLoadBody
    ? async (): Promise<string> => {
        return new Promise((resolve, reject) => {
          entry.getContent((content, _encoding) => {
            if (content === undefined) {
              reject(new Error("No content"));
            } else {
              resolve(content || "");
            }
          });
        });
      }
    : undefined;

  const request: NetworkRequest = {
    id: generateId(),
    timestamp: new Date(entry.startedDateTime).getTime(),

    // Request
    method: entry.request.method,
    url: entry.request.url,
    requestHeaders,
    requestBody,
    requestBodySize: getRequestBodySize(entry),

    // Response
    status: entry.response.status,
    statusText: entry.response.statusText,
    responseHeaders,
    responseBody,
    responseBodySize,
    responseMimeType: entry.response.content.mimeType || "",

    // Timing
    timing,
    duration,

    // Metadata
    isGraphQL: false, // Will be set below
    isWebSocket: isWebSocketRequest(entry),
    isReplayed: false,
    resourceType: getResourceType(entry),

    // Lazy loading
    hasFullResponseBody,
    getFullResponseBody,
  };

  // Check if it's a GraphQL request
  request.isGraphQL = isGraphQLRequest(request);

  return request;
}

/**
 * Check if URL matches any exclusion pattern
 */
export function matchesExclusionPattern(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    try {
      // Try as regex first
      const regex = new RegExp(pattern, "i");
      if (regex.test(url)) return true;
    } catch {
      // If not valid regex, try as glob-like pattern
      const globRegex = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special chars
        .replace(/\*/g, ".*") // Convert * to .*
        .replace(/\?/g, "."); // Convert ? to .

      try {
        const regex = new RegExp(globRegex, "i");
        if (regex.test(url)) return true;
      } catch {
        // Invalid pattern, skip
      }
    }
  }
  return false;
}
