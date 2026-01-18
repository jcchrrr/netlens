import { User, Bot, AlertCircle } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/utils/types";
import { cn, formatTime } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "bg-white" : "bg-gray-50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-100" : "bg-purple-100"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Bot className="h-4 w-4 text-purple-600" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
          {message.wasInterrupted && (
            <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
              <AlertCircle className="h-3 w-3" />
              Interrupted
            </span>
          )}
        </div>

        {/* Message body */}
        <div className="text-sm">
          {isUser ? (
            // User messages: plain text
            <p className="whitespace-pre-wrap text-gray-700">{message.content}</p>
          ) : (
            // Assistant messages: markdown
            <>
              <MarkdownRenderer content={message.content} />
              {isStreaming && <StreamingCursor />}
            </>
          )}
        </div>

        {/* Request context indicator */}
        {message.requestContext && message.requestContext.length > 0 && (
          <div className="mt-2">
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
              {message.requestContext.length} request
              {message.requestContext.length > 1 ? "s" : ""} included as context
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block h-4 w-2 animate-pulse bg-gray-400" />
  );
}
