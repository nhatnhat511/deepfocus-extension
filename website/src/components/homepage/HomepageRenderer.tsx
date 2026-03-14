import Link from "next/link";
import type { HomepageBlock } from "@/lib/cms/homepageBlocks";
import type { HomepageRenderModel } from "@/lib/cms/homepageRenderModel";

type EditableControls = {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDrop?: (id: string) => void;
};

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
}: {
  id: string;
  label: string;
  selectedId?: string;
  controls?: EditableControls;
  children: React.ReactNode;
  compact?: boolean;
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
      <EditableFrame id={model.hero.id} label="Hero" selectedId={editable?.selectedId} controls={editable}>
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
          <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            {model.hero.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{model.hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">{model.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton action={model.hero.primaryAction} primary inert={!!editable} />
            <ActionButton action={model.hero.secondaryAction} inert={!!editable} />
            <ActionButton action={model.hero.tertiaryAction} inert={!!editable} />
          </div>
          <div className="mt-6">
            <EditableFrame
              id={model.heroHighlights.id}
              label="Hero Highlights"
              selectedId={editable?.selectedId}
              controls={editable}
              compact
            >
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                {model.heroHighlights.items.map((item) => (
                  <p key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    {item}
                  </p>
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
          >
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </article>
          </EditableFrame>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EditableFrame id={model.steps.id} label="Steps" selectedId={editable?.selectedId} controls={editable}>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">{model.steps.title}</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {model.steps.items.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <ActionButton action={model.steps.primaryAction} inert={!!editable} />
            </div>
          </article>
        </EditableFrame>

        <EditableFrame id={model.audience.id} label="Audience" selectedId={editable?.selectedId} controls={editable}>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">{model.audience.title}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {model.audience.items.map((item) => (
                <p key={item.role} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-900">{item.role}:</span> {item.note}
                </p>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{model.audience.previewLabel}</p>
              <p className="mt-2 text-sm text-slate-700">{model.audience.previewText}</p>
            </div>
          </article>
        </EditableFrame>
      </section>

      <EditableFrame id={model.proofGrid.id} label="Proof Grid" selectedId={editable?.selectedId} controls={editable}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">{model.proofGrid.title}</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {model.proofGrid.items.map((item) => (
              <p key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </p>
            ))}
          </div>
        </section>
      </EditableFrame>

      <EditableFrame id={model.cta.id} label="CTA" selectedId={editable?.selectedId} controls={editable}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">{model.cta.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{model.cta.subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton action={model.cta.primaryAction} primary inert={!!editable} />
            <ActionButton action={model.cta.secondaryAction} inert={!!editable} />
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
            >
              <GenericBlockPreview block={block} />
            </EditableFrame>
          ))}
        </section>
      ) : null}
    </div>
  );
}
