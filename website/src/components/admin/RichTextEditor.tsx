"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const blockOptions = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Quote", value: "blockquote" },
  { label: "Code block", value: "pre" },
];

function IconButton({
  title,
  onClick,
  children,
  disabled,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="wp-editor-btn" onClick={onClick} title={title} aria-label={title} disabled={disabled}>
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState("p");

  useEffect(() => {
    if (!editorRef.current) return;
    if (isHtmlMode) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [isHtmlMode, value]);

  const plainText = useMemo(() => {
    if (!value) return "";
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  }

  function insertHtml(html: string) {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(editorRef.current?.innerHTML || "");
  }

  function addLink() {
    const url = window.prompt("Enter URL");
    if (!url) return;
    runCommand("createLink", url);
  }

  function insertImage() {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    runCommand("insertImage", url);
  }

  function insertTable() {
    insertHtml(
      "<table><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table>"
    );
  }

  function addMedia() {
    insertImage();
  }

  function addForm() {
    const snippet = window.prompt("Paste form embed HTML or shortcode");
    if (!snippet) return;
    insertHtml(snippet);
  }

  return (
    <div className="wp-editor">
      <div className="wp-editor-header">
        <div className="wp-editor-header-actions">
          <button type="button" className="wp-editor-add-btn" onClick={addMedia}>
            Add Media
          </button>
          <button type="button" className="wp-editor-add-btn" onClick={addForm}>
            Add Form
          </button>
        </div>
        <div className="wp-editor-tabs">
          <button
            type="button"
            className={`wp-editor-tab ${!isHtmlMode ? "is-active" : ""}`}
            onClick={() => setIsHtmlMode(false)}
          >
            Visual
          </button>
          <button
            type="button"
            className={`wp-editor-tab ${isHtmlMode ? "is-active" : ""}`}
            onClick={() => setIsHtmlMode(true)}
          >
            Text
          </button>
        </div>
      </div>

      {!isHtmlMode ? (
        <div className="wp-editor-toolbar">
          <div className="wp-editor-toolbar-row">
            <select
              className="wp-editor-select"
              value={selectedBlock}
              onChange={(event) => {
                const next = event.target.value;
                setSelectedBlock(next);
                runCommand("formatBlock", next);
              }}
            >
              {blockOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span className="wp-editor-divider" />

            <IconButton title="Bold" onClick={() => runCommand("bold")}>
              <span className="wp-editor-icon wp-editor-icon-bold">B</span>
            </IconButton>
            <IconButton title="Italic" onClick={() => runCommand("italic")}>
              <span className="wp-editor-icon wp-editor-icon-italic">I</span>
            </IconButton>
            <IconButton title="Underline" onClick={() => runCommand("underline")}>
              <span className="wp-editor-icon wp-editor-icon-underline">U</span>
            </IconButton>
            <IconButton title="Strikethrough" onClick={() => runCommand("strikeThrough")}>
              <span className="wp-editor-icon wp-editor-icon-strike">S</span>
            </IconButton>

            <span className="wp-editor-divider" />

            <IconButton title="Bulleted list" onClick={() => runCommand("insertUnorderedList")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="4" cy="5" r="1.5" />
                <circle cx="4" cy="10" r="1.5" />
                <circle cx="4" cy="15" r="1.5" />
                <rect x="8" y="4" width="9" height="2" rx="1" />
                <rect x="8" y="9" width="9" height="2" rx="1" />
                <rect x="8" y="14" width="9" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Numbered list" onClick={() => runCommand("insertOrderedList")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <text x="1" y="7" fontSize="6" fontFamily="sans-serif">1.</text>
                <text x="1" y="12" fontSize="6" fontFamily="sans-serif">2.</text>
                <text x="1" y="17" fontSize="6" fontFamily="sans-serif">3.</text>
                <rect x="8" y="4" width="9" height="2" rx="1" />
                <rect x="8" y="9" width="9" height="2" rx="1" />
                <rect x="8" y="14" width="9" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Outdent" onClick={() => runCommand("outdent")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="7" y="4" width="10" height="2" rx="1" />
                <rect x="7" y="9" width="10" height="2" rx="1" />
                <rect x="7" y="14" width="10" height="2" rx="1" />
                <polyline points="5,6 2,10 5,14" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconButton>
            <IconButton title="Indent" onClick={() => runCommand("indent")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="4" width="10" height="2" rx="1" />
                <rect x="3" y="9" width="10" height="2" rx="1" />
                <rect x="3" y="14" width="10" height="2" rx="1" />
                <polyline points="15,6 18,10 15,14" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </IconButton>

            <span className="wp-editor-divider" />

            <IconButton title="Align left" onClick={() => runCommand("justifyLeft")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2" y="4" width="12" height="2" rx="1" />
                <rect x="2" y="9" width="16" height="2" rx="1" />
                <rect x="2" y="14" width="12" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Align center" onClick={() => runCommand("justifyCenter")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="4" y="4" width="12" height="2" rx="1" />
                <rect x="2" y="9" width="16" height="2" rx="1" />
                <rect x="4" y="14" width="12" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Align right" onClick={() => runCommand("justifyRight")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="6" y="4" width="12" height="2" rx="1" />
                <rect x="2" y="9" width="16" height="2" rx="1" />
                <rect x="6" y="14" width="12" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Justify" onClick={() => runCommand("justifyFull")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2" y="4" width="16" height="2" rx="1" />
                <rect x="2" y="9" width="16" height="2" rx="1" />
                <rect x="2" y="14" width="16" height="2" rx="1" />
              </svg>
            </IconButton>

            <span className="wp-editor-divider" />

            <IconButton title="Insert link" onClick={addLink}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M7.5 12.5l5-5m-6.2 1.3l-2.1 2.1a3 3 0 104.2 4.2l2.1-2.1m2.2-2.2l2.1-2.1a3 3 0 10-4.2-4.2l-2.1 2.1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
            <IconButton title="Remove link" onClick={() => runCommand("unlink")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path
                  d="M7.5 12.5l5-5m-6.2 1.3l-2.1 2.1a3 3 0 104.2 4.2l2.1-2.1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </IconButton>
            <IconButton title="Insert image" onClick={insertImage}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="8" cy="8" r="1.6" />
                <path d="M5 14l4-4 3 3 3-2 2 3" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </IconButton>
            <IconButton title="Insert divider" onClick={() => runCommand("insertHorizontalRule")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="9" width="14" height="2" rx="1" />
              </svg>
            </IconButton>
            <IconButton title="Insert table" onClick={insertTable}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="4" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 9h14M3 13h14M10 4v12" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </IconButton>

            <span className="wp-editor-divider" />

            <IconButton title="Undo" onClick={() => runCommand("undo")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7 6l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M7 10h6a4 4 0 010 8h-2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </IconButton>
            <IconButton title="Redo" onClick={() => runCommand("redo")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M13 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M13 10H7a4 4 0 100 8h2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </IconButton>
            <IconButton title="Clear formatting" onClick={() => runCommand("removeFormat")}>
              <svg className="wp-editor-svg" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M6 4h8l-2 8H8L6 4z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </IconButton>
          </div>
        </div>
      ) : null}

      {isHtmlMode ? (
        <textarea
          className="wp-editor-html"
          value={value}
          placeholder={placeholder || "Start writing..."}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="wp-editor-surface"
          data-placeholder={placeholder || "Start writing..."}
          onInput={() => onChange(editorRef.current?.innerHTML || "")}
        />
      )}
      <div className="wp-editor-status">
        <span>{plainText ? `${plainText.split(" ").length} words` : "0 words"}</span>
        <span>{value.length} chars</span>
      </div>
    </div>
  );
}
