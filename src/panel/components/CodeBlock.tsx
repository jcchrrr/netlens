import { useState, useCallback, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-graphql";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

// Map common language aliases
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  html: "markup",
  xml: "markup",
  svg: "markup",
  py: "python",
  gql: "graphql",
};

export function CodeBlock({
  code,
  language = "",
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  // Normalize language
  const normalizedLang = LANGUAGE_ALIASES[language.toLowerCase()] || language.toLowerCase();
  const prismLanguage = Prism.languages[normalizedLang] ? normalizedLang : "plaintext";

  // Highlight code on mount and when code/language changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, prismLanguage]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  }, [code]);

  const lines = code.split("\n");

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-3 py-1.5">
        <span className="text-xs font-medium text-gray-500">
          {language || "plaintext"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto p-3">
        <pre className={`text-xs leading-relaxed ${showLineNumbers ? "flex" : ""}`}>
          {showLineNumbers && (
            <span className="mr-4 select-none border-r border-gray-200 pr-4 text-right text-gray-400">
              {lines.map((_, i) => (
                <span key={i} className="block">
                  {i + 1}
                </span>
              ))}
            </span>
          )}
          <code
            ref={codeRef}
            className={`language-${prismLanguage} block`}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Inline code component (for single backticks)
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-pink-600">
      {children}
    </code>
  );
}
