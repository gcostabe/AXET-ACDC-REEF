import React, { useState } from 'react';
import { marked } from 'marked';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

// Configure marked with GFM (GitHub Flavored Markdown) and table support
marked.setOptions({
  gfm: true,
  breaks: true
});

export default function ChatMarkdownRenderer({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!content) return null;

  const handleCopyCode = (codeText, index) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse markdown into HTML string using marked
  const rawHtml = marked.parse(content);

  return (
    <div className="chat-markdown-renderer">
      <div 
        className="markdown-body-custom"
        dangerouslySetInnerHTML={{ __html: rawHtml }} 
      />

      <style>{`
        .chat-markdown-renderer {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-main, #0f172a);
        }

        /* Headings */
        .markdown-body-custom h1,
        .markdown-body-custom h2,
        .markdown-body-custom h3,
        .markdown-body-custom h4 {
          color: var(--text-main, #0f172a);
          font-weight: 600;
          margin: 14px 0 6px 0;
          line-height: 1.35;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .markdown-body-custom h1 { font-size: 15px; border-bottom: 1px solid var(--border, #e2e8f0); padding-bottom: 4px; }
        .markdown-body-custom h2 { font-size: 14px; color: var(--primary, #0066ff); }
        .markdown-body-custom h3 { font-size: 13.5px; color: var(--text-main, #0f172a); }
        .markdown-body-custom h4 { font-size: 13px; color: var(--text-secondary, #334155); }

        /* Paragraphs & Text */
        .markdown-body-custom p {
          margin: 0 0 10px 0;
        }
        .markdown-body-custom p:last-child {
          margin-bottom: 0;
        }
        .markdown-body-custom strong {
          color: var(--text-main, #0f172a);
          font-weight: 600;
        }
        .markdown-body-custom em {
          color: var(--text-secondary, #475569);
        }

        /* TABLES - Rich, modern, responsive styling */
        .markdown-body-custom table {
          display: block;
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          border-collapse: separate;
          border-spacing: 0;
          margin: 12px 0;
          font-size: 12px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 8px;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
        }
        .markdown-body-custom table::-webkit-scrollbar {
          height: 5px;
        }
        .markdown-body-custom table::-webkit-scrollbar-track {
          background: var(--bg-surface, #f8fafc);
        }
        .markdown-body-custom table::-webkit-scrollbar-thumb {
          background: var(--border, #cbd5e1);
          border-radius: 3px;
        }
        .markdown-body-custom table::-webkit-scrollbar-thumb:hover {
          background: var(--primary, #0066ff);
        }
        .markdown-body-custom thead {
          background: var(--bg-surface, #f1f5f9);
        }
        .markdown-body-custom th {
          color: var(--primary, #0066ff);
          font-weight: 600;
          padding: 8px 12px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--primary, #0066ff);
          white-space: nowrap;
        }
        .markdown-body-custom td {
          padding: 8px 12px;
          border-bottom: 1px solid var(--border, #e2e8f0);
          color: var(--text-main, #0f172a);
          vertical-align: middle;
        }
        .markdown-body-custom tr:last-child td {
          border-bottom: none;
        }
        .markdown-body-custom tbody tr:nth-child(even) {
          background: var(--bg-surface, #f8fafc);
        }
        .markdown-body-custom tbody tr:hover {
          background: var(--primary-subtle, #eff6ff);
          transition: background 0.15s ease;
        }

        /* Inline Code */
        .markdown-body-custom :not(pre) > code {
          background: var(--primary-subtle, #eff6ff);
          color: var(--primary, #0066ff);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          white-space: nowrap;
        }

        /* Code Blocks */
        .markdown-body-custom pre {
          background: var(--bg-surface, #f8fafc);
          border: 1px solid var(--border, #e2e8f0);
          border-left: 3px solid var(--primary, #0066ff);
          border-radius: 8px;
          padding: 10px 14px;
          margin: 10px 0;
          overflow-x: auto;
        }
        .markdown-body-custom pre code {
          background: transparent;
          border: none;
          color: #0f172a;
          padding: 0;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          line-height: 1.5;
          display: block;
        }

        /* Blockquotes / Alerts */
        .markdown-body-custom blockquote {
          border-left: 3px solid var(--primary, #0066ff);
          background: var(--primary-subtle, #eff6ff);
          padding: 8px 12px;
          margin: 10px 0;
          border-radius: 0 6px 6px 0;
          color: var(--text-secondary, #334155);
          font-size: 12.5px;
        }
        .markdown-body-custom blockquote p {
          margin: 0;
        }

        /* Lists */
        .markdown-body-custom ul, 
        .markdown-body-custom ol {
          margin: 8px 0;
          padding-left: 18px;
        }
        .markdown-body-custom li {
          margin-bottom: 4px;
          color: var(--text-secondary, #334155);
        }
        .markdown-body-custom li::marker {
          color: var(--primary, #0066ff);
        }

        /* Horizontal Rule */
        .markdown-body-custom hr {
          border: none;
          border-top: 1px solid var(--border, #e2e8f0);
          margin: 14px 0;
        }
      `}</style>
    </div>
  );
}
