// ============================================================================
// Network Request Types
// ============================================================================

export interface RequestTiming {
  blocked: number;
  dns: number;
  connect: number;
  ssl: number;
  send: number;
  wait: number;
  receive: number;
}

export interface NetworkRequest {
  id: string;
  timestamp: number;

  // Request
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  requestBodySize: number;

  // Response
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseBodySize: number;
  responseMimeType: string;

  // Timing
  timing: RequestTiming;
  duration: number;

  // Metadata
  isGraphQL: boolean;
  isWebSocket: boolean;
  isReplayed: boolean;
  resourceType: string;

  // For lazy loading large bodies
  hasFullResponseBody: boolean;
  getFullResponseBody?: () => Promise<string>;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketMessage {
  id: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  data: string;
  opcode: number;
}

export interface WebSocketConnection extends NetworkRequest {
  messages: WebSocketMessage[];
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;

  // User message specific
  requestContext?: string[]; // IDs of requests included as context

  // Assistant message specific
  wasInterrupted?: boolean;
}

// ============================================================================
// LLM Types
// ============================================================================

export type LLMProvider = "claude" | "openai" | "ollama";

export interface LLMSettings {
  provider: LLMProvider;
  claudeApiKey?: string;
  openaiApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

export type QuickAction = "security" | "performance" | "explain";

// ============================================================================
// Sanitization Types
// ============================================================================

export interface SanitizationRule {
  id: string;
  name: string;
  pattern: string; // Regex pattern as string
  replacement: string;
  enabled: boolean;
  isDefault: boolean; // Default rules can't be deleted
}

// ============================================================================
// Capture Types
// ============================================================================

export type CaptureScope = "page" | "page-iframes" | "all";

export interface CaptureSettings {
  scope: CaptureScope;
  exclusionPatterns: string[];
  maxRequests: number;
}

// ============================================================================
// Custom Rules Types (v0.3)
// ============================================================================

export type RuleField = "url" | "method" | "status" | "size";
export type RuleOperator =
  | "contains"
  | "equals"
  | "greater_than"
  | "less_than"
  | "matches_regex";

export interface CustomRule {
  id: string;
  name: string;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  enabled: boolean;
}

// ============================================================================
// UI Types
// ============================================================================

export type DrawerTab = "request" | "response" | "timing";
export type BodyViewMode = "tree" | "raw" | "table";
