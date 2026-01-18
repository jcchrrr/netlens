# NetLens

A Chrome DevTools extension for network traffic analysis with LLM integration. Capture, inspect, and analyze HTTP requests using AI-powered insights.

## Features

- **Network Capture** — Automatically captures HTTP/HTTPS requests from the inspected page
- **Request Inspector** — View headers, body, and timing for each request
- **LLM Analysis** — Get AI-powered security audits, performance analysis, and explanations
- **Request Replay** — Edit and re-execute requests with modified parameters
- **GraphQL Support** — Automatic detection and formatting of GraphQL queries
- **Privacy First** — Sensitive data is automatically sanitized before sending to LLM
- **Multiple LLM Providers** — Supports Claude, OpenAI, and local Ollama models

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/jcchrrr/netlens.git
cd netlens
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
pnpm build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

Run the development server with hot reload:
```bash
pnpm dev
```

Then load the `dist` folder as an unpacked extension. The extension will reload automatically when you make changes.

## Usage

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Navigate to the "NetLens" panel
3. Browse the page to capture network requests
4. Select requests using checkboxes
5. Use quick actions or ask questions in the chat panel

### Quick Actions

- **Security** — Analyze selected requests for security vulnerabilities
- **Performance** — Get performance optimization suggestions
- **Explain** — Get a plain-language explanation of the requests

### Request Details

Click any request to open the detail drawer:
- **Request tab** — View request headers and body
- **Response tab** — View response headers and body with JSON tree view
- **Timing tab** — See detailed timing breakdown (DNS, TLS, TTFB, etc.)

### Edit & Replay

1. Click "Edit & Replay" in the request drawer
2. Modify the URL, method, headers, or body
3. Click "Send Request" to execute
4. The replayed request appears in the list with a "Replay" badge

## Configuration

Click the gear icon to open settings:

### LLM Provider

Choose your preferred LLM provider:

| Provider | Setup |
|----------|-------|
| Claude | Enter your Anthropic API key |
| OpenAI | Enter your OpenAI API key |
| Ollama | Configure local server URL and model |

API keys are encrypted and stored locally using AES-GCM.

### Capture Settings

- **Scope** — Choose what to capture:
  - Page only (default)
  - Page + iframes
  - All requests
- **Exclusion patterns** — Skip requests matching URL patterns
- **Max requests** — FIFO limit (default: 500)

## Privacy & Security

NetLens takes privacy seriously:

- **Data stays local** — Captured requests are stored only in browser memory
- **Automatic sanitization** — Sensitive data (tokens, passwords, API keys) is redacted before sending to LLM
- **Privacy warning** — First-time users see what data will be sent before any LLM call
- **Encrypted storage** — API keys are encrypted with AES-GCM using PBKDF2 key derivation

### Default Sanitization Patterns

- Bearer tokens and JWTs
- Authorization headers
- Password fields
- API keys (various formats)
- Session IDs and cookies
- Credit card numbers
- SSN patterns
- Private keys

## Architecture

```
src/
├── devtools.ts          # Creates the DevTools panel
├── panel/
│   ├── App.tsx          # Main application layout
│   └── components/      # React components
├── stores/              # Zustand state management
│   ├── requests.ts      # Captured requests
│   ├── chat.ts          # Chat messages
│   ├── settings.ts      # User settings
│   └── ui.ts            # UI state
└── lib/
    ├── network/         # Network capture & replay
    ├── llm/             # LLM integration
    ├── sanitizer/       # Data sanitization
    ├── storage/         # Encrypted storage
    └── utils/           # Utilities
```

### Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Zustand** — State management
- **Tailwind CSS v4** — Styling
- **Vite + CRXJS** — Build tooling
- **Vercel AI SDK** — LLM streaming
- **Prism.js** — Syntax highlighting

## Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm lint      # Run Biome linter
pnpm format    # Format code with Biome
```

## Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)

## License

MIT
