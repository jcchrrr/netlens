import type { SanitizationRule } from "@/lib/utils/types";
import { generateId } from "@/lib/utils/format";

/**
 * Default sanitization patterns for common sensitive data
 * These patterns are enabled by default and cannot be deleted (only disabled)
 */
export const DEFAULT_SANITIZATION_RULES: SanitizationRule[] = [
  // Authentication tokens
  {
    id: generateId(),
    name: "Bearer Token",
    pattern: "Bearer\\s+[A-Za-z0-9\\-_]+\\.?[A-Za-z0-9\\-_]*\\.?[A-Za-z0-9\\-_]*",
    replacement: "Bearer [REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "JWT Token",
    pattern: "eyJ[A-Za-z0-9\\-_]+\\.eyJ[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+",
    replacement: "[JWT REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "Basic Auth",
    pattern: "Basic\\s+[A-Za-z0-9+/=]+",
    replacement: "Basic [REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // API Keys (common patterns)
  {
    id: generateId(),
    name: "API Key Header",
    pattern: "(x-api-key|api-key|apikey):\\s*[A-Za-z0-9\\-_]+",
    replacement: "$1: [REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "API Key in JSON",
    pattern: '"(api_?key|apiKey|api-key)"\\s*:\\s*"[^"]*"',
    replacement: '"$1": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },

  // Passwords
  {
    id: generateId(),
    name: "Password in JSON",
    pattern: '"(password|passwd|pwd|secret)"\\s*:\\s*"[^"]*"',
    replacement: '"$1": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "Password in URL",
    pattern: "(password|passwd|pwd)=[^&\\s]+",
    replacement: "$1=[REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // Session and Cookies
  {
    id: generateId(),
    name: "Session ID",
    pattern: "(session_?id|sessionId|PHPSESSID|JSESSIONID)\\s*[=:]\\s*[A-Za-z0-9\\-_]+",
    replacement: "$1=[REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "Cookie Header",
    pattern: "Cookie:\\s*[^\\n]+",
    replacement: "Cookie: [REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "Set-Cookie Header",
    pattern: "Set-Cookie:\\s*[^\\n]+",
    replacement: "Set-Cookie: [REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // Personal Information
  {
    id: generateId(),
    name: "Email Address",
    pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    replacement: "[EMAIL REDACTED]",
    enabled: false, // Disabled by default - might be needed for debugging
    isDefault: true,
  },
  {
    id: generateId(),
    name: "Credit Card Number",
    pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b",
    replacement: "[CARD REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "SSN (US)",
    pattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
    replacement: "[SSN REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // Cloud Provider Keys
  {
    id: generateId(),
    name: "AWS Access Key",
    pattern: "AKIA[0-9A-Z]{16}",
    replacement: "[AWS KEY REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "AWS Secret Key",
    pattern: "[A-Za-z0-9/+=]{40}",
    replacement: "[AWS SECRET REDACTED]",
    enabled: false, // Too broad, disabled by default
    isDefault: true,
  },

  // Private Keys
  {
    id: generateId(),
    name: "Private Key",
    pattern: "-----BEGIN\\s+(?:RSA\\s+)?PRIVATE\\s+KEY-----[\\s\\S]*?-----END\\s+(?:RSA\\s+)?PRIVATE\\s+KEY-----",
    replacement: "[PRIVATE KEY REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // OAuth
  {
    id: generateId(),
    name: "OAuth Token",
    pattern: "(access_token|refresh_token|oauth_token)\\s*[=:]\\s*[A-Za-z0-9\\-_]+",
    replacement: "$1=[REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // GitHub/GitLab tokens
  {
    id: generateId(),
    name: "GitHub Token",
    pattern: "(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}",
    replacement: "[GITHUB TOKEN REDACTED]",
    enabled: true,
    isDefault: true,
  },

  // Anthropic/OpenAI API Keys
  {
    id: generateId(),
    name: "Anthropic API Key",
    pattern: "sk-ant-[A-Za-z0-9\\-_]{32,}",
    replacement: "[ANTHROPIC KEY REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: generateId(),
    name: "OpenAI API Key",
    pattern: "sk-[A-Za-z0-9]{32,}",
    replacement: "[OPENAI KEY REDACTED]",
    enabled: true,
    isDefault: true,
  },
];

/**
 * Create a new custom sanitization rule
 */
export function createSanitizationRule(
  name: string,
  pattern: string,
  replacement: string
): SanitizationRule {
  return {
    id: generateId(),
    name,
    pattern,
    replacement,
    enabled: true,
    isDefault: false,
  };
}
