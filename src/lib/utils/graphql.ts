import type { NetworkRequest } from "./types";
import { safeJsonParse } from "./format";

/**
 * GraphQL operation parsed from request body
 */
export interface GraphQLOperation {
  query: string;
  operationName?: string;
  variables?: Record<string, unknown>;
}

/**
 * Check if a request is a GraphQL request
 * Detection based on:
 * 1. URL contains /graphql
 * 2. Body contains query or mutation field
 * 3. Content-Type is application/json
 */
export function isGraphQLRequest(request: NetworkRequest): boolean {
  // Check URL
  const urlLower = request.url.toLowerCase();
  const hasGraphQLUrl = urlLower.includes("/graphql");

  // Check Content-Type
  const contentType = Object.entries(request.requestHeaders).find(
    ([key]) => key.toLowerCase() === "content-type"
  )?.[1];
  const isJsonContent = contentType?.includes("application/json");

  // Check body for GraphQL structure
  if (request.requestBody && isJsonContent) {
    const parsed = safeJsonParse(request.requestBody);
    if (parsed && typeof parsed === "object") {
      const body = parsed as Record<string, unknown>;
      const hasQuery = typeof body.query === "string";
      const hasMutation =
        typeof body.query === "string" &&
        body.query.trim().startsWith("mutation");

      if (hasQuery || hasMutation) {
        return true;
      }
    }
  }

  // If URL contains graphql and it's a POST with JSON, likely GraphQL
  if (hasGraphQLUrl && request.method === "POST" && isJsonContent) {
    return true;
  }

  return false;
}

/**
 * Parse GraphQL operation from request body
 */
export function parseGraphQLOperation(body: string): GraphQLOperation | null {
  const parsed = safeJsonParse(body);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.query !== "string") {
    return null;
  }

  return {
    query: data.query,
    operationName:
      typeof data.operationName === "string" ? data.operationName : undefined,
    variables:
      typeof data.variables === "object" && data.variables !== null
        ? (data.variables as Record<string, unknown>)
        : undefined,
  };
}

/**
 * Extract operation type from GraphQL query
 */
export function getGraphQLOperationType(
  query: string
): "query" | "mutation" | "subscription" | null {
  const trimmed = query.trim();

  if (trimmed.startsWith("mutation")) return "mutation";
  if (trimmed.startsWith("subscription")) return "subscription";
  if (trimmed.startsWith("query") || trimmed.startsWith("{")) return "query";

  return null;
}

/**
 * Extract operation name from GraphQL query
 */
export function getGraphQLOperationName(query: string): string | null {
  // Match: query OperationName or mutation OperationName
  const match = query.match(/^(?:query|mutation|subscription)\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Format GraphQL query with proper indentation
 */
export function formatGraphQLQuery(query: string): string {
  let formatted = "";
  let indentLevel = 0;
  const indent = "  ";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    const prevChar = i > 0 ? query[i - 1] : "";

    // Handle strings
    if ((char === '"' || char === "'") && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      formatted += char;
      continue;
    }

    if (inString) {
      formatted += char;
      continue;
    }

    // Handle braces
    if (char === "{") {
      formatted += " {\n";
      indentLevel++;
      formatted += indent.repeat(indentLevel);
    } else if (char === "}") {
      indentLevel--;
      formatted += "\n" + indent.repeat(indentLevel) + "}";
    } else if (char === "\n") {
      // Skip existing newlines, we add our own
    } else if (char === " " || char === "\t") {
      // Collapse whitespace
      if (formatted.length > 0 && !formatted.endsWith(" ") && !formatted.endsWith("\n")) {
        formatted += " ";
      }
    } else {
      formatted += char;
    }
  }

  return formatted.trim();
}

/**
 * Get a summary of GraphQL operation for display
 */
export function getGraphQLSummary(request: NetworkRequest): string | null {
  if (!request.requestBody) return null;

  const operation = parseGraphQLOperation(request.requestBody);
  if (!operation) return null;

  const type = getGraphQLOperationType(operation.query);
  const name = operation.operationName || getGraphQLOperationName(operation.query);

  if (type && name) {
    return `${type} ${name}`;
  }

  if (type) {
    return type;
  }

  return "GraphQL";
}
