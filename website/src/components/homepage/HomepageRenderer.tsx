import Link from "next/link";
import type { HomepageBlock } from "@/lib/cms/homepageBlocks";
import type { HomepageRenderModel } from "@/lib/cms/homepageRenderModel";

type EditableControls = {
  selectedId?: string;
  selectedField?: string;
  onSelect?: (id: string) => void;
  onFocusField?: (id: string, field: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDrop?: (id: string) => void;
};

function FieldTarget({
  blockId,
  field,
  controls,
  children,
  className = "",
}: {
  blockId: string;
  field: string;
  controls?: EditableControls;
  children: React.ReactNode;
  className?: string;
}) {
  if (!controls?.onFocusField) {
    return <>{children}</>;
  }

  const isSelected = controls.selectedId === blockId && controls.selectedField === field;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        controls.onSelect?.(blockId);
        controls.onFocusField?.(blockId, field);
      }}
      className={`rounded-md text-left transition ${isSelected ? "ring-2 ring-sky-200" : "hover:ring-2 hover:ring-sky-100"} ${className}`}
    >
      {children}
    </button>
  );
}

function GenericBlockPreview({ block }: { block: HomepageBlock }) {
  if (block.type === "image" || block.type === "video") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-slate-50 text-sm font-semibold text-sky-700">
          {block.type === "image" ? "Image preview" : "Video preview"}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">{block.title || "Media block"}</h3>
        <p className="mt-2 text-sm text-slate-600">{block.subtitle || "Standalone media module."}</p>
      </div>
    );
  }

  if (block.type === "html") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-semibold text-slate-900">{block.title || "HTML embed"}</h3>
        <code className="mt-4 block rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {block.subtitle || "<div>Custom HTML</div>"}
        </code>
      </div>
    );
  }

  const columns = block.items.length ? block.items : ["Column one", "Column two"];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">{block.title || "Columns block"}</h3>
      <div className={`mt-4 grid gap-3 ${block.type === "columns-3" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {columns.map((column, index) => (
          <div key={`${block.uid}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            {column}
          </div>
        ))}
      </div>
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
  inert = false,
}: {
  action: { label: string; href: string };
  primary?: boolean;
  inert?: boolean;
}) {
  const className = primary
    ? "rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
    : "rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100";

  if (inert) {
    return <span className={`${className} inline-flex`}>{action.label}</span>;
  }

  if (action.href.startsWith("http")) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  );
}

