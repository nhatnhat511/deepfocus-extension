import Link from "next/link";
import { basicSanitizeHtml } from "@/lib/sanitize/basicSanitize";
import type { HomepageBlock } from "@/lib/cms/homepageBlocks";
import type { HomepageRenderModel } from "@/lib/cms/homepageRenderModel";

const edgeAction = {
  label: "Microsoft Edge",
  href: "https://microsoftedge.microsoft.com/addons/detail/pmnpgpbhljgkgnfplkbljhhddneonidh",
};

type EditableControls = {
  selectedId?: string;
  selectedField?: string;
  onSelect?: (id: string) => void;
  onFocusField?: (id: string, field: string) => void;
  onInlineChange?: (id: string, field: string, value: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDrop?: (id: string) => void;
};

function InlineEditableText({
  blockId,
  field,
  value,
  controls,
  className,
  multiline = false,
}: {
  blockId: string;
  field: string;
  value: string;
  controls?: EditableControls;
  className: string;
  multiline?: boolean;
}) {
  const active = controls?.selectedId === blockId && controls?.selectedField === field;

  if (!controls?.onInlineChange) {
    return multiline ? <p className={className}>{value}</p> : <span className={className}>{value}</span>;
  }

  if (active) {
    if (multiline) {
      return (
        <textarea
          value={value}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => controls.onInlineChange?.(blockId, field, event.target.value)}
          className={`w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-inherit shadow-sm outline-none ring-2 ring-sky-100 ${className}`}
          rows={3}
        />
      );
    }

    return (
      <input
        value={value}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => controls.onInlineChange?.(blockId, field, event.target.value)}
        className={`w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-inherit shadow-sm outline-none ring-2 ring-sky-100 ${className}`}
      />
    );
  }

  return multiline ? <p className={className}>{value}</p> : <span className={className}>{value}</span>;
}

function renderInlineMarkdown(source: string) {
  const nodes: React.ReactNode[] = [];
  let remaining = source;
  let key = 0;

  const patterns = [
    { type: "link", regex: /\[([^\]]+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/ },
    { type: "bold", regex: /\*\*([^*]+?)\*\*/ },
    { type: "italic", regex: /\*([^*]+?)\*/ },
  ];

  const pushText = (text: string) => {
    const parts = text.split("\n");
    parts.forEach((part, index) => {
      if (part) {
        nodes.push(<span key={`t-${key++}`}>{part}</span>);
      }
      if (index < parts.length - 1) {
        nodes.push(<br key={`br-${key++}`} />);
      }
    });
  };

  while (remaining.length) {
    let earliestMatch: RegExpExecArray | null = null;
    let matchedType: string | null = null;
    let matchedIndex = -1;

    for (const pattern of patterns) {
      const match = pattern.regex.exec(remaining);
      if (!match) continue;
      if (matchedIndex === -1 || match.index < matchedIndex) {
        earliestMatch = match;
        matchedType = pattern.type;
        matchedIndex = match.index;
      }
    }

    if (!earliestMatch || matchedType === null) {
      pushText(remaining);
      break;
    }

    if (matchedIndex > 0) {
      pushText(remaining.slice(0, matchedIndex));
    }

    if (matchedType === "link") {
      const [, label, href] = earliestMatch;
      nodes.push(
        <a key={`lnk-${key++}`} href={href} className="text-sky-700 underline decoration-sky-300" target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    } else if (matchedType === "bold") {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-slate-900">
          {earliestMatch[1]}
        </strong>
      );
    } else if (matchedType === "italic") {
      nodes.push(
        <em key={`i-${key++}`} className="italic">
          {earliestMatch[1]}
        </em>
      );
    }

    remaining = remaining.slice(matchedIndex + earliestMatch[0].length);
  }

  return nodes;
}

function InlineEditableMarkdown({
  blockId,
  field,
  value,
  controls,
  className,
}: {
  blockId: string;
  field: string;
  value: string;
  controls?: EditableControls;
  className: string;
}) {
  const active = controls?.selectedId === blockId && controls?.selectedField === field;

  if (controls?.onInlineChange && active) {
    return (
      <textarea
        value={value}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => controls.onInlineChange?.(blockId, field, event.target.value)}
        className={`w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-inherit shadow-sm outline-none ring-2 ring-sky-100 ${className}`}
        rows={4}
      />
    );
  }

  return <span className={className}>{renderInlineMarkdown(value)}</span>;
}

