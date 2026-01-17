# NetLens — Implementation Guide

This document provides a step-by-step implementation guide for NetLens, based on the specifications in [SPECS.md](./SPECS.md).

---

## Table of Contents

1. [Implementation Phases](#implementation-phases)
2. [Phase 0: Project Setup](#phase-0-project-setup)
3. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
4. [Phase 2: Network Capture](#phase-2-network-capture)
5. [Phase 3: Request List UI](#phase-3-request-list-ui)
6. [Phase 4: Request Detail Drawer](#phase-4-request-detail-drawer)
7. [Phase 5: Chat Panel](#phase-5-chat-panel)
8. [Phase 6: LLM Integration](#phase-6-llm-integration)
9. [Phase 7: Settings & Storage](#phase-7-settings--storage)
10. [Phase 8: Replay Feature](#phase-8-replay-feature)
11. [Phase 9: Polish & Edge Cases](#phase-9-polish--edge-cases)
12. [TypeScript Interfaces](#typescript-interfaces)
13. [File Reference](#file-reference)

---

## Implementation Phases

```
Phase 0: Project Setup
    ↓
Phase 1: Core Infrastructure (types, stores, storage)
    ↓
Phase 2: Network Capture (chrome.devtools.network)
    ↓
Phase 3: Request List UI (list, selection, favorites)
    ↓
Phase 4: Request Detail Drawer (tabs, JSON view)
    ↓
Phase 5: Chat Panel (messages, input, markdown)
    ↓
Phase 6: LLM Integration (providers, streaming, sanitization)
    ↓
Phase 7: Settings & Storage (API keys, encryption)
    ↓
Phase 8: Replay Feature (edit, re-execute)
    ↓
Phase 9: Polish & Edge Cases (responsive, errors, WebSocket)
```

---

## Phase 0: Project Setup

### 0.1 Initialize Project

```bash
mkdir netlens && cd netlens
pnpm init
pnpm create vite . --template react-ts
```

### 0.2 Install Dependencies

```bash
# Core
pnpm add react react-dom zustand
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai

# UI
pnpm add react-markdown prismjs
pnpm add lucide-react
pnpm add clsx tailwind-merge

# Dev
pnpm add -D typescript @types/react @types/react-dom @types/prismjs
pnpm add -D vite @vitejs/plugin-react
pnpm add -D @crxjs/vite-plugin@beta
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @biomejs/biome
```

### 0.3 shadcn/ui Setup

```bash
pnpm dlx shadcn@latest init
# Select: TypeScript, Default style, CSS variables, tailwind.config.ts

# Add components we'll need
pnpm dlx shadcn@latest add button input textarea tabs checkbox
pnpm dlx shadcn@latest add dropdown-menu dialog sheet badge
pnpm dlx shadcn@latest add scroll-area separator tooltip
```

### 0.4 Create File Structure

```bash
mkdir -p src/{panel/components,stores,lib/{network,llm,sanitizer,storage,utils}}
mkdir -p public/icons
```

### 0.5 Configuration Files

**Files to create:**
- `vite.config.ts` — Vite + CRXJS configuration
- `tailwind.config.ts` — Tailwind configuration
- `tsconfig.json` — TypeScript configuration
- `biome.json` — Biome linter/formatter configuration
- `manifest.json` — Chrome extension manifest
- `src/devtools.html` — DevTools entry HTML
- `src/devtools.ts` — Creates the panel
- `src/panel/index.html` — Panel HTML
- `src/panel/index.tsx` — Panel React entry

---

## Phase 1: Core Infrastructure

### 1.1 TypeScript Types

**File: `src/lib/utils/types.ts`**

Core type definitions used throughout the app:
- `NetworkRequest` — Captured request data structure
- `ChatMessage` — Chat message structure
- `LLMProvider` — Provider enum (claude, openai, ollama)
- `LLMSettings` — Provider configuration
- `SanitizationRule` — Sanitization rule structure
- `CaptureScope` — Scope enum (page, iframes, all)

### 1.2 Utility Functions

**File: `src/lib/utils/format.ts`**

Formatting utilities:
- `formatBytes(bytes: number): string` — "1.5 KB", "2.3 MB"
- `formatDuration(ms: number): string` — "234ms", "1.2s"
- `truncateUrl(url: string, maxLength: number): string`
- `getMethodColor(method: string): string` — Tailwind color class

**File: `src/lib/utils/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 1.3 Zustand Stores

**File: `src/stores/requests.ts`**

Manages captured requests:
- `requests: NetworkRequest[]` — All captured requests (FIFO limited)
- `favorites: Set<string>` — Favorited request IDs
- `selected: Set<string>` — Selected request IDs
- `isPaused: boolean` — Capture paused state
- `searchQuery: string` — Current search filter
- `maxRequests: number` — FIFO limit (default 500)

Actions:
- `addRequest(req)` — Add request, enforce FIFO
- `toggleFavorite(id)` — Toggle favorite status
- `toggleSelected(id)` — Toggle selection
- `selectAll()` / `deselectAll()` — Bulk selection
- `clearRequests()` — Clear all requests
- `setPaused(paused)` — Toggle capture
- `setSearchQuery(query)` — Update search filter

Selectors:
- `getFilteredRequests()` — Requests matching search
- `getSelectedRequests()` — Full request objects for selected IDs
- `getFavoriteRequests()` — Full request objects for favorites

**File: `src/stores/chat.ts`**

Manages chat state:
- `messages: ChatMessage[]` — Conversation history
- `isStreaming: boolean` — LLM currently responding
- `currentStreamingContent: string` — Partial response during stream
- `error: string | null` — Last error message

Actions:
- `addUserMessage(content, requestContext)` — Add user message
- `startStreaming()` — Begin LLM response
- `appendToStream(chunk)` — Add streaming chunk
- `finishStreaming(wasInterrupted)` — Complete response
- `setError(error)` — Set error state
- `clearChat()` — Clear conversation

**File: `src/stores/settings.ts`**

Manages settings (persisted to chrome.storage):
- `provider: LLMProvider` — Active LLM provider
- `apiKeys: Record<LLMProvider, string>` — Encrypted API keys
- `ollamaUrl: string` — Ollama endpoint URL
- `ollamaModel: string` — Selected Ollama model
- `captureScope: CaptureScope` — Current capture scope
- `exclusionPatterns: string[]` — URL patterns to exclude
- `maxRequests: number` — FIFO limit
- `hasAcceptedPrivacyWarning: boolean` — Session-scoped

Actions:
- `setProvider(provider)` — Switch active provider
- `setApiKey(provider, key)` — Store encrypted key
- `setOllamaConfig(url, model)` — Configure Ollama
- `setCaptureScope(scope)` — Update scope
- `addExclusionPattern(pattern)` / `removeExclusionPattern(pattern)`
- `setMaxRequests(limit)` — Update FIFO limit
- `acceptPrivacyWarning()` — Mark warning as shown

**File: `src/stores/ui.ts`**

Manages UI state:
- `activeRequestId: string | null` — Request shown in drawer
- `isDrawerOpen: boolean` — Drawer visibility
- `isSettingsOpen: boolean` — Settings modal visibility
- `favoritesExpanded: boolean` — Favorites section collapsed state

Actions:
- `openDrawer(requestId)` — Open drawer for request
- `closeDrawer()` — Close drawer
- `openSettings()` / `closeSettings()` — Settings modal
- `toggleFavoritesExpanded()` — Collapse/expand favorites

---

## Phase 2: Network Capture

### 2.1 Network Capture Module

**File: `src/lib/network/capture.ts`**

Wraps `chrome.devtools.network` API:

```typescript
export function startCapture(options: CaptureOptions): () => void
```

Responsibilities:
- Listen to `chrome.devtools.network.onRequestFinished`
- Parse HAR entries into `NetworkRequest` objects
- Filter by scope (page only, iframes, all)
- Filter by exclusion patterns
- Call store's `addRequest()` for each valid request
- Return cleanup function to stop listening

### 2.2 HAR Parser

**File: `src/lib/network/parser.ts`**

Converts HAR entries to our format:

```typescript
export function parseHarEntry(entry: chrome.devtools.network.Request): NetworkRequest
```

Responsibilities:
- Extract method, URL, status, timing
- Parse request/response headers
- Get body content (with size limits)
- Detect content type
- Handle encoding issues gracefully
- Detect GraphQL requests

### 2.3 GraphQL Detection

**File: `src/lib/utils/graphql.ts`**

```typescript
export function isGraphQLRequest(request: NetworkRequest): boolean
export function parseGraphQLBody(body: string): { query: string; variables?: object }
export function formatGraphQLQuery(query: string): string
```

---

## Phase 3: Request List UI

### 3.1 Main App Layout

**File: `src/panel/App.tsx`**

Main layout component:
- Toolbar at top
- 50/50 split: RequestList (left) + ChatPanel (right)
- Drawer overlay (right side)
- Settings modal
- Privacy warning modal
- Responsive: stacked layout < 400px width

### 3.2 Toolbar

**File: `src/panel/components/Toolbar.tsx`**

Contains:
- Scope dropdown (Page only / Page + iframes / All)
- Pause/Resume toggle button
- Clear button
- Quick action buttons (Security, Performance, Explain) with icons
- Settings gear icon (right-aligned)

### 3.3 Request List

**File: `src/panel/components/RequestList.tsx`**

Main list component:
- Search input at top
- Favorites section (collapsible)
- Request items with checkboxes
- "Select all" checkbox in header
- Virtualization if needed for performance (consider `@tanstack/react-virtual`)

### 3.4 Request Item

**File: `src/panel/components/RequestItem.tsx`**

Single request row:
- Checkbox (for selection)
- Star icon (for favorites)
- Method badge (colored)
- URL (truncated)
- Status badge (colored for errors)
- Size
- Duration
- "Replay" badge if replayed
- Click row → open drawer
- Click checkbox → toggle selection

### 3.5 Favorites Section

**File: `src/panel/components/FavoritesSection.tsx`**

Collapsible section:
- Header: "⭐ Favorites (N)" with expand/collapse chevron
- List of favorited RequestItem components
- Separator below

### 3.6 Search Bar

**File: `src/panel/components/SearchBar.tsx`**

Simple search input:
- Placeholder: "Search requests..."
- Debounced input → updates store's searchQuery
- Clear button when has value

---

## Phase 4: Request Detail Drawer

### 4.1 Drawer Container

**File: `src/panel/components/RequestDrawer.tsx`**

Sheet/drawer component:
- Slides from right
- Fixed 400px width
- Close button (X)
- Click outside to close
- Contains tabs and content

### 4.2 Drawer Tabs

**File: `src/panel/components/DrawerTabs.tsx`**

Tab navigation:
- Request tab (headers + body)
- Response tab (headers + body)
- Timing tab (timing breakdown)
- Replay button in header (opens edit mode)

### 4.3 Headers Display

**File: `src/panel/components/HeadersDisplay.tsx`**

Key-value display for headers:
- Copyable values
- Highlighting for important headers

### 4.4 Body Display

**File: `src/panel/components/BodyDisplay.tsx`**

Body content with view modes:
- Sub-tabs: Tree / Raw / Table (for JSON)
- Lazy loading for >500KB
- "Load full content" button for large bodies
- Content-type aware rendering

### 4.5 JSON Tree View

**File: `src/panel/components/JsonTreeView.tsx`**

Custom recursive component:
- Expand/collapse nodes
- Syntax coloring by type (string=green, number=blue, etc.)
- Copy value on click
- Initial expansion depth configurable
- Performance: virtualize large arrays

```typescript
interface JsonTreeViewProps {
  data: unknown
  initialDepth?: number
  onCopy?: (path: string, value: unknown) => void
}
```

### 4.6 Timing Display

**File: `src/panel/components/TimingDisplay.tsx`**

Shows timing breakdown:
- DNS lookup
- TCP connection
- TLS handshake
- Time to first byte
- Content download
- Total time (highlighted)

---

## Phase 5: Chat Panel

### 5.1 Chat Panel Container

**File: `src/panel/components/ChatPanel.tsx`**

Main chat container:
- Messages list (scrollable)
- Input area at bottom
- Empty state when no messages

### 5.2 Chat Message

**File: `src/panel/components/ChatMessage.tsx`**

Single message display:
- User messages: right-aligned, styled differently
- Assistant messages: left-aligned, markdown rendered
- "[Interrupted]" badge for stopped messages
- Request context indicator (which requests were included)

### 5.3 Chat Input

**File: `src/panel/components/ChatInput.tsx`**

Input area:
- Textarea (auto-resize)
- Send button
- Stop button (when streaming)
- Disabled state when no requests selected or no API key

### 5.4 Markdown Renderer

**File: `src/panel/components/MarkdownRenderer.tsx`**

Wraps react-markdown:
- Custom code block renderer (with Prism)
- Link handling (open in new tab)
- Safe HTML rendering

### 5.5 Code Block

**File: `src/panel/components/CodeBlock.tsx`**

Syntax-highlighted code:
- Prism.js highlighting
- Copy button (top-right)
- Language label
- Line numbers optional

### 5.6 Empty State

**File: `src/panel/components/ChatEmptyState.tsx`**

Shown when chat is empty:
- Instruction text: "Select requests and ask a question"
- Optional: quick action suggestions

---

## Phase 6: LLM Integration

### 6.1 Provider Configuration

**File: `src/lib/llm/providers.ts`**

Provider setup for Vercel AI SDK:

```typescript
export function createProvider(settings: LLMSettings): LanguageModel
export function validateApiKey(provider: LLMProvider, key: string): Promise<boolean>
export function getAvailableOllamaModels(url: string): Promise<string[]>
```

### 6.2 System Prompts

**File: `src/lib/llm/prompts.ts`**

Fixed prompts:

```typescript
export const SECURITY_AUDIT_PROMPT: string
export const PERFORMANCE_AUDIT_PROMPT: string
export const EXPLANATION_PROMPT: string

export function getSystemPrompt(action: 'security' | 'performance' | 'explain'): string
```

### 6.3 Context Builder

**File: `src/lib/llm/context.ts`**

Builds LLM context from requests:

```typescript
export function buildContext(requests: NetworkRequest[]): string
export function estimateTokenCount(text: string): number
export function truncateContext(context: string, maxTokens: number): string
```

### 6.4 Chat Hook

**File: `src/lib/llm/useChat.ts`**

Custom hook wrapping Vercel AI SDK:

```typescript
export function useNetLensChat() {
  // Returns: messages, sendMessage, stop, isStreaming, error
  // Handles: context building, sanitization, streaming, error handling
}
```

### 6.5 Sanitizer

**File: `src/lib/sanitizer/index.ts`**

Main sanitization logic:

```typescript
export function sanitize(request: NetworkRequest, rules: SanitizationRule[]): NetworkRequest
export function sanitizeValue(value: string, rules: SanitizationRule[]): string
```

**File: `src/lib/sanitizer/patterns.ts`**

Default patterns:

```typescript
export const DEFAULT_PATTERNS: SanitizationRule[] = [
  { name: 'Bearer Token', pattern: /Bearer\s+[\w-]+/gi, replacement: 'Bearer [REDACTED]' },
  { name: 'JWT', pattern: /eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, replacement: '[JWT REDACTED]' },
  { name: 'Password Field', pattern: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password": "[REDACTED]"' },
  // ... more patterns
]
```

---

## Phase 7: Settings & Storage

### 7.1 Encrypted Storage

**File: `src/lib/storage/encrypted.ts`**

API key encryption:

```typescript
export async function encryptApiKey(key: string): Promise<string>
export async function decryptApiKey(encrypted: string): Promise<string>
// Uses AES-GCM with key derived from extension ID via PBKDF2
```

### 7.2 Chrome Storage Wrapper

**File: `src/lib/storage/settings.ts`**

Persistence layer:

```typescript
export async function loadSettings(): Promise<Partial<SettingsState>>
export async function saveSettings(settings: Partial<SettingsState>): Promise<void>
export function subscribeToSettings(callback: (settings: SettingsState) => void): () => void
```

### 7.3 Settings Modal

**File: `src/panel/components/SettingsModal.tsx`**

Modal container with sections:
- LLM Configuration
- Capture Settings
- Close button

### 7.4 LLM Config Section

**File: `src/panel/components/LLMConfig.tsx`**

Provider configuration UI:
- Provider selector (Claude / OpenAI / Ollama)
- API key input (for Claude/OpenAI)
- Test connection button
- Ollama URL + model selector
- Connection status indicator

### 7.5 Capture Config Section

**File: `src/panel/components/CaptureConfig.tsx`**

Capture settings UI:
- Scope dropdown
- Exclusion patterns list (add/remove)
- FIFO limit slider

### 7.6 Privacy Warning Modal

**File: `src/panel/components/PrivacyWarning.tsx`**

First-time warning modal:
- Warning text about data being sent to LLM
- "View what will be sent" button (shows sanitized preview)
- Accept / Cancel buttons
- Only shown once per session

---

## Phase 8: Replay Feature

### 8.1 Replay Module

**File: `src/lib/network/replay.ts`**

Request replay logic:

```typescript
export async function replayRequest(request: NetworkRequest): Promise<NetworkRequest>
// Uses fetch() to re-execute the request
// Returns a new NetworkRequest with the response
```

### 8.2 Replay Editor

**File: `src/panel/components/ReplayEditor.tsx`**

Edit mode in drawer:
- URL input (editable)
- Method selector
- Headers editor (key-value pairs, add/remove)
- Body editor (textarea or JSON editor)
- Replay button
- Cancel button (exits edit mode)

---

## Phase 9: Polish & Edge Cases

### 9.1 WebSocket View

**File: `src/panel/components/WebSocketView.tsx`**

Split view for WebSocket messages:
- Two columns: Incoming / Outgoing
- Synchronized scroll by timestamp
- Message display with timestamp and content

### 9.2 Error Handling

**File: `src/panel/components/ErrorBoundary.tsx`**

React error boundary:
- Catches rendering errors
- Shows fallback UI
- Retry button

**File: `src/panel/components/LLMError.tsx`**

LLM error display:
- Error message
- Details (if available)
- Retry button

### 9.3 Responsive Layout

Update `App.tsx`:
- Detect width < 400px
- Switch to stacked layout (list above, chat below)
- Adjust drawer behavior for narrow screens

### 9.4 Session Storage for Chat

**File: `src/lib/storage/session.ts`**

Chat persistence:

```typescript
export function saveChatToSession(messages: ChatMessage[]): void
export function loadChatFromSession(): ChatMessage[]
// Saves last 10 messages to sessionStorage
```

### 9.5 Loading States

Add loading states throughout:
- API key validation in progress
- Initial settings loading
- Large body loading

---

## TypeScript Interfaces

### NetworkRequest

```typescript
interface NetworkRequest {
  id: string
  timestamp: number

  // Request
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody: string | null
  requestBodySize: number

  // Response
  status: number
  statusText: string
  responseHeaders: Record<string, string>
  responseBody: string | null
  responseBodySize: number
  responseMimeType: string

  // Timing
  timing: RequestTiming
  duration: number

  // Metadata
  isGraphQL: boolean
  isWebSocket: boolean
  isReplayed: boolean
  resourceType: string

  // For lazy loading
  hasFullResponseBody: boolean
  getFullResponseBody?: () => Promise<string>
}

interface RequestTiming {
  blocked: number
  dns: number
  connect: number
  ssl: number
  send: number
  wait: number
  receive: number
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number

  // User message specific
  requestContext?: string[]  // IDs of requests included as context

  // Assistant message specific
  wasInterrupted?: boolean
}
```

### LLMSettings

```typescript
type LLMProvider = 'claude' | 'openai' | 'ollama'

interface LLMSettings {
  provider: LLMProvider
  claudeApiKey?: string
  openaiApiKey?: string
  ollamaUrl?: string
  ollamaModel?: string
}
```

### SanitizationRule

```typescript
interface SanitizationRule {
  id: string
  name: string
  pattern: RegExp | string
  replacement: string
  enabled: boolean
  isDefault: boolean  // Default rules can't be deleted
}
```

### CaptureScope

```typescript
type CaptureScope = 'page' | 'page-iframes' | 'all'

interface CaptureSettings {
  scope: CaptureScope
  exclusionPatterns: string[]
  maxRequests: number
}
```

---

## File Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome extension manifest (MV3) |
| `vite.config.ts` | Vite + CRXJS build configuration |
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `biome.json` | Biome linter/formatter rules |
| `package.json` | Dependencies and scripts |

### Entry Points

| File | Purpose |
|------|---------|
| `src/devtools.html` | DevTools page HTML (loads devtools.ts) |
| `src/devtools.ts` | Creates the NetLens panel in DevTools |
| `src/panel/index.html` | Panel HTML (loads React app) |
| `src/panel/index.tsx` | React app entry point |
| `src/panel/App.tsx` | Main app component and layout |

### Stores (Zustand)

| File | Purpose |
|------|---------|
| `src/stores/requests.ts` | Captured requests, selection, favorites |
| `src/stores/chat.ts` | Chat messages, streaming state |
| `src/stores/settings.ts` | LLM config, capture settings |
| `src/stores/ui.ts` | Drawer, modal, UI state |

### Components

| File | Purpose |
|------|---------|
| `src/panel/components/Toolbar.tsx` | Top toolbar with actions |
| `src/panel/components/RequestList.tsx` | Main request list container |
| `src/panel/components/RequestItem.tsx` | Single request row |
| `src/panel/components/FavoritesSection.tsx` | Collapsible favorites |
| `src/panel/components/SearchBar.tsx` | Request search input |
| `src/panel/components/RequestDrawer.tsx` | Detail drawer container |
| `src/panel/components/DrawerTabs.tsx` | Request/Response/Timing tabs |
| `src/panel/components/HeadersDisplay.tsx` | Headers key-value display |
| `src/panel/components/BodyDisplay.tsx` | Body with view modes |
| `src/panel/components/JsonTreeView.tsx` | Custom JSON tree component |
| `src/panel/components/TimingDisplay.tsx` | Timing breakdown |
| `src/panel/components/ChatPanel.tsx` | Chat container |
| `src/panel/components/ChatMessage.tsx` | Single chat message |
| `src/panel/components/ChatInput.tsx` | Chat input with send/stop |
| `src/panel/components/MarkdownRenderer.tsx` | Markdown rendering |
| `src/panel/components/CodeBlock.tsx` | Syntax highlighted code |
| `src/panel/components/ChatEmptyState.tsx` | Empty chat placeholder |
| `src/panel/components/SettingsModal.tsx` | Settings modal container |
| `src/panel/components/LLMConfig.tsx` | LLM provider settings |
| `src/panel/components/CaptureConfig.tsx` | Capture settings |
| `src/panel/components/PrivacyWarning.tsx` | First-use warning modal |
| `src/panel/components/ReplayEditor.tsx` | Request edit for replay |
| `src/panel/components/WebSocketView.tsx` | WebSocket message view |
| `src/panel/components/ErrorBoundary.tsx` | Error boundary |
| `src/panel/components/LLMError.tsx` | LLM error display |

### Library Modules

| File | Purpose |
|------|---------|
| `src/lib/network/capture.ts` | chrome.devtools.network wrapper |
| `src/lib/network/parser.ts` | HAR entry parser |
| `src/lib/network/replay.ts` | Request replay logic |
| `src/lib/llm/providers.ts` | LLM provider setup |
| `src/lib/llm/prompts.ts` | System prompts |
| `src/lib/llm/context.ts` | Context builder for LLM |
| `src/lib/llm/useChat.ts` | Chat hook |
| `src/lib/sanitizer/index.ts` | Main sanitization logic |
| `src/lib/sanitizer/patterns.ts` | Default patterns |
| `src/lib/storage/encrypted.ts` | API key encryption |
| `src/lib/storage/settings.ts` | Chrome storage wrapper |
| `src/lib/storage/session.ts` | Session storage for chat |
| `src/lib/utils/types.ts` | TypeScript type definitions |
| `src/lib/utils/format.ts` | Formatting utilities |
| `src/lib/utils/cn.ts` | Class name utility |
| `src/lib/utils/graphql.ts` | GraphQL detection |

---

## Implementation Checklist

### Phase 0: Project Setup
- [ ] Initialize project with Vite
- [ ] Install all dependencies
- [ ] Setup shadcn/ui
- [ ] Create file structure
- [ ] Configure Vite + CRXJS
- [ ] Configure TypeScript
- [ ] Configure Tailwind
- [ ] Configure Biome
- [ ] Create manifest.json
- [ ] Create devtools entry files
- [ ] Create panel entry files
- [ ] Verify extension loads in Chrome

### Phase 1: Core Infrastructure
- [ ] Define TypeScript types
- [ ] Create utility functions
- [ ] Create requests store
- [ ] Create chat store
- [ ] Create settings store
- [ ] Create ui store

### Phase 2: Network Capture
- [ ] Implement capture.ts
- [ ] Implement parser.ts
- [ ] Implement graphql.ts
- [ ] Connect capture to requests store
- [ ] Test capture in DevTools

### Phase 3: Request List UI
- [ ] Create App.tsx layout
- [ ] Create Toolbar
- [ ] Create RequestList
- [ ] Create RequestItem
- [ ] Create FavoritesSection
- [ ] Create SearchBar
- [ ] Implement selection logic
- [ ] Implement favorites logic
- [ ] Implement search filtering

### Phase 4: Request Detail Drawer
- [ ] Create RequestDrawer
- [ ] Create DrawerTabs
- [ ] Create HeadersDisplay
- [ ] Create BodyDisplay
- [ ] Create JsonTreeView
- [ ] Create TimingDisplay
- [ ] Implement lazy loading for large bodies

### Phase 5: Chat Panel
- [ ] Create ChatPanel
- [ ] Create ChatMessage
- [ ] Create ChatInput
- [ ] Create MarkdownRenderer
- [ ] Create CodeBlock
- [ ] Create ChatEmptyState

### Phase 6: LLM Integration
- [ ] Implement providers.ts
- [ ] Implement prompts.ts
- [ ] Implement context.ts
- [ ] Implement useChat hook
- [ ] Implement sanitizer
- [ ] Implement default patterns
- [ ] Connect chat UI to LLM
- [ ] Test streaming responses

### Phase 7: Settings & Storage
- [ ] Implement encrypted.ts
- [ ] Implement settings.ts storage
- [ ] Create SettingsModal
- [ ] Create LLMConfig
- [ ] Create CaptureConfig
- [ ] Create PrivacyWarning
- [ ] Implement API key validation
- [ ] Test settings persistence

### Phase 8: Replay Feature
- [ ] Implement replay.ts
- [ ] Create ReplayEditor
- [ ] Add replay button to drawer
- [ ] Add "Replay" badge to replayed requests
- [ ] Test replay functionality

### Phase 9: Polish & Edge Cases
- [ ] Create WebSocketView
- [ ] Create ErrorBoundary
- [ ] Create LLMError
- [ ] Implement responsive layout
- [ ] Implement session storage for chat
- [ ] Add loading states
- [ ] Test edge cases (large payloads, encoding errors, etc.)
- [ ] Final testing in Chrome DevTools
