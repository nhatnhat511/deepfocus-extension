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

  function toggleHtmlMode() {
    setIsHtmlMode((prev) => !prev);
  }

  return (
    <div className="wp-editor">
      <div className="wp-editor-toolbar">
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
            HTML
          </button>
        </div>
        <div className="wp-editor-toolbar-row">
          <div className="wp-editor-group">
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
          </div>
          <div className="wp-editor-group">
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("bold")}>
              Bold
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("italic")}>
              Italic
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("underline")}>
              Underline
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("strikeThrough")}>
              Strike
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("removeFormat")}>
              Clear
            </button>
          </div>
          <div className="wp-editor-group">
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("insertUnorderedList")}>
              Bullets
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("insertOrderedList")}>
              Numbered
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("outdent")}>
              Outdent
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("indent")}>
              Indent
            </button>
          </div>
          <div className="wp-editor-group">
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("justifyLeft")}>
              Left
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("justifyCenter")}>
              Center
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("justifyRight")}>
              Right
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("justifyFull")}>
              Justify
            </button>
          </div>
          <div className="wp-editor-group">
            <button type="button" className="wp-editor-btn" onClick={addLink}>
              Link
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("unlink")}>
              Unlink
            </button>
            <button type="button" className="wp-editor-btn" onClick={insertImage}>
              Image
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("insertHorizontalRule")}>
              Divider
            </button>
            <button type="button" className="wp-editor-btn" onClick={insertTable}>
              Table
            </button>
          </div>
          <div className="wp-editor-group">
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("undo")}>
              Undo
            </button>
            <button type="button" className="wp-editor-btn" onClick={() => runCommand("redo")}>
              Redo
            </button>
            <button type="button" className="wp-editor-btn" onClick={toggleHtmlMode}>
              {isHtmlMode ? "Preview" : "Edit HTML"}
            </button>
          </div>
        </div>
      </div>
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
