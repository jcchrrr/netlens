# NetLens — Network Analyzer + LLM

> Chrome DevTools extension to capture, analyze, and discuss network traffic with an LLM.

---

## Problem

Developers spend time:

- Manually searching for security vulnerabilities in their requests
- Identifying performance issues (N+1, oversized payloads, missing cache)
- Understanding poorly documented third-party APIs

Existing tools (Burp, 42Crunch) are heavy, paid, or disconnected from the dev workflow.

---

## Solution

A DevTools panel that:

1. **Captures** all network traffic automatically
2. **Analyzes** via LLM (Claude, OpenAI, or local Ollama)
3. **Dialogues** to dig deeper into problems

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome DevTools Panel                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│  │                      │  │                                 │  │
│  │   Request List       │  │        Chat Panel               │  │
│  │   (with checkboxes)  │  │                                 │  │
│  │                      │  │   [Select requests and ask      │  │
│  │   ☆ Favorites        │  │    a question]                  │  │
│  │   ├─ GET /api/...    │  │                                 │  │
│  │   └─ POST /auth      │  │   User: Analyze this request    │  │
│  │   ───────────────    │  │                                 │  │
│  │   □ GET /api/users   │  │   LLM: This request exposes     │  │
│  │   □ POST /api/login  │  │   a token in the URL...         │  │
│  │   □ GET /api/data    │  │                                 │  │
│  │                      │  │   [___________________] [Send]  │  │
│  └──────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
│  [Scope ▼] [Pause] [Clear] [🔒 Security] [⚡ Perf] [❓ Explain] [⚙]│
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
/extension
├── manifest.json           # Manifest V3
├── devtools.html           # Entry point DevTools
├── devtools.js             # Creates the panel
├── panel/
│   ├── index.html
│   ├── App.tsx             # React UI
│   ├── components/
│   │   ├── RequestList.tsx
│   │   ├── RequestDetail.tsx   # Drawer component
│   │   ├── ChatPanel.tsx
│   │   ├── WebSocketView.tsx
│   │   └── Settings.tsx
│   └── stores/
│       ├── requests.ts     # Captured requests state
│       └── chat.ts         # Conversation history
├── background.js           # Service worker
└── lib/
    ├── network.ts          # chrome.devtools.network wrapper
    ├── llm/
    │   ├── claude.ts       # Claude API client
    │   ├── openai.ts       # OpenAI API client
    │   └── ollama.ts       # Ollama client
    ├── sanitizer.ts        # Sensitive data masking
    ├── storage.ts          # Encrypted API key management
    └── replay.ts           # Request replay functionality
```

---

## Tech Stack

| Component       | Choice                | Justification                          |
| --------------- | --------------------- | -------------------------------------- |
| Extension       | Manifest V3           | Current Chrome standard                |
| UI Framework    | React 18 + TypeScript | Productivity, typing                   |
| Styling         | Tailwind CSS          | Fast, consistent                       |
| UI Components   | shadcn/ui             | Customizable, Tailwind-based           |
| State           | Zustand               | Lightweight, simple                    |
| Build           | Vite + CRXJS          | Fast, HMR for extensions               |
| LLM Client      | Vercel AI SDK         | Unified multi-provider, React hooks    |
| Icons           | Lucide React          | Lightweight, good with shadcn          |
| Markdown        | react-markdown        | Flexible, plugin support               |
| Syntax Highlight| Prism.js              | Lightweight, sufficient for display    |
| Drag & Drop     | @dnd-kit (v0.2)       | Modern, accessible                     |
| Linting         | Biome                 | All-in-one, fast                       |
| Testing         | Vitest + Testing Library | Vite-integrated, React standard     |
| Package Manager | pnpm                  | Fast, disk efficient                   |
| Node.js         | >= 22                 | Latest features                        |

---

## Technical Implementation

### Project Setup

```bash
# Initialize project
pnpm create vite netlens --template react-ts
cd netlens
pnpm add -D @crxjs/vite-plugin@beta

# Core dependencies
pnpm add zustand ai @ai-sdk/anthropic @ai-sdk/openai
pnpm add react-markdown prismjs
pnpm add lucide-react

