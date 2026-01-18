import { create } from "zustand";
import type { ChatMessage } from "@/lib/utils/types";
import { generateId } from "@/lib/utils/format";

const SESSION_STORAGE_KEY = "netlens-chat";
const MAX_SAVED_MESSAGES = 10;

interface ChatState {
  // Data
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  currentStreamingId: string | null;

  // Error state
  error: string | null;

  // Actions
  addUserMessage: (content: string, requestContext?: string[]) => string;
  startAssistantMessage: () => string;
  appendToStream: (chunk: string) => void;
  finishStreaming: (wasInterrupted?: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  clearError: () => void;

  // Session storage
  saveToSession: () => void;
  loadFromSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isStreaming: false,
  currentStreamingId: null,
  error: null,

  // Actions
  addUserMessage: (content, requestContext) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: "user",
      content,
      timestamp: Date.now(),
      requestContext,
    };

    set((state) => ({
      messages: [...state.messages, message],
      error: null,
    }));

    get().saveToSession();
    return id;
  },

  startAssistantMessage: () => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, message],
      isStreaming: true,
      currentStreamingId: id,
      error: null,
    }));

    return id;
  },

  appendToStream: (chunk) => {
    set((state) => {
      if (!state.currentStreamingId) return state;

      return {
        messages: state.messages.map((m) =>
          m.id === state.currentStreamingId ? { ...m, content: m.content + chunk } : m
        ),
      };
    });
  },

  finishStreaming: (wasInterrupted = false) => {
    set((state) => {
      const messages = wasInterrupted
        ? state.messages.map((m) =>
            m.id === state.currentStreamingId ? { ...m, wasInterrupted: true } : m
          )
        : state.messages;

      return {
        messages,
        isStreaming: false,
        currentStreamingId: null,
      };
    });

    get().saveToSession();
  },

  setError: (error) => {
    set({ error, isStreaming: false, currentStreamingId: null });
  },

  clearChat: () => {
    set({
      messages: [],
      isStreaming: false,
      currentStreamingId: null,
      error: null,
    });
    get().saveToSession();
  },

  clearError: () => {
    set({ error: null });
  },

  // Session storage
  saveToSession: () => {
    try {
      const { messages } = get();
      const toSave = messages.slice(-MAX_SAVED_MESSAGES);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore storage errors
    }
  },

  loadFromSession: () => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const messages = JSON.parse(saved) as ChatMessage[];
        set({ messages });
      }
    } catch {
      // Ignore storage errors
    }
  },
}));