function InlineEditableList({
  blockId,
  field,
  items,
  controls,
  className = "",
  inputClassName = "",
  addLabel = "Add item",
}: {
  blockId: string;
  field: string;
  items: string[];
  controls?: EditableControls;
  className?: string;
  inputClassName?: string;
  addLabel?: string;
}) {
  const active = controls?.selectedId === blockId && controls?.selectedField === field;

  if (!controls?.onInlineChange || !active) {
    return null;
  }

  const updateItems = (next: string[]) => {
    controls.onInlineChange?.(blockId, field, next.join("\n"));
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      {items.map((item, index) => (
        <div key={`${blockId}-${field}-${index}`} className="flex items-center gap-2">
          <input
            value={item}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              updateItems(next);
            }}
            className={`w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-2 ring-sky-100 ${inputClassName}`}
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const next = items.filter((_, itemIndex) => itemIndex !== index);
              updateItems(next);
            }}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          updateItems([...items, ""]);
        }}
        className="mt-1 w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-100"
      >
        {addLabel}
      </button>
    </div>
  );
}

function InlineEditableColumnsList({
  blockId,
  field,
  items,
  controls,
  columns = 2,
}: {
  blockId: string;
  field: string;
  items: string[];
  controls?: EditableControls;
  columns?: 2 | 3;
}) {
  const active = controls?.selectedId === blockId && controls?.selectedField === field;

  if (!controls?.onInlineChange || !active) {
    return null;
  }

  const updateItems = (next: string[]) => {
    controls.onInlineChange?.(blockId, field, next.join("\n"));
  };

  const maxColumns = columns === 3 ? 3 : 2;
  const normalized = items.length ? items : Array.from({ length: maxColumns }, () => "");
  const filled = normalized.slice(0, maxColumns);

  return (
    <div className={`grid gap-3 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {filled.map((item, index) => (
        <div key={`${blockId}-${field}-${index}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Column {index + 1}
          </span>
          <textarea
            value={item}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              const next = [...filled];
              next[index] = event.target.value;
              updateItems(next);
            }}
            className="min-h-[96px] w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-2 ring-sky-100"
          />
        </div>
      ))}
      <div className="col-span-full text-xs text-slate-500">
        Columns are stored line-by-line under `items` for this block.
      </div>
    </div>
  );
}