export function HomepageRenderer({
  model,
  editable,
}: {
  model: HomepageRenderModel;
  editable?: EditableControls;
}) {
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
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
          <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            <FieldTarget blockId={model.hero.id} field="eyebrow" controls={editable}>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{model.hero.eyebrow}</span>
            </FieldTarget>
          </p>
          <FieldTarget blockId={model.hero.id} field="title" controls={editable} className="block">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{model.hero.title}</h1>
          </FieldTarget>
          <FieldTarget blockId={model.hero.id} field="subtitle" controls={editable} className="mt-4 block">
            <p className="max-w-2xl text-lg text-slate-600">{model.hero.subtitle}</p>
          </FieldTarget>
          <div className="mt-8 flex flex-wrap gap-3">
            <FieldTarget blockId={model.hero.id} field="primaryLabel" controls={editable}>
              <ActionButton action={model.hero.primaryAction} primary inert={!!editable} />
            </FieldTarget>
            <FieldTarget blockId={model.hero.id} field="secondaryLabel" controls={editable}>
              <ActionButton action={model.hero.secondaryAction} inert={!!editable} />
            </FieldTarget>
            <ActionButton action={model.hero.tertiaryAction} inert={!!editable} />
          </div>
          <div className="mt-6">
            <EditableFrame
              id={model.heroHighlights.id}
              label="Hero Highlights"
              selectedId={editable?.selectedId}
              controls={editable}
              compact
              fieldOptions={[{ id: "items", label: "Items" }]}
            >
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                {model.heroHighlights.items.map((item) => (
                  <FieldTarget key={item} blockId={model.heroHighlights.id} field="items" controls={editable} className="block">
                    <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">{item}</p>
                  </FieldTarget>
                ))}
              </div>
            </EditableFrame>
          </div>
        </section>
      </EditableFrame>

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
              <FieldTarget blockId={feature.id} field="title" controls={editable} className="block">
                <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              </FieldTarget>
              <FieldTarget blockId={feature.id} field="subtitle" controls={editable} className="mt-2 block">
                <p className="text-sm text-slate-600">{feature.description}</p>
              </FieldTarget>
            </article>
          </EditableFrame>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
            <FieldTarget blockId={model.steps.id} field="title" controls={editable} className="block">
              <h2 className="text-xl font-semibold text-slate-900">{model.steps.title}</h2>
            </FieldTarget>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {model.steps.items.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {index + 1}
                  </span>
                  <FieldTarget blockId={model.steps.id} field="items" controls={editable}>
                    <span>{step}</span>
                  </FieldTarget>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <FieldTarget blockId={model.steps.id} field="primaryLabel" controls={editable}>
                <ActionButton action={model.steps.primaryAction} inert={!!editable} />
              </FieldTarget>
            </div>
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
            <FieldTarget blockId={model.audience.id} field="title" controls={editable} className="block">
              <h2 className="text-xl font-semibold text-slate-900">{model.audience.title}</h2>
            </FieldTarget>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {model.audience.items.map((item) => (
                <FieldTarget key={item.role} blockId={model.audience.id} field="items" controls={editable} className="block">
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-slate-900">{item.role}:</span> {item.note}
                  </p>
                </FieldTarget>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
              <FieldTarget blockId={model.audience.id} field="eyebrow" controls={editable} className="block">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{model.audience.previewLabel}</p>
              </FieldTarget>
              <FieldTarget blockId={model.audience.id} field="mediaUrl" controls={editable} className="mt-2 block">
                <p className="text-sm text-slate-700">{model.audience.previewText}</p>
              </FieldTarget>
            </div>
          </article>
        </EditableFrame>
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
          <FieldTarget blockId={model.proofGrid.id} field="title" controls={editable} className="block">
            <h2 className="text-xl font-semibold text-slate-900">{model.proofGrid.title}</h2>
          </FieldTarget>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {model.proofGrid.items.map((item) => (
              <FieldTarget key={item} blockId={model.proofGrid.id} field="items" controls={editable} className="block">
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{item}</p>
              </FieldTarget>
            ))}
          </div>
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
          <FieldTarget blockId={model.cta.id} field="title" controls={editable} className="block">
            <h2 className="text-xl font-semibold text-slate-900">{model.cta.title}</h2>
          </FieldTarget>
          <FieldTarget blockId={model.cta.id} field="subtitle" controls={editable} className="mt-2 block">
            <p className="max-w-3xl text-sm text-slate-600">{model.cta.subtitle}</p>
          </FieldTarget>
          <div className="mt-5 flex flex-wrap gap-3">
            <FieldTarget blockId={model.cta.id} field="primaryLabel" controls={editable}>
              <ActionButton action={model.cta.primaryAction} primary inert={!!editable} />
            </FieldTarget>
            <FieldTarget blockId={model.cta.id} field="secondaryLabel" controls={editable}>
              <ActionButton action={model.cta.secondaryAction} inert={!!editable} />
            </FieldTarget>
          </div>
        </section>
      </EditableFrame>

      {model.flexBlocks.length ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Flexible blocks below are stored in the block schema and are ready for later public rendering rollout.
          </div>
          {model.flexBlocks.map((block) => (
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
              <GenericBlockPreview block={block} />
            </EditableFrame>
          ))}
        </section>
      ) : null}
    </div>
  );
}
