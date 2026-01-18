import type { SanitizedRequest } from "@/lib/sanitizer";
import { formatDuration, formatBytes } from "@/lib/utils/format";

/**
 * Approximate token count for a string
 * Using ~4 characters per token as a rough estimate
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Maximum tokens to use for context (leaving room for response)
 * Claude has 200k context, but we want to be conservative
 */
const MAX_CONTEXT_TOKENS = 50000;

/**
 * Build context string from sanitized requests
 */
export function buildContext(requests: SanitizedRequest[]): string {
  if (requests.length === 0) {
    return "No requests provided.";
  }

  const sections: string[] = [];

  // Summary section
  sections.push(buildSummarySection(requests));

  // Individual request sections
  for (let i = 0; i < requests.length; i++) {
    const requestSection = buildRequestSection(requests[i], i + 1);
    sections.push(requestSection);
  }

  let context = sections.join("\n\n---\n\n");

  // Truncate if needed
  const estimatedTokens = estimateTokenCount(context);
  if (estimatedTokens > MAX_CONTEXT_TOKENS) {
    context = truncateContext(context, MAX_CONTEXT_TOKENS);
  }

  return context;
}

/**
 * Build summary section
 */
function buildSummarySection(requests: SanitizedRequest[]): string {
  const methods = new Map<string, number>();
  const statusCodes = new Map<number, number>();
  let totalDuration = 0;
  let totalSize = 0;
  let graphqlCount = 0;
  let websocketCount = 0;
  let errorCount = 0;

  for (const req of requests) {
    methods.set(req.method, (methods.get(req.method) || 0) + 1);
    statusCodes.set(req.status, (statusCodes.get(req.status) || 0) + 1);
    totalDuration += req.duration;
    totalSize += req.responseBodySize;
    if (req.isGraphQL) graphqlCount++;
    if (req.isWebSocket) websocketCount++;
    if (req.status >= 400) errorCount++;
  }

  const methodsStr = Array.from(methods.entries())
    .map(([m, c]) => `${m}: ${c}`)
    .join(", ");

  const statusStr = Array.from(statusCodes.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([s, c]) => `${s}: ${c}`)
    .join(", ");

  let summary = `# Request Summary

- **Total Requests**: ${requests.length}
- **Methods**: ${methodsStr}
- **Status Codes**: ${statusStr}
- **Total Duration**: ${formatDuration(totalDuration)}
- **Total Response Size**: ${formatBytes(totalSize)}`;

  if (errorCount > 0) {
    summary += `\n- **Errors**: ${errorCount}`;
  }
  if (graphqlCount > 0) {
    summary += `\n- **GraphQL Requests**: ${graphqlCount}`;
  }
  if (websocketCount > 0) {
    summary += `\n- **WebSocket Connections**: ${websocketCount}`;
  }

  return summary;
}

/**
 * Build section for a single request
 */
function buildRequestSection(request: SanitizedRequest, index: number): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Request ${index}: ${request.method} ${request.url}`);
  lines.push("");

  // Basic info
  lines.push("## Basic Info");
  lines.push(`- **Status**: ${request.status} ${request.statusText}`);
  lines.push(`- **Duration**: ${formatDuration(request.duration)}`);
  lines.push(`- **Response Size**: ${formatBytes(request.responseBodySize)}`);
  if (request.isGraphQL) {
    lines.push(`- **Type**: GraphQL`);
  }
  if (request.isWebSocket) {
    lines.push(`- **Type**: WebSocket`);
  }
  lines.push("");

  // Request headers
  const reqHeaders = Object.entries(request.requestHeaders);
  if (reqHeaders.length > 0) {
    lines.push("## Request Headers");
    lines.push("```");
    for (const [key, value] of reqHeaders) {
      lines.push(`${key}: ${value}`);
    }
    lines.push("```");
    lines.push("");
  }

  // Request body
  if (request.requestBody) {
    lines.push("## Request Body");
    const bodyLanguage = getBodyLanguage(request.requestHeaders["content-type"] || "");
    lines.push(`\`\`\`${bodyLanguage}`);
    lines.push(formatBody(request.requestBody, request.requestBodySize));
    lines.push("```");
    lines.push("");
  }

  // Response headers
  const resHeaders = Object.entries(request.responseHeaders);
  if (resHeaders.length > 0) {
    lines.push("## Response Headers");
    lines.push("```");
    for (const [key, value] of resHeaders) {
      lines.push(`${key}: ${value}`);
    }
    lines.push("```");
    lines.push("");
  }

  // Response body
  if (request.responseBody) {
    lines.push("## Response Body");
    const bodyLanguage = getBodyLanguage(request.responseMimeType);
    lines.push(`\`\`\`${bodyLanguage}`);
    lines.push(formatBody(request.responseBody, request.responseBodySize));
    lines.push("```");
  }

  return lines.join("\n");
}

/**
 * Get code language hint based on content type
 */
function getBodyLanguage(contentType: string): string {
  if (!contentType) return "";

  const ct = contentType.toLowerCase();
  if (ct.includes("json")) return "json";
  if (ct.includes("xml")) return "xml";
  if (ct.includes("html")) return "html";
  if (ct.includes("javascript")) return "javascript";
  if (ct.includes("css")) return "css";
  if (ct.includes("graphql")) return "graphql";

  return "";
}

/**
 * Format and potentially truncate body content
 */
function formatBody(body: string, originalSize: number): string {
  const MAX_BODY_LENGTH = 10000; // 10KB max per body

  // Try to pretty print JSON
  try {
    const parsed = JSON.parse(body);
    body = JSON.stringify(parsed, null, 2);
  } catch {
    // Not JSON, keep as is
  }

  if (body.length > MAX_BODY_LENGTH) {
    const truncated = body.slice(0, MAX_BODY_LENGTH);
    return `${truncated}\n\n... [Truncated - original size: ${formatBytes(originalSize)}]`;
  }

  return body;
}

/**
 * Truncate context to fit within token limit
 */
export function truncateContext(context: string, maxTokens: number): string {
  const maxChars = maxTokens * 4; // Approximate chars from tokens

  if (context.length <= maxChars) {
    return context;
  }

  // Keep summary section intact, truncate from the end
  const summaryEnd = context.indexOf("\n\n---\n\n");
  if (summaryEnd === -1) {
    return context.slice(0, maxChars) + "\n\n[Context truncated due to size]";
  }

  const summary = context.slice(0, summaryEnd);
  const remaining = context.slice(summaryEnd);
  const remainingMaxChars = maxChars - summary.length - 50; // Leave room for truncation notice

  if (remainingMaxChars <= 0) {
    return summary + "\n\n[Request details truncated due to size]";
  }

  const truncatedRemaining = remaining.slice(0, remainingMaxChars);
  // Try to cut at a request boundary
  const lastRequestBoundary = truncatedRemaining.lastIndexOf("\n\n---\n\n");
  if (lastRequestBoundary > 0) {
    return summary + truncatedRemaining.slice(0, lastRequestBoundary) + "\n\n[Some requests truncated due to size]";
  }

  return summary + truncatedRemaining + "\n\n[Context truncated due to size]";
}

/**
 * Format requests into a compact format for conversation history
 */
export function formatRequestsForHistory(requests: SanitizedRequest[]): string {
  if (requests.length === 0) return "No requests";

  if (requests.length === 1) {
    const r = requests[0];
    return `${r.method} ${r.url} (${r.status})`;
  }

  return `${requests.length} requests: ${requests.slice(0, 3).map((r) => `${r.method} ${getUrlPath(r.url)}`).join(", ")}${requests.length > 3 ? ", ..." : ""}`;
}

function getUrlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