function InlineEditableRoleList({
  blockId,
  field,
  items,
  controls,
  className = "",
}: {
  blockId: string;
  field: string;
  items: Array<{ role: string; note: string }>;
  controls?: EditableControls;
  className?: string;
}) {
  const active = controls?.selectedId === blockId && controls?.selectedField === field;

  if (!controls?.onInlineChange || !active) {
    return null;
  }

  const updateItems = (next: Array<{ role: string; note: string }>) => {
    const lines = next
      .map((item) => `${item.role || ""}: ${item.note || ""}`.trim())
      .filter(Boolean);
    controls.onInlineChange?.(blockId, field, lines.join("\n"));
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      {items.map((item, index) => (
        <div key={`${blockId}-${field}-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={item.role}
              placeholder="Role"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...next[index], role: event.target.value };
                updateItems(next);
              }}
              className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-2 ring-sky-100"
            />
            <input
              value={item.note}
              placeholder="Note"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...next[index], note: event.target.value };
                updateItems(next);
              }}
              className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-2 ring-sky-100"
            />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const next = items.filter((_, itemIndex) => itemIndex !== index);
              updateItems(next);
            }}
            className="w-fit rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          updateItems([...items, { role: "", note: "" }]);
        }}
        className="mt-1 w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-100"
      >
        Add audience row
      </button>
    </div>
  );
}

function FieldTarget({
  blockId,
  field,
  controls,
  children,
  className = "",
  label,
}: {
  blockId: string;
  field: string;
  controls?: EditableControls;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  if (!controls?.onFocusField) {
    return <span className={className}>{children}</span>;
  }

  const isSelected = controls.selectedId === blockId && controls.selectedField === field;

  return (
    <span className="group relative inline-block max-w-full">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          controls.onSelect?.(blockId);
          controls.onFocusField?.(blockId, field);
        }}
        data-editor-block={blockId}
        data-editor-field={field}
        data-editor-label={label || ""}
        className={`w-full rounded-md text-left transition ${
          isSelected
            ? "bg-sky-50/70 ring-2 ring-sky-300 ring-offset-2 ring-offset-white"
            : "hover:bg-sky-50/50 hover:ring-2 hover:ring-sky-200 hover:ring-offset-2 hover:ring-offset-white"
        } ${className}`}
      >
        {children}
      </button>
      {label ? (
        <span
          className={`pointer-events-none absolute -top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
            isSelected
              ? "border-sky-300 bg-sky-100 text-sky-800 opacity-100"
              : "border-slate-200 bg-white text-slate-500 opacity-0 group-hover:opacity-100"
          }`}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

function GenericBlockPreview({ block, controls }: { block: HomepageBlock; controls?: EditableControls }) {
  if (block.type === "image" || block.type === "video") {
    const mediaUrl = block.mediaUrl?.trim() || "";
    const isYouTube = /youtube\.com|youtu\.be/i.test(mediaUrl);
    const isVimeo = /vimeo\.com/i.test(mediaUrl);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {block.type === "image" ? (
            mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt={block.title || "Homepage image"} className="h-auto w-full object-cover" />
            ) : (
              <div className="grid min-h-40 place-items-center text-sm font-semibold text-slate-500">Image URL not set</div>
            )
          ) : mediaUrl ? (
            isYouTube || isVimeo ? (
              <iframe
                src={mediaUrl}
                title={block.title || "Homepage video"}
                className="h-64 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="h-64 w-full">
                <source src={mediaUrl} />
              </video>
            )
          ) : (
            <div className="grid min-h-40 place-items-center text-sm font-semibold text-slate-500">Video URL not set</div>
          )}
        </div>
        <FieldTarget blockId={block.uid} field="title" controls={controls} className="mt-4 block" label="Title">
          <InlineEditableText
            blockId={block.uid}
            field="title"
            value={block.title || "Media block"}
            controls={controls}
            className="text-xl font-semibold text-slate-900"
          />
        </FieldTarget>
        <FieldTarget blockId={block.uid} field="subtitle" controls={controls} className="mt-2 block" label="Body">
          <InlineEditableMarkdown
            blockId={block.uid}
            field="subtitle"
            value={block.subtitle || "Standalone media module."}
            controls={controls}
            className="text-sm text-slate-600"
          />
        </FieldTarget>
        <FieldTarget blockId={block.uid} field="mediaUrl" controls={controls} className="mt-3 block" label="Media">
          <InlineEditableText
            blockId={block.uid}
            field="mediaUrl"
            value={block.mediaUrl || "https://media-url.example"}
            controls={controls}
            className="text-xs font-semibold text-slate-500"
          />
        </FieldTarget>
      </div>
    );
  }

  if (block.type === "html") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FieldTarget blockId={block.uid} field="title" controls={controls} className="block" label="Title">
          <InlineEditableText
            blockId={block.uid}
            field="title"
            value={block.title || "HTML embed"}
            controls={controls}
            className="text-xl font-semibold text-slate-900"
          />
        </FieldTarget>
        <FieldTarget blockId={block.uid} field="subtitle" controls={controls} className="mt-4 block" label="Body">
          <InlineEditableMarkdown
            blockId={block.uid}
            field="subtitle"
            value={block.subtitle || "<div>Custom HTML</div>"}
            controls={controls}
            className="block rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100"
          />
        </FieldTarget>
        <FieldTarget blockId={block.uid} field="mediaUrl" controls={controls} className="mt-3 block" label="Preview Note">
          <InlineEditableText
            blockId={block.uid}
            field="mediaUrl"
            value={block.mediaUrl || "Optional preview note"}
            controls={controls}
            className="text-xs font-semibold text-slate-500"
          />
        </FieldTarget>
      </div>
    );
  }

  const columns = block.items.length ? block.items : ["Column one", "Column two"];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">{block.title || "Columns block"}</h3>
      {controls?.selectedId === block.uid && controls?.selectedField === "items" ? (
        <div className="mt-4">
          <InlineEditableColumnsList
            blockId={block.uid}
            field="items"
            items={block.items}
            controls={controls}
            columns={block.type === "columns-3" ? 3 : 2}
          />
        </div>
      ) : (
        <div className={`mt-4 grid gap-3 ${block.type === "columns-3" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {columns.map((column, index) => (
            <div key={`${block.uid}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {column}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableFrame({
  id,
  label,
  selectedId,
  controls,
  children,
  compact = false,
  fieldOptions = [],
}: {
  id: string;
  label: string;
  selectedId?: string;
  controls?: EditableControls;
  children: React.ReactNode;
  compact?: boolean;
  fieldOptions?: Array<{ id: string; label: string }>;
}) {
  const isEditable = !!controls?.onSelect;
  const isSelected = selectedId === id;

  if (!isEditable) {
    return <>{children}</>;
  }

  return (
    <article
      draggable
      onDragStart={() => controls?.onDragStart?.(id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => controls?.onDrop?.(id)}
      onClick={() => controls?.onSelect?.(id)}
      className={`rounded-2xl border transition ${isSelected ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200"} ${compact ? "p-0" : "p-4"}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span className="cursor-grab">::</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 tracking-normal text-slate-700">{label}</span>
          <span className="tracking-normal">{id}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              controls?.onDuplicate?.(id);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              controls?.onRemove?.(id);
            }}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Remove
          </button>
        </div>
      </div>
      {isSelected && fieldOptions.length && controls?.onFocusField ? (
        <div className="mb-3 flex flex-wrap gap-2 px-1">
          {fieldOptions.map((field) => {
            const active = controls.selectedField === field.id;
            return (
              <button
                key={`${id}-${field.id}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  controls.onFocusField?.(id, field.id);
                }}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  active
                    ? "border-sky-300 bg-sky-100 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                }`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {children}
    </article>
  );
}

function ActionButton({
  action,
  primary = false,
  variant = "default",
  size = "md",
  inert = false,
}: {
  action: { label: string; href: string };
  primary?: boolean;
  variant?: "default" | "accent";
  size?: "md" | "lg";
  inert?: boolean;
}) {
  const trimmedLabel = action.label.trim();
  const isAddToChrome = trimmedLabel.toLowerCase() === "add to chrome";
  const isMicrosoftEdge = trimmedLabel.toLowerCase() === "microsoft edge";
  const isComparePlans = trimmedLabel.toLowerCase() === "compare plans";
  const padding = size === "lg" ? "px-6 py-3.5 text-base" : "px-5 py-3 text-sm";
  const className = primary || isMicrosoftEdge
    ? `inline-flex items-center justify-center rounded-lg bg-slate-900 ${padding} font-semibold text-white hover:bg-slate-700`
    : variant === "accent"
      ? `inline-flex items-center justify-center rounded-lg border border-amber-400 bg-amber-300 ${padding} font-semibold text-slate-900 hover:bg-amber-200`
      : `inline-flex items-center justify-center rounded-lg border border-slate-300 ${padding} font-semibold text-slate-800 hover:bg-slate-100`;
  const iconSize = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const content = isAddToChrome ? (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Chrome/Chrome.webp" alt="" className={`inline-block ${iconSize}`} />
      <span>{trimmedLabel}</span>
    </span>
  ) : isMicrosoftEdge ? (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Edge/edgelogo.png" alt="" className={`inline-block ${iconSize}`} />
      <span>{trimmedLabel}</span>
    </span>
  ) : (
    trimmedLabel
  );

  if (inert) {
    return <span className={className}>{content}</span>;
  }

  if (isComparePlans) {
    return (
      <Link href="/pricing" className={className}>
        {content}
      </Link>
    );
  }

  if (action.href.startsWith("http")) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  );
}

function sanitizeHomepageHtml(source: string) {
  return basicSanitizeHtml(source, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
  });
}

function FlexBlockPublic({ block, htmlEnabled }: { block: HomepageBlock; htmlEnabled?: boolean }) {
  if (block.type === "image") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {block.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.mediaUrl} alt={block.title || "Homepage image"} className="h-auto w-full object-cover" />
          ) : (
            <div className="grid min-h-40 place-items-center text-sm font-semibold text-slate-500">Image URL not set</div>
          )}
        </div>
        {block.title ? <h3 className="mt-4 text-xl font-semibold text-slate-900">{block.title}</h3> : null}
        {block.subtitle ? <p className="mt-2 text-sm text-slate-600">{block.subtitle}</p> : null}
      </section>
    );
  }

  if (block.type === "video") {
    const isYouTube = /youtube\.com|youtu\.be/i.test(block.mediaUrl || "");
    const isVimeo = /vimeo\.com/i.test(block.mediaUrl || "");
    const embedUrl = block.mediaUrl || "";

    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {embedUrl ? (
            isYouTube || isVimeo ? (
              <iframe
                src={embedUrl}
                title={block.title || "Homepage video"}
                className="h-64 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="h-64 w-full">
                <source src={embedUrl} />
              </video>
            )
          ) : (
            <div className="grid min-h-40 place-items-center text-sm font-semibold text-slate-500">Video URL not set</div>
          )}
        </div>
        {block.title ? <h3 className="mt-4 text-xl font-semibold text-slate-900">{block.title}</h3> : null}
        {block.subtitle ? <p className="mt-2 text-sm text-slate-600">{block.subtitle}</p> : null}
      </section>
    );
  }

  if (block.type === "html") {
    if (htmlEnabled) {
      const sanitized = sanitizeHomepageHtml(block.subtitle || "");
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {block.title ? <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3> : null}
          <div
            className="prose prose-slate mt-4 max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: sanitized || "<p>No HTML content yet.</p>" }}
          />
        </section>
      );
    }
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {block.title ? <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3> : null}
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {block.subtitle || "<div>Custom HTML</div>"}
        </pre>
      </section>
    );
  }

  if (block.type === "columns-2" || block.type === "columns-3") {
    const columns = block.items.length ? block.items : ["Column one", "Column two"];
    const grid = block.type === "columns-3" ? "md:grid-cols-3" : "md:grid-cols-2";
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {block.title ? <h3 className="text-xl font-semibold text-slate-900">{block.title}</h3> : null}
        <div className={`mt-4 grid gap-3 ${grid}`}>
          {columns.map((column, index) => (
            <div key={`${block.uid}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {column}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return null;
}

export function HomepageRenderer({
  model,
  editable,
  flexAllowlist,
  htmlRenderEnabled,
}: {
  model: HomepageRenderModel;
  editable?: EditableControls;
  flexAllowlist?: string;
  htmlRenderEnabled?: boolean;
}) {
  const publicFlexAllowlistRaw = flexAllowlist ?? process.env.NEXT_PUBLIC_HOMEPAGE_FLEX_BLOCKS ?? "";
  const publicFlexAllowlist = publicFlexAllowlistRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowAllFlex = publicFlexAllowlistRaw.trim() === "*";
  const visibleFlexBlocks = editable
    ? model.flexBlocks
    : model.flexBlocks.filter((block) => allowAllFlex || publicFlexAllowlist.includes(block.key));

  const featureShowcase = [
    {
      image: "/features/1.jpg",
      title: "Adaptive Timer Contrast",
      description:
        "The timer box detects the page background and automatically adjusts its color so it stays readable on any site.",
    },
    {
      image: "/features/2.jpg",
      title: "Clear, Hands-On Controls",
      description:
        "Set focus and break minutes, then launch a session with a single Start button. Everything is laid out for fast decisions.",
    },
    {
      image: "/features/3.jpg",
      title: "Drag Anywhere Placement",
      description:
        "Move the timer box to any spot in your Chrome window so it never blocks important content.",
    },
    {
      image: "/features/4.jpg",
      title: "Lunch and Evening Reminders",
      description:
        "Schedule meal reminders at specific times so you step away when you should, even on busy days.",
    },
    {
      image: "/features/5.jpg",
      title: "Break Visual Tab",
      description:
        "Every break opens a calming full-screen tab to help you reset, breathe, and keep your focus rhythm healthy.",
    },
    {
      image: "/features/6.jpg",
      title: "Night Work Mode",
      description:
        "Reduce screen brightness at night to ease eye strain and make late sessions more comfortable.",
    },
    {
      image: "/features/7.jpg",
      title: "Productivity Analytics",
      description:
        "Track daily sessions, completion rate, weekly overview, best focus hours, interruption rate, and smart insights in one place.",
    },
    {
      image: "/features/8.jpg",
      title: "Mute Distracting Sites",
      description:
        "List sites like YouTube, Facebook, X, or Reddit and DeepFocus Time will auto-mute them during focus, then restore sound on breaks.",
    },
    {
      image: "/features/9.jpg",
      title: "Meeting Auto-Pause",
      description:
        "Detects active Meet, Zoom, or Teams tabs and pauses the timer automatically so meetings never skew your focus stats.",
    },
  ];

  return (
    <div className="space-y-10">
      <EditableFrame
        id={model.hero.id}
        label="Hero"
        selectedId={editable?.selectedId}
        controls={editable}
        fieldOptions={[
          { id: "eyebrow", label: "Label" },
          { id: "title", label: "Title" },
          { id: "subtitle", label: "Body" },
          { id: "primaryLabel", label: "Primary CTA" },
          { id: "secondaryLabel", label: "Secondary CTA" },
        ]}
      >
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-6 sm:p-8">
          <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            <FieldTarget blockId={model.hero.id} field="eyebrow" controls={editable} label="Label">
              <InlineEditableText
                blockId={model.hero.id}
                field="eyebrow"
                value={model.hero.eyebrow}
                controls={editable}
                className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
              />
            </FieldTarget>
          </p>
          <FieldTarget blockId={model.hero.id} field="title" controls={editable} className="block" label="Title">
            <InlineEditableText
              blockId={model.hero.id}
              field="title"
              value={model.hero.title}
              controls={editable}
              className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            />
          </FieldTarget>
          <FieldTarget blockId={model.hero.id} field="subtitle" controls={editable} className="mt-4 block" label="Body">
            <InlineEditableMarkdown
              blockId={model.hero.id}
              field="subtitle"
              value={model.hero.subtitle}
              controls={editable}
              className="max-w-2xl text-lg text-slate-600"
            />
          </FieldTarget>
          <div className="mt-8 flex flex-wrap gap-3">
            <FieldTarget blockId={model.hero.id} field="primaryLabel" controls={editable} label="Primary CTA">
              <ActionButton
                action={{
                  ...model.hero.primaryAction,
                  label:
                    editable?.selectedId === model.hero.id && editable?.selectedField === "primaryLabel" ? "" : model.hero.primaryAction.label,
                }}
                primary
                inert
              />
            </FieldTarget>
            <ActionButton action={edgeAction} inert={!!editable} />
            <FieldTarget blockId={model.hero.id} field="secondaryLabel" controls={editable} label="Secondary CTA">
              <ActionButton
                action={{
                  ...model.hero.secondaryAction,
                  label:
                    editable?.selectedId === model.hero.id && editable?.selectedField === "secondaryLabel" ? "" : model.hero.secondaryAction.label,
                }}
                variant="accent"
                inert={!!editable}
              />
            </FieldTarget>
            <ActionButton action={model.hero.tertiaryAction} inert={!!editable} />
          </div>
          {editable?.selectedId === model.hero.id && editable?.selectedField === "primaryLabel" ? (
            <div className="mt-3 max-w-xs">
              <InlineEditableText
                blockId={model.hero.id}
                field="primaryLabel"
                value={model.hero.primaryAction.label}
                controls={editable}
                className="text-sm font-semibold text-slate-900"
              />
            </div>
          ) : null}
          {editable?.selectedId === model.hero.id && editable?.selectedField === "secondaryLabel" ? (
            <div className="mt-3 max-w-xs">
              <InlineEditableText
                blockId={model.hero.id}
                field="secondaryLabel"
                value={model.hero.secondaryAction.label}
                controls={editable}
                className="text-sm font-semibold text-slate-900"
              />
            </div>
          ) : null}
          {model.heroHighlights.items.length ? (
            <div className="mt-6">
              <EditableFrame
                id={model.heroHighlights.id}
                label="Hero Highlights"
                selectedId={editable?.selectedId}
                controls={editable}
                compact
                fieldOptions={[{ id: "items", label: "Items" }]}
              >
                <FieldTarget blockId={model.heroHighlights.id} field="items" controls={editable} className="block" label="Items">
                  {editable?.selectedId === model.heroHighlights.id && editable?.selectedField === "items" ? (
                    <InlineEditableList
                      blockId={model.heroHighlights.id}
                      field="items"
                      items={model.heroHighlights.items}
                      controls={editable}
                      className="grid gap-2 sm:grid-cols-3"
                    />
                  ) : (
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      {model.heroHighlights.items.map((item) => (
                        <p key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </FieldTarget>
              </EditableFrame>
            </div>
          ) : null}
        </section>
      </EditableFrame>

      <section className="space-y-8">
        {featureShowcase.map((item, index) => {
          const reverse = index % 2 === 1;
          return (
            <article
              key={item.title}
              className="grid items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2"
            >
              <div className={reverse ? "md:order-2" : ""}>
                <h3 className="text-3xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p>
              </div>
              <div className={reverse ? "md:order-1" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
                  loading="lazy"
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {model.features.map((feature) => (
          <EditableFrame
            key={feature.id}
            id={feature.id}
            label="Feature Card"
            selectedId={editable?.selectedId}
            controls={editable}
            fieldOptions={[
              { id: "title", label: "Title" },
              { id: "subtitle", label: "Body" },
            ]}
          >
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <FieldTarget blockId={feature.id} field="title" controls={editable} className="block" label="Title">
                <InlineEditableText
                  blockId={feature.id}
                  field="title"
                  value={feature.title}
                  controls={editable}
                  className="text-lg font-semibold text-slate-900"
                />
              </FieldTarget>
              <FieldTarget blockId={feature.id} field="subtitle" controls={editable} className="mt-2 block" label="Body">
                <InlineEditableMarkdown
                  blockId={feature.id}
                  field="subtitle"
                  value={feature.description}
                  controls={editable}
                  className="text-sm text-slate-600"
                />
              </FieldTarget>
            </article>
          </EditableFrame>
        ))}
      </section>

      <section className="space-y-4 -mt-12">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-lg font-semibold text-slate-900 sm:text-xl">
          And many more features built for deep, uninterrupted focus.
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <EditableFrame
            id={model.steps.id}
            label="Steps"
            selectedId={editable?.selectedId}
            controls={editable}
            fieldOptions={[
              { id: "title", label: "Title" },
              { id: "items", label: "Items" },
              { id: "primaryLabel", label: "Button" },
            ]}
          >
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <FieldTarget blockId={model.steps.id} field="title" controls={editable} className="block" label="Title">
                <InlineEditableText
                  blockId={model.steps.id}
                  field="title"
                  value={model.steps.title}
                  controls={editable}
                  className="text-2xl font-semibold text-slate-900"
                />
              </FieldTarget>
              <FieldTarget blockId={model.steps.id} field="items" controls={editable} label="Items">
                {editable?.selectedId === model.steps.id && editable?.selectedField === "items" ? (
                  <InlineEditableList
                    blockId={model.steps.id}
                    field="items"
                    items={model.steps.items}
                    controls={editable}
                    className="mt-4"
                  />
                ) : (
                  <ol className="mt-4 space-y-3 text-base text-slate-700">
                    {model.steps.items.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </FieldTarget>
              <div className="mt-5">
                <FieldTarget blockId={model.steps.id} field="primaryLabel" controls={editable} label="Button">
                  <ActionButton action={model.steps.primaryAction} size="lg" inert={!!editable} />
                </FieldTarget>
              </div>
              {editable?.selectedId === model.steps.id && editable?.selectedField === "primaryLabel" ? (
                <div className="mt-3 max-w-xs">
                  <InlineEditableText
                    blockId={model.steps.id}
                    field="primaryLabel"
                    value={model.steps.primaryAction.label}
                    controls={editable}
                    className="text-sm font-semibold text-slate-900"
                  />
                </div>
              ) : null}
            </article>
          </EditableFrame>

          <EditableFrame
            id={model.audience.id}
            label="Audience"
            selectedId={editable?.selectedId}
            controls={editable}
            fieldOptions={[
              { id: "title", label: "Title" },
              { id: "items", label: "Items" },
              { id: "eyebrow", label: "Preview Label" },
              { id: "mediaUrl", label: "Preview Text" },
            ]}
          >
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <FieldTarget blockId={model.audience.id} field="title" controls={editable} className="block" label="Title">
                <InlineEditableText
                  blockId={model.audience.id}
                  field="title"
                  value={model.audience.title}
                  controls={editable}
                  className="text-2xl font-semibold text-slate-900"
                />
              </FieldTarget>
              <FieldTarget blockId={model.audience.id} field="items" controls={editable} className="mt-4 block" label="Items">
                {editable?.selectedId === model.audience.id && editable?.selectedField === "items" ? (
                  <InlineEditableRoleList
                    blockId={model.audience.id}
                    field="items"
                    items={model.audience.items}
                    controls={editable}
                    className="mt-2"
                  />
                ) : (
                  <div className="space-y-3 text-base text-slate-700">
                    {model.audience.items.map((item) => (
                      <p key={`${item.role}-${item.note}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-900">{item.role}:</span> {item.note}
                      </p>
                    ))}
                  </div>
                )}
              </FieldTarget>
              <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <FieldTarget blockId={model.audience.id} field="eyebrow" controls={editable} className="block" label="Preview Label">
                  <InlineEditableText
                    blockId={model.audience.id}
                    field="eyebrow"
                    value={model.audience.previewLabel}
                    controls={editable}
                    className="text-sm font-semibold uppercase tracking-wide text-slate-500"
                  />
                </FieldTarget>
                <FieldTarget blockId={model.audience.id} field="mediaUrl" controls={editable} className="mt-2 block" label="Preview Text">
                  <InlineEditableMarkdown
                    blockId={model.audience.id}
                    field="mediaUrl"
                    value={model.audience.previewText}
                    controls={editable}
                    className="text-base text-slate-700"
                  />
                </FieldTarget>
              </div>
            </article>
          </EditableFrame>
        </div>
      </section>

      <EditableFrame
        id={model.proofGrid.id}
        label="Proof Grid"
        selectedId={editable?.selectedId}
        controls={editable}
        fieldOptions={[
          { id: "title", label: "Title" },
          { id: "items", label: "Items" },
        ]}
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <FieldTarget blockId={model.proofGrid.id} field="title" controls={editable} className="block" label="Title">
            <InlineEditableText
              blockId={model.proofGrid.id}
              field="title"
              value={model.proofGrid.title}
              controls={editable}
              className="text-2xl font-semibold text-slate-900"
            />
          </FieldTarget>
          <FieldTarget blockId={model.proofGrid.id} field="items" controls={editable} className="block" label="Items">
            {editable?.selectedId === model.proofGrid.id && editable?.selectedField === "items" ? (
              <InlineEditableList
                blockId={model.proofGrid.id}
                field="items"
                items={model.proofGrid.items}
                controls={editable}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              />
            ) : (
              <div className="mt-4 grid gap-3 text-base text-slate-700 sm:grid-cols-2">
                {model.proofGrid.items.map((item) => (
                  <p key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {item}
                  </p>
                ))}
              </div>
            )}
          </FieldTarget>
        </section>
      </EditableFrame>

      <EditableFrame
        id={model.cta.id}
        label="CTA"
        selectedId={editable?.selectedId}
        controls={editable}
        fieldOptions={[
          { id: "title", label: "Title" },
          { id: "subtitle", label: "Body" },
          { id: "primaryLabel", label: "Primary CTA" },
          { id: "secondaryLabel", label: "Secondary CTA" },
        ]}
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <FieldTarget blockId={model.cta.id} field="title" controls={editable} className="block" label="Title">
            <InlineEditableText
              blockId={model.cta.id}
              field="title"
              value={model.cta.title}
              controls={editable}
              className="text-2xl font-semibold text-slate-900"
            />
          </FieldTarget>
          <FieldTarget blockId={model.cta.id} field="subtitle" controls={editable} className="mt-2 block" label="Body">
            <InlineEditableMarkdown
              blockId={model.cta.id}
              field="subtitle"
              value={model.cta.subtitle}
              controls={editable}
              className="max-w-3xl text-base text-slate-600"
            />
          </FieldTarget>
          <div className="mt-5 flex flex-wrap gap-3">
            <FieldTarget blockId={model.cta.id} field="primaryLabel" controls={editable} label="Primary CTA">
              <ActionButton action={model.cta.primaryAction} primary size="lg" inert={!!editable} />
            </FieldTarget>
            <ActionButton action={edgeAction} size="lg" inert={!!editable} />
            <FieldTarget blockId={model.cta.id} field="secondaryLabel" controls={editable} label="Secondary CTA">
              <ActionButton action={model.cta.secondaryAction} size="lg" inert={!!editable} />
            </FieldTarget>
          </div>
          {editable?.selectedId === model.cta.id && editable?.selectedField === "primaryLabel" ? (
            <div className="mt-3 max-w-xs">
              <InlineEditableText
                blockId={model.cta.id}
                field="primaryLabel"
                value={model.cta.primaryAction.label}
                controls={editable}
                className="text-sm font-semibold text-slate-900"
              />
            </div>
          ) : null}
          {editable?.selectedId === model.cta.id && editable?.selectedField === "secondaryLabel" ? (
            <div className="mt-3 max-w-xs">
              <InlineEditableText
                blockId={model.cta.id}
                field="secondaryLabel"
                value={model.cta.secondaryAction.label}
                controls={editable}
                className="text-sm font-semibold text-slate-900"
              />
            </div>
          ) : null}
        </section>
      </EditableFrame>

      {visibleFlexBlocks.length ? (
        <section className="space-y-4">
          {editable ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Flexible blocks below are stored in the block schema and are ready for later public rendering rollout.
            </div>
          ) : null}
          {visibleFlexBlocks.map((block) => (
            <EditableFrame
              key={block.uid}
              id={block.uid}
              label={block.type}
              selectedId={editable?.selectedId}
              controls={editable}
              fieldOptions={[
                { id: "title", label: "Title" },
                { id: "subtitle", label: "Body" },
                { id: "items", label: "Items" },
                { id: "mediaUrl", label: "Media" },
              ]}
            >
              {editable ? (
                <GenericBlockPreview block={block} controls={editable} />
              ) : (
                <FlexBlockPublic block={block} htmlEnabled={htmlRenderEnabled} />
              )}
            </EditableFrame>
          ))}
        </section>
      ) : null}
    </div>
  );
}
