import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { CodeBlock, InlineCode } from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content text-sm leading-relaxed">
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

const markdownComponents: Components = {
  // Code blocks and inline code
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const codeString = String(children).replace(/\n$/, "");

    // Check if it's a code block (has language class or is multiline)
    const isBlock = match || codeString.includes("\n");

    if (isBlock) {
      return <CodeBlock code={codeString} language={language} />;
    }

    return <InlineCode {...props}>{children}</InlineCode>;
  },

  // Links open in new tab
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Headings
  h1({ children, ...props }) {
    return (
      <h1 className="mb-2 mt-4 text-lg font-bold text-gray-900" {...props}>
        {children}
      </h1>
    );
  },
  h2({ children, ...props }) {
    return (
      <h2 className="mb-2 mt-3 text-base font-bold text-gray-900" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    return (
      <h3 className="mb-1 mt-2 text-sm font-bold text-gray-900" {...props}>
        {children}
      </h3>
    );
  },

  // Paragraphs
  p({ children, ...props }) {
    return (
      <p className="mb-2 text-gray-700" {...props}>
        {children}
      </p>
    );
  },

  // Lists
  ul({ children, ...props }) {
    return (
      <ul className="mb-2 ml-4 list-disc space-y-1" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }) {
    return (
      <ol className="mb-2 ml-4 list-decimal space-y-1" {...props}>
        {children}
      </ol>
    );
  },
  li({ children, ...props }) {
    return (
      <li className="text-gray-700" {...props}>
        {children}
      </li>
    );
  },

  // Blockquotes
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="my-2 border-l-4 border-gray-300 pl-4 italic text-gray-600"
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  // Tables
  table({ children, ...props }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }) {
    return (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    );
  },
  th({ children, ...props }) {
    return (
      <th
        className="border border-gray-200 px-3 py-1.5 text-left font-medium text-gray-700"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td className="border border-gray-200 px-3 py-1.5 text-gray-600" {...props}>
        {children}
      </td>
    );
  },

  // Horizontal rule
  hr({ ...props }) {
    return <hr className="my-4 border-gray-200" {...props} />;
  },

  // Strong and emphasis
  strong({ children, ...props }) {
    return (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    );
  },
  em({ children, ...props }) {
    return (
      <em className="italic" {...props}>
        {children}
      </em>
    );
  },
};
