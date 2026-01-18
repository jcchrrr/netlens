import { useCallback, useRef } from "react";
import { streamText } from "ai";
import { useRequestsStore } from "@/stores/requests";
import { useSettingsStore } from "@/stores/settings";
import { useChatStore } from "@/stores/chat";
import { sanitizeRequests } from "@/lib/sanitizer";
import { buildContext } from "./context";
import { createLanguageModel } from "./providers";
import { getSystemPrompt, getQuickActionMessage } from "./prompts";
import type { QuickAction } from "@/lib/utils/types";

interface UseNetLensChatReturn {
  sendMessage: (content: string) => Promise<void>;
  sendQuickAction: (action: QuickAction) => Promise<void>;
  stop: () => void;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Custom hook for NetLens chat functionality
 * Handles context building, sanitization, and LLM streaming
 */
export function useNetLensChat(): UseNetLensChatReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store selectors
  const getSelectedRequests = useRequestsStore((s) => s.getSelectedRequests);
  const selected = useRequestsStore((s) => s.selected);

  const provider = useSettingsStore((s) => s.provider);
  const claudeApiKey = useSettingsStore((s) => s.claudeApiKey);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const ollamaModel = useSettingsStore((s) => s.ollamaModel);
  const sanitizationRules = useSettingsStore((s) => s.sanitizationRules);

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage);
  const appendToStream = useChatStore((s) => s.appendToStream);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const setError = useChatStore((s) => s.setError);

  /**
   * Send a message to the LLM
   */
  const sendMessage = useCallback(
    async (content: string, systemPrompt?: string) => {
      if (isStreaming) return;

      // Get selected requests
      const selectedRequests = getSelectedRequests();
      if (selectedRequests.length === 0) {
        setError("No requests selected");
        return;
      }

      // Add user message to chat
      const requestIds = selectedRequests.map((r) => r.id);
      addUserMessage(content, requestIds);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Sanitize requests
        const sanitizedRequests = sanitizeRequests(selectedRequests, sanitizationRules);

        // Build context
        const context = buildContext(sanitizedRequests);

        // Create language model
        const model = createLanguageModel({
          provider,
          claudeApiKey,
          openaiApiKey,
          ollamaUrl,
          ollamaModel,
        });

        // Build message history for the API
        // Include previous messages for context (last 10)
        const historyMessages = messages.slice(-10).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Start assistant message in store
        startAssistantMessage();

        // Stream the response
        const result = streamText({
          model,
          system: systemPrompt || getSystemPrompt("explain"),
          messages: [
            // Include context as first user message if not already in history
            ...(historyMessages.length === 0
              ? [{ role: "user" as const, content: `Here are the HTTP requests to analyze:\n\n${context}` }]
              : []),
            ...historyMessages,
            { role: "user" as const, content: content },
          ],
          abortSignal: abortControllerRef.current.signal,
        });

        // Process the stream
        for await (const chunk of (await result).textStream) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          appendToStream(chunk);
        }

        // Finish streaming
        finishStreaming(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped the stream
          finishStreaming(true);
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "An error occurred";
          setError(errorMessage);
          finishStreaming(true);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      isStreaming,
      getSelectedRequests,
      addUserMessage,
      startAssistantMessage,
      appendToStream,
      finishStreaming,
      setError,
      messages,
      provider,
      claudeApiKey,
      openaiApiKey,
      ollamaUrl,
      ollamaModel,
      sanitizationRules,
    ]
  );

  /**
   * Send a quick action (security audit, performance audit, explain)
   */
  const sendQuickAction = useCallback(
    async (action: QuickAction) => {
      const requestCount = selected.size;
      if (requestCount === 0) {
        setError("No requests selected");
        return;
      }

      const message = getQuickActionMessage(action, requestCount);
      const systemPrompt = getSystemPrompt(action);

      await sendMessage(message, systemPrompt);
    },
    [selected.size, sendMessage, setError]
  );

  /**
   * Stop the current stream
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    sendMessage,
    sendQuickAction,
    stop,
    isStreaming,
    error,
  };
}