# shadcn/ui setup
pnpm dlx shadcn@latest init

# Dev dependencies
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @biomejs/biome
pnpm add -D vitest @testing-library/react
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        panel: 'src/panel/index.html',
        devtools: 'src/devtools.html',
      },
    },
  },
})
```

### Zustand Store Structure

```
src/stores/
├── requests.ts      # Captured requests, favorites, selection
├── chat.ts          # Messages, streaming state
├── settings.ts      # LLM config, capture settings, sanitization rules
└── ui.ts            # Drawer state, pause state, layout
```

**Example: requests.ts**
```typescript
interface RequestsStore {
  requests: NetworkRequest[]
  favorites: Set<string>
  selected: Set<string>
  isPaused: boolean

  addRequest: (req: NetworkRequest) => void
  toggleFavorite: (id: string) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearAll: () => void
  setPaused: (paused: boolean) => void
}
```

### File Structure (Detailed)

```
src/
├── panel/
│   ├── index.html
│   ├── index.tsx              # Entry point
│   ├── App.tsx                # Main layout
│   └── components/
│       ├── Toolbar.tsx        # Scope, Pause, Clear, Actions
│       ├── RequestList.tsx    # List with checkboxes
│       ├── RequestItem.tsx    # Single request row
│       ├── FavoritesSection.tsx
│       ├── SearchBar.tsx
│       ├── RequestDrawer.tsx  # Detail drawer
│       ├── DrawerTabs.tsx     # Request/Response/Timing tabs
│       ├── JsonTreeView.tsx   # Custom JSON tree component
│       ├── ReplayEditor.tsx   # Edit mode for replay
│       ├── ChatPanel.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       ├── CodeBlock.tsx      # With Prism + copy button
│       ├── WebSocketView.tsx  # Split in/out view
│       ├── SettingsModal.tsx
│       ├── LLMConfig.tsx
│       ├── SanitizationRules.tsx  # v0.2
│       └── PrivacyWarning.tsx
├── stores/
│   ├── requests.ts
│   ├── chat.ts
│   ├── settings.ts
│   └── ui.ts
├── lib/
│   ├── network/
│   │   ├── capture.ts         # chrome.devtools.network wrapper
│   │   ├── parser.ts          # Parse HAR entries
│   │   └── replay.ts          # Replay functionality
│   ├── llm/
│   │   ├── providers.ts       # Provider configuration
│   │   ├── prompts.ts         # System prompts
│   │   └── context.ts         # Build context from requests
│   ├── sanitizer/
│   │   ├── index.ts           # Main sanitization logic
│   │   ├── patterns.ts        # Default patterns
│   │   └── rules.ts           # Custom rules engine (v0.2)
│   ├── storage/
│   │   ├── encrypted.ts       # API key encryption
│   │   └── settings.ts        # chrome.storage wrapper
│   └── utils/
│       ├── graphql.ts         # GraphQL detection & formatting
│       ├── format.ts          # Size, time formatting
│       └── types.ts           # Shared TypeScript types
├── devtools.html
├── devtools.ts                # Creates panel
└── background.ts              # Service worker (minimal)
```

### Chrome Extension Manifest (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "NetLens",
  "version": "0.1.0",
  "description": "Network analyzer with LLM integration",
  "devtools_page": "src/devtools.html",
  "permissions": ["storage"],
  "host_permissions": [
    "https://api.anthropic.com/*",
    "https://api.openai.com/*"
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Vercel AI SDK Integration

```typescript
// lib/llm/providers.ts
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { createOpenAI } from '@ai-sdk/openai'

export function getProvider(settings: LLMSettings) {
  switch (settings.provider) {
    case 'claude':
      return anthropic('claude-sonnet-4-20250514', {
        apiKey: settings.apiKey,
      })
    case 'openai':
      return openai('gpt-4o', {
        apiKey: settings.apiKey,
      })
    case 'ollama':
      const ollama = createOpenAI({
        baseURL: settings.ollamaUrl + '/v1',
      })
      return ollama(settings.ollamaModel)
  }
}
```

```typescript
// In ChatPanel.tsx
import { useChat } from 'ai/react'

