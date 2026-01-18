import { useRef, useEffect, useCallback } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { useRequestsStore } from "@/stores/requests";
import { useSettingsStore } from "@/stores/settings";
import { useChatStore } from "@/stores/chat";
import { useUIStore } from "@/stores/ui";
import { useNetLensChat } from "@/lib/llm";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { LLMError, detectErrorType } from "./LLMError";

export function ChatPanel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Requests store
  const selected = useRequestsStore((s) => s.selected);

  // Settings store
  const isConfigured = useSettingsStore((s) => s.isConfigured);

  // Chat store
  const messages = useChatStore((s) => s.messages);
  const currentStreamingId = useChatStore((s) => s.currentStreamingId);
  const clearChat = useChatStore((s) => s.clearChat);
  const clearError = useChatStore((s) => s.clearError);

  // UI store
  const openSettings = useUIStore((s) => s.openSettings);

  // LLM chat hook
  const { sendMessage, stop, isStreaming, error } = useNetLensChat();

  const hasSelection = selected.size > 0;
  const configured = isConfigured();
  const hasMessages = messages.length > 0;

  // Handle retry from error component
  const handleRetry = useCallback(() => {
    clearError();
    // User can re-submit their message manually
  }, [clearError]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Determine placeholder text
  const getPlaceholder = () => {
    if (!configured) return "Configure API key first...";
    if (!hasSelection) return "Select requests first...";
    return `Ask about ${selected.size} selected request${selected.size > 1 ? "s" : ""}...`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      {hasMessages && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2">
          <span className="text-sm font-medium text-gray-700">Chat</span>
          <button
            type="button"
            onClick={clearChat}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          // Empty state
          <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
            <MessageSquare className="mb-3 h-12 w-12 stroke-1" />
            <p className="text-sm font-medium">
              {!configured
                ? "Configure your API key"
                : !hasSelection
                  ? "Select requests to analyze"
                  : "Ask a question about your requests"}
            </p>
            <p className="mt-1 text-center text-xs">
              {!configured
                ? "Click the settings icon to add your API key"
                : !hasSelection
                  ? "Use checkboxes to select requests from the list"
                  : "The selected requests will be sent as context"}
            </p>
          </div>
        ) : (
          // Messages list
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={message.id === currentStreamingId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 border-t border-gray-200 p-3">
          <LLMError
            error={error}
            errorType={detectErrorType(error)}
            onRetry={handleRetry}
            onOpenSettings={openSettings}
          />
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={!configured || !hasSelection}
        placeholder={getPlaceholder()}
      />
    </div>
  );
}
