"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const actions = [
  { label: "P", command: "formatBlock", value: "p" },
  { label: "H2", command: "formatBlock", value: "h2" },
  { label: "H3", command: "formatBlock", value: "h3" },
  { label: "B", command: "bold" },
  { label: "I", command: "italic" },
  { label: "U", command: "underline" },
  { label: "UL", command: "insertUnorderedList" },
  { label: "OL", command: "insertOrderedList" },
  { label: "Quote", command: "formatBlock", value: "blockquote" },
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  }

  function addLink() {
    const url = window.prompt("Enter URL");
    if (!url) return;
    runCommand("createLink", url);
  }

  return (
    <div className="wp-editor">
      <div className="wp-editor-toolbar">
        {actions.map((action) => (
          <button
            key={`${action.command}-${action.label}`}
            type="button"
            className="wp-editor-btn"
            onClick={() => runCommand(action.command, action.value)}
          >
            {action.label}
          </button>
        ))}
        <button type="button" className="wp-editor-btn" onClick={addLink}>
          Link
        </button>
        <button type="button" className="wp-editor-btn" onClick={() => runCommand("removeFormat")}>
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="wp-editor-surface"
        data-placeholder={placeholder || "Start writing..."}
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
      />
    </div>
  );
}
