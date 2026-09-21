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
          color: #E2E8F0;
        }

        /* Headings */
        .markdown-body-custom h1,
        .markdown-body-custom h2,
        .markdown-body-custom h3,
        .markdown-body-custom h4 {
          color: #F8FAFC;
          font-weight: 600;
          margin: 14px 0 6px 0;
          line-height: 1.35;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .markdown-body-custom h1 { font-size: 15px; border-bottom: 1px solid #1E293B; padding-bottom: 4px; }
        .markdown-body-custom h2 { font-size: 14px; color: #93C5FD; }
        .markdown-body-custom h3 { font-size: 13.5px; color: #BAE6FD; }
        .markdown-body-custom h4 { font-size: 13px; }

        /* Paragraphs & Text */
        .markdown-body-custom p {
          margin: 0 0 10px 0;
        }
        .markdown-body-custom p:last-child {
          margin-bottom: 0;
        }
        .markdown-body-custom strong {
          color: #FFFFFF;
          font-weight: 600;
        }
        .markdown-body-custom em {
          color: #CBD5E1;
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
          background: #080D1A;
          border: 1px solid #1E293B;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .markdown-body-custom table::-webkit-scrollbar {
          height: 5px;
        }
        .markdown-body-custom table::-webkit-scrollbar-track {
          background: #080D1A;
        }
        .markdown-body-custom table::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 3px;
        }
        .markdown-body-custom table::-webkit-scrollbar-thumb:hover {
          background: #0066FF;
        }
        .markdown-body-custom thead {
          background: #111C33;
        }
        .markdown-body-custom th {
          color: #93C5FD;
          font-weight: 600;
          padding: 8px 12px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #0066FF;
          white-space: nowrap;
        }
        .markdown-body-custom td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #E2E8F0;
          vertical-align: middle;
        }
        .markdown-body-custom tr:last-child td {
          border-bottom: none;
        }
        .markdown-body-custom tbody tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.015);
        }
        .markdown-body-custom tbody tr:hover {
          background: rgba(0, 102, 255, 0.08);
          transition: background 0.15s ease;
        }

        /* Inline Code */
        .markdown-body-custom :not(pre) > code {
          background: rgba(0, 102, 255, 0.12);
          color: #93C5FD;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(0, 102, 255, 0.25);
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          white-space: nowrap;
        }

        /* Code Blocks */
        .markdown-body-custom pre {
          background: #050811;
          border: 1px solid #1E293B;
          border-left: 3px solid #0066FF;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 10px 0;
          overflow-x: auto;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
        }
        .markdown-body-custom pre code {
          background: transparent;
          border: none;
          color: #6EE7B7;
          padding: 0;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          line-height: 1.5;
          display: block;
        }

        /* Blockquotes / Alerts */
        .markdown-body-custom blockquote {
          border-left: 3px solid #0066FF;
          background: rgba(0, 102, 255, 0.06);
          padding: 8px 12px;
          margin: 10px 0;
          border-radius: 0 6px 6px 0;
          color: #94A3B8;
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
          color: #CBD5E1;
        }
        .markdown-body-custom li::marker {
          color: #0066FF;
        }

        /* Horizontal Rule */
        .markdown-body-custom hr {
          border: none;
          border-top: 1px solid #1E293B;
          margin: 14px 0;
        }
      `}</style>
    </div>
  );
}
