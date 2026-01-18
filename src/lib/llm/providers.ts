import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { LLMProvider, LLMSettings } from "@/lib/utils/types";

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  claude: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  ollama: "llama3.2",
};

/**
 * Create a language model based on settings
 */
export function createLanguageModel(settings: LLMSettings): LanguageModel {
  switch (settings.provider) {
    case "claude":
      return createClaudeModel(settings.claudeApiKey || "");

    case "openai":
      return createOpenAIModel(settings.openaiApiKey || "");

    case "ollama":
      return createOllamaModel(
        settings.ollamaUrl || "http://localhost:11434",
        settings.ollamaModel || DEFAULT_MODELS.ollama
      );

    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}

/**
 * Create Claude model
 */
function createClaudeModel(apiKey: string): LanguageModel {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic(DEFAULT_MODELS.claude);
}

/**
 * Create OpenAI model
 */
function createOpenAIModel(apiKey: string): LanguageModel {
  const openai = createOpenAI({
    apiKey,
  });

  return openai(DEFAULT_MODELS.openai);
}

/**
 * Create Ollama model (uses OpenAI-compatible API)
 */
function createOllamaModel(baseURL: string, model: string): LanguageModel {
  // Ollama exposes an OpenAI-compatible API
  const ollama = createOpenAI({
    baseURL: `${baseURL}/v1`,
    apiKey: "ollama", // Ollama doesn't require an API key
  });

  return ollama(model);
}

/**
 * Validate an API key by making a minimal request
 */
export async function validateApiKey(
  provider: LLMProvider,
  apiKey: string,
  ollamaUrl?: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case "claude": {
        // Try to list models or make a minimal request
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1,
            messages: [{ role: "user", content: "Hi" }],
          }),
        });

        if (response.status === 401) {
          return { valid: false, error: "Invalid API key" };
        }
        if (response.status === 403) {
          return { valid: false, error: "API key does not have permission" };
        }
        // Even a 400 means the key is valid (just bad request)
        return { valid: true };
      }

      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.status === 401) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      case "ollama": {
        const url = ollamaUrl || "http://localhost:11434";
        const response = await fetch(`${url}/api/tags`);

        if (!response.ok) {
          return { valid: false, error: `Cannot connect to Ollama at ${url}` };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: "Unknown provider" };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return { valid: false, error: message };
  }
}

/**
 * Get available models from Ollama
 */
export async function getOllamaModels(
  baseURL: string = "http://localhost:11434"
): Promise<string[]> {
  try {
    const response = await fetch(`${baseURL}/api/tags`);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    return data.models?.map((m) => m.name) || [];
  } catch {
    return [];
  }
}

/**
 * Get provider display name
 */
export function getProviderName(provider: LLMProvider): string {
  switch (provider) {
    case "claude":
      return "Claude (Anthropic)";
    case "openai":
      return "OpenAI";
    case "ollama":
      return "Ollama (Local)";
    default:
      return provider;
  }
}

/**
 * Check if provider requires an API key
 */
export function requiresApiKey(provider: LLMProvider): boolean {
  return provider === "claude" || provider === "openai";
}
