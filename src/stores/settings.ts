import { create } from "zustand";
import type { LLMProvider, CaptureScope, SanitizationRule } from "@/lib/utils/types";
import { generateId } from "@/lib/utils/format";

// Default sanitization rules
const DEFAULT_SANITIZATION_RULES: SanitizationRule[] = [
  {
    id: "default-bearer",
    name: "Bearer Token",
    pattern: "Bearer\\s+[\\w\\-\\.]+",
    replacement: "Bearer [REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: "default-jwt",
    name: "JWT Token",
    pattern: "eyJ[\\w\\-]+\\.eyJ[\\w\\-]+\\.[\\w\\-]+",
    replacement: "[JWT REDACTED]",
    enabled: true,
    isDefault: true,
  },
  {
    id: "default-password",
    name: "Password Field",
    pattern: '"password"\\s*:\\s*"[^"]*"',
    replacement: '"password": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },
  {
    id: "default-token",
    name: "Token Field",
    pattern: '"token"\\s*:\\s*"[^"]*"',
    replacement: '"token": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },
  {
    id: "default-secret",
    name: "Secret Field",
    pattern: '"secret"\\s*:\\s*"[^"]*"',
    replacement: '"secret": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },
  {
    id: "default-api-key",
    name: "API Key Field",
    pattern: '"api_key"\\s*:\\s*"[^"]*"',
    replacement: '"api_key": "[REDACTED]"',
    enabled: true,
    isDefault: true,
  },
];

interface SettingsState {
  // LLM Settings
  provider: LLMProvider;
  claudeApiKey: string;
  openaiApiKey: string;
  ollamaUrl: string;
  ollamaModel: string;

  // Capture Settings
  captureScope: CaptureScope;
  exclusionPatterns: string[];
  maxRequests: number;

  // Sanitization
  sanitizationRules: SanitizationRule[];

  // Privacy
  hasAcceptedPrivacyWarning: boolean;

  // Loading state
  isLoading: boolean;

  // Actions - LLM
  setProvider: (provider: LLMProvider) => void;
  setClaudeApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setOllamaConfig: (url: string, model: string) => void;

  // Actions - Capture
  setCaptureScope: (scope: CaptureScope) => void;
  addExclusionPattern: (pattern: string) => void;
  removeExclusionPattern: (pattern: string) => void;
  setMaxRequests: (max: number) => void;

  // Actions - Sanitization
  addSanitizationRule: (rule: Omit<SanitizationRule, "id" | "isDefault">) => void;
  updateSanitizationRule: (id: string, updates: Partial<SanitizationRule>) => void;
  removeSanitizationRule: (id: string) => void;
  reorderSanitizationRules: (ruleIds: string[]) => void;

  // Actions - Privacy
  acceptPrivacyWarning: () => void;
  resetPrivacyWarning: () => void;

  // Actions - Persistence
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // Getters
  getCurrentApiKey: () => string | undefined;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  provider: "claude",
  claudeApiKey: "",
  openaiApiKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3",
  captureScope: "page",
  exclusionPatterns: [],
  maxRequests: 500,
  sanitizationRules: [...DEFAULT_SANITIZATION_RULES],
  hasAcceptedPrivacyWarning: false,
  isLoading: true,

  // LLM Actions
  setProvider: (provider) => {
    set({ provider });
    get().saveSettings();
  },

  setClaudeApiKey: (key) => {
    set({ claudeApiKey: key });
    get().saveSettings();
  },

  setOpenaiApiKey: (key) => {
    set({ openaiApiKey: key });
    get().saveSettings();
  },

  setOllamaConfig: (url, model) => {
    set({ ollamaUrl: url, ollamaModel: model });
    get().saveSettings();
  },

  // Capture Actions
  setCaptureScope: (scope) => {
    set({ captureScope: scope });
    get().saveSettings();
  },

  addExclusionPattern: (pattern) => {
    set((state) => ({
      exclusionPatterns: [...state.exclusionPatterns, pattern],
    }));
    get().saveSettings();
  },

  removeExclusionPattern: (pattern) => {
    set((state) => ({
      exclusionPatterns: state.exclusionPatterns.filter((p) => p !== pattern),
    }));
    get().saveSettings();
  },

  setMaxRequests: (max) => {
    set({ maxRequests: max });
    get().saveSettings();
  },

  // Sanitization Actions
  addSanitizationRule: (rule) => {
    const newRule: SanitizationRule = {
      ...rule,
      id: generateId(),
      isDefault: false,
    };
    set((state) => ({
      sanitizationRules: [...state.sanitizationRules, newRule],
    }));
    get().saveSettings();
  },

  updateSanitizationRule: (id, updates) => {
    set((state) => ({
      sanitizationRules: state.sanitizationRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    get().saveSettings();
  },

  removeSanitizationRule: (id) => {
    set((state) => ({
      sanitizationRules: state.sanitizationRules.filter((r) => r.id !== id || r.isDefault),
    }));
    get().saveSettings();
  },

  reorderSanitizationRules: (ruleIds) => {
    set((state) => {
      const ruleMap = new Map(state.sanitizationRules.map((r) => [r.id, r]));
      const reordered = ruleIds.map((id) => ruleMap.get(id)).filter(Boolean) as SanitizationRule[];
      return { sanitizationRules: reordered };
    });
    get().saveSettings();
  },

  // Privacy Actions
  acceptPrivacyWarning: () => {
    set({ hasAcceptedPrivacyWarning: true });
    // Note: This is session-scoped, not persisted
  },

  resetPrivacyWarning: () => {
    set({ hasAcceptedPrivacyWarning: false });
  },

  // Persistence Actions
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const result = await chrome.storage.local.get([
        "provider",
        "claudeApiKey",
        "openaiApiKey",
        "ollamaUrl",
        "ollamaModel",
        "captureScope",
        "exclusionPatterns",
        "maxRequests",
        "sanitizationRules",
      ]);

      set({
        provider: result.provider || "claude",
        claudeApiKey: result.claudeApiKey || "",
        openaiApiKey: result.openaiApiKey || "",
        ollamaUrl: result.ollamaUrl || "http://localhost:11434",
        ollamaModel: result.ollamaModel || "llama3",
        captureScope: result.captureScope || "page",
        exclusionPatterns: result.exclusionPatterns || [],
        maxRequests: result.maxRequests || 500,
        sanitizationRules: result.sanitizationRules || [...DEFAULT_SANITIZATION_RULES],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoading: false });
    }
  },

  saveSettings: async () => {
    const state = get();
    try {
      await chrome.storage.local.set({
        provider: state.provider,
        claudeApiKey: state.claudeApiKey,
        openaiApiKey: state.openaiApiKey,
        ollamaUrl: state.ollamaUrl,
        ollamaModel: state.ollamaModel,
        captureScope: state.captureScope,
        exclusionPatterns: state.exclusionPatterns,
        maxRequests: state.maxRequests,
        sanitizationRules: state.sanitizationRules,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  },

  // Getters
  getCurrentApiKey: () => {
    const { provider, claudeApiKey, openaiApiKey } = get();
    switch (provider) {
      case "claude":
        return claudeApiKey;
      case "openai":
        return openaiApiKey;
      case "ollama":
        return undefined; // Ollama doesn't need API key
    }
  },

  isConfigured: () => {
    const { provider, claudeApiKey, openaiApiKey, ollamaUrl } = get();
    switch (provider) {
      case "claude":
        return !!claudeApiKey;
      case "openai":
        return !!openaiApiKey;
      case "ollama":
        return !!ollamaUrl;
    }
  },
}));