const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
  api: '/api/chat', // Handled internally via provider
  body: {
    context: selectedRequests,
    systemPrompt: currentPrompt,
  },
})
```

### Custom JSON Tree View Component

```typescript
// components/JsonTreeView.tsx
interface JsonTreeViewProps {
  data: unknown
  initialExpanded?: number  // Depth to expand by default
}

// Custom implementation without external lib
// - Recursive component for objects/arrays
// - Expand/collapse with chevron icons
// - Copy value on click
// - Syntax coloring for types (string, number, boolean, null)
```

### Biome Configuration (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

---

## Core Features

### 1. Network Capture

#### Scope Configuration
- **Dropdown in main toolbar** with options:
  - Page only
  - Page + iframes
  - All traffic (includes service workers)
- **Exclusion patterns**: Glob/regex patterns on URL to exclude (e.g., `*analytics*`, `*/tracking/*`)

#### Capture Controls
- **Pause/Resume toggle**: Button to temporarily stop capturing without losing data
- **Clear button**: Immediate clear, no confirmation required

#### Limits
- **FIFO with configurable limit**: Default 500 requests, max 2000
- Oldest requests automatically removed when limit reached

#### Request Display
- **Two-line density**:
  - Line 1: Method + URL
  - Line 2: Status + Size + Time + Tags
- **Timing**: Total duration only (e.g., "234ms")
- **Error indicators**: Basic badges for 4xx/5xx status codes
- **Failed requests**: Same list with different styling (red background/strikethrough)

#### Special Request Types

**Binary bodies (images, uploads)**:
- Ignore body content, display metadata only (size, MIME type)

**GraphQL requests**:
- Detection via: URL contains `/graphql` + body contains `query`/`mutation` + Content-Type header
- Formatted query display separate from variables

**Compressed responses (gzip, br)**:
- Rely on chrome.devtools.network API (provides decompressed content)

**Encoding errors (non-UTF8)**:
- Display as-is with warning indicator

### 2. Request List

#### Selection
- **Checkboxes** for each request
- **"Select all" checkbox** in header (toggles all visible requests)
- Multiple selection enables bulk actions

#### Favorites
- **Star icon** to mark requests as favorites
- **Collapsible section** at top: "⭐ Favorites (N)" header, click to expand/collapse
- Favorites persist during session

#### Search & Filtering
- **Simple text search**: Single field searching in URL, method, status

#### Localhost Handling
- Treat localhost/127.0.0.1 requests like any other request

### 3. Request Detail Drawer

#### Behavior
- **Position**: Slides in from right, overlays the chat panel
- **Width**: Fixed 400px
- **Opening**: Click on a request row (not checkbox)
- **Closing**: X button + click outside drawer
- **Navigation**: Clicking another request updates drawer content without closing

#### Content Organization
- **Horizontal tabs**: Request | Response | Timing
- Each tab contains relevant headers and body

#### Body Display
- **Hybrid view with tabs**: Tree / Raw / Table representations
- **Large responses (>500KB)**: Lazy loading on demand - show "Load full content" button

#### Replay Feature
- **Edit mode in drawer**: Switch to edit mode to modify URL, headers, body
- **Replay button**: Re-execute the modified request
- **Result**: New entry in request list with "Replay" badge

### 4. WebSocket Support

#### Display
- **Split view**: Two columns for incoming/outgoing messages
- **Scroll sync**: Synchronized by timestamp between columns
- **Connection as parent**: WebSocket connection entry contains messages as children

### 5. Chat Panel

#### Layout
- **50/50 split** with request list (side by side)
- **Responsive**: Stacked vertical layout when panel width < 400px
- **Resizing**: Fixed proportions, not user-adjustable

#### Empty State
- Simple instruction text: "Select requests and ask a question"

#### Input
- **Simple textarea** + Send button
- Enter key to send
- No history navigation or autocomplete

#### LLM Streaming
- **Token-by-token streaming**: Text appears progressively
- **No loading indicator**: Just text appearing
- **Stop button**: Interrupt generation, keep partial message with "[Interrupted]" badge

#### Context Management
- Selected requests are sent as context to LLM
- **Token overflow**: Automatically truncate oldest messages when context exceeds limit
- **Chat preservation**: Last 10 messages saved to sessionStorage on page refresh

#### Code Blocks in Responses
- Syntax highlighting
- Copy button on each code block

### 6. Quick Actions

#### Buttons in Toolbar
- **Distinct icons + text** for each action:
  - 🔒 Security (audit)
  - ⚡ Performance (audit)
  - ❓ Explain

#### Behavior
- Actions apply to currently selected requests
- No "Audit All" button - user selects all requests manually if needed

#### Prompts
- **Fixed prompts** (not user-editable)
- **English only**

### 7. Settings

#### Access
- **Gear icon** in top-right corner

#### LLM Configuration
- **Single active provider**: Claude / OpenAI / Ollama (switch in settings)
- **API key storage**: Encrypted with key derived from Chrome extension ID
- **API key validation**: Test connection on save, retry + diagnostic on failure

**Claude/OpenAI**:
- API key input
- Test connection button

**Ollama**:
- **Manual configuration required**: URL + model
- **Model selection**: Dropdown with popular suggestions + custom input option

#### Capture Settings
- Scope dropdown (Page only / Page + iframes / All)
- Exclusion patterns (glob/regex list)
- FIFO limit slider (100-2000, default 500)

### 8. Sanitization

#### Default Behavior
- Automatic sanitization before sending to LLM
- Patterns detected and masked:
  - `Authorization: Bearer ...`
  - JWT tokens (regex: `eyJ...`)
  - Common sensitive field names: `password`, `token`, `secret`, `api_key`
  - Cookie values (names preserved): `Cookie: session=[REDACTED]; theme=dark`

#### Configuration (v0.2)
- **Fully configurable rules**
- **Priority system**: Drag & drop ordering in settings
- **Rule format**: Regex patterns only
- **Conflict resolution**: Rules applied in user-defined order

#### Preview
- **Optional "View what will be sent" button** before first LLM call

#### Privacy Warning
- **Once per session**: Warning displayed before first LLM call each session
- User must acknowledge before data is sent

### 9. Multi-Tab Behavior

- **Shared settings**: API keys and preferences shared across tabs
- **Independent captures**: Each tab has its own request list and chat

---

## LLM Integration

### Supported Providers

| Provider | Authentication | Streaming |
| -------- | -------------- | --------- |
| Claude   | API key        | Yes       |
| OpenAI   | API key        | Yes       |
| Ollama   | URL + Model    | Yes       |

No additional providers planned. No plugin system.

### Error Handling
- **Display error message** with details
- **Retry button** for user to manually retry
- No automatic retry or fallback

### Data Format Sent to LLM

```json
{
  "request": {
    "method": "POST",
    "url": "https://api.example.com/auth/login",
    "headers": {
      "Content-Type": "application/json",
      "Origin": "https://example.com"
    },
    "body": {
      "email": "[REDACTED]",
      "password": "[REDACTED]"
    }
  },
  "response": {
    "status": 200,
    "headers": {
      "Set-Cookie": "session=[REDACTED]; Path=/",
      "Access-Control-Allow-Origin": "*"
    },
    "body": {
      "token": "[REDACTED]",
      "user": { "id": 123, "role": "admin" }
    },
    "size": 1250,
    "time": 234
  }
}
```

### System Prompts

#### Security Audit
```
You are a web security expert. Analyze this HTTP request and identify:
- Security vulnerabilities (OWASP Top 10)
- Missing headers (CSP, HSTS, X-Frame-Options...)
- Authentication/authorization issues
- Exposed sensitive data

Be concise. Prioritize by criticality (🔴 critical, 🟠 medium, 🟡 low).
```

#### Performance Audit
```
You are a web performance expert. Analyze this request and identify:
- Abnormal response times
- Oversized payloads
- Missing cache/compression
- Redundant or avoidable requests

Give concrete recommendations with estimated impact.
```

#### Explanation
```
Explain this HTTP request clearly:
- What does it do?
- What are the important headers?
- Is the response normal?

Adapt your level to context (junior dev → explain more).
```

---

## Audit Reports

### Structure
- **Grouped by category**: Auth, Headers, CORS, Performance, etc.
- **No external links**: Concise findings without OWASP/MDN references

### Finding Interaction
- **Quick actions**: "Ignore", "Mark resolved", "Discuss with LLM"
- **Click to discuss**: Opens chat pre-filled with finding as context

---

## UI/UX Specifications

### Theme
- **Light theme only** (no dark mode, no theme switching)

### Language
- **English only** for all UI elements and prompts

### Layout Breakpoints
- **< 400px width**: Switch to stacked vertical layout (list above, chat below)

### No Keyboard Shortcuts
- Mouse-only interaction

### No Telemetry
- Zero data collection, privacy first

---

## Chrome Permissions

```json
{
  "permissions": ["storage"],
  "host_permissions": [
    "https://api.anthropic.com/*",
    "https://api.openai.com/*"
  ]
}
```

Note: `chrome.devtools.network` requires no special permission.

---

## Security & Privacy

### API Key Encryption
```typescript
// AES-GCM encryption with key derived from browser
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
  baseKey, // Derived from extension ID
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);
```

### User Warning (Once Per Session)
> ⚠️ Request data will be sent to [Claude API / OpenAI / Ollama].
> Detected sensitive information will be masked.
> [View what will be sent] [Accept] [Cancel]

---

## Version Roadmap

### v0.1 — MVP

| Feature           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| Network capture   | Intercept XHR, Fetch, WebSocket via chrome.devtools.network |
| Request list      | Display method, URL, status, timing, size                |
| Selection         | Checkboxes, select all, favorites section                |
| Detail drawer     | Headers, body, response with tabs (Tree/Raw/Table)       |
| Chat LLM          | Send selected context + user prompt, streaming response  |
| Quick actions     | Security, Performance, Explain buttons                   |
| API config        | Encrypted storage for Claude/OpenAI/Ollama credentials   |
| Replay            | Re-execute requests with optional editing                |
| Pause/Resume      | Toggle capture on/off                                    |

### v0.2 — Enhanced Filtering & Sanitization

| Feature               | Description                                           |
| --------------------- | ----------------------------------------------------- |
| Configurable sanitization | Custom regex rules with drag & drop priority       |
| Scope dropdown        | Page only / Page + iframes / All                      |
| Exclusion patterns    | Glob/regex patterns to exclude from capture           |
| FIFO limit config     | User-configurable request limit (100-2000)            |

### v0.3 — Custom Rules & Alerts

| Feature          | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| Custom rules     | User-defined alert rules based on request conditions       |

#### Custom Rules Specification

**Rule Builder UI**: Structured form with dropdowns
- Field: URL / Method / Status / Size
- Operator: contains / equals / greater than / less than / matches regex
- Value: User input

**Available Fields**:
- URL (string)
- Method (GET, POST, PUT, DELETE, etc.)
- Status (number)
- Size (number, bytes)

**Actions**: Visual alert only (badge/notification in UI)

**Management**:
- Toggle active/inactive per rule
- No limit on number of rules
- Rules stored in chrome.storage

---

## Data Flow

```
1. Web page makes a request
         ↓
2. chrome.devtools.network.onRequestFinished
         ↓
3. Check exclusion patterns & scope
         ↓
4. Parse: method, url, headers, body, response, timing
         ↓
5. Apply custom rules, trigger alerts if matched
         ↓
6. Store in Zustand (memory, FIFO limited)
         ↓
7. User selects requests + asks question
         ↓
8. Sanitize (mask tokens/secrets based on rules)
         ↓
9. Send to LLM with context
         ↓
10. Stream response to chat
```

---

## Risks & Mitigations

| Risk                              | Mitigation                                           |
| --------------------------------- | ---------------------------------------------------- |
| Chrome Web Store rejection        | Full transparency, no data collection, sanitization  |
| Sensitive data leakage            | Default sanitization, preview before send            |
| LLM API costs                     | Support Ollama (local), token limits                 |
| Competition (Google integrates)   | Multi-LLM, conversation, open source differentiation |

---

## Success Metrics

- **Adoption**: 1000 installs in 3 months
- **Retention**: 30% still using after 1 week
- **Feedback**: Rating > 4.5 on Chrome Web Store

---

## Name & Branding

**NetLens** — "See through your network"
