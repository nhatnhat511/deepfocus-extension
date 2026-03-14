type SanitizeOptions = {
  allowedTags: string[];
  allowedAttributes?: Record<string, string[]>;
  allowDataImages?: boolean;
};

const TAG_RE = /<\/?([a-z0-9-]+)(\s[^>]*)?>/gi;
const SCRIPT_STYLE_RE = /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi;
const EVENT_HANDLER_RE = /\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;

function sanitizeUrl(value: string, allowDataImages: boolean) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:")) return "";
  if (lower.startsWith("data:")) {
    if (allowDataImages && lower.startsWith("data:image/")) return trimmed;
    return "";
  }
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
    return trimmed;
  }
  return "";
}

function filterAttributes(
  raw: string,
  tag: string,
  allowed: Record<string, string[]> | undefined,
  allowDataImages: boolean,
) {
  if (!allowed) return "";
  const allowedForTag = allowed[tag] || [];
  if (!allowedForTag.length) return "";

  const attrs: string[] = [];
  const attrRe = /([^\s=]+)(?:\s*=\s*(".*?"|'.*?'|[^\s>]+))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRe.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    if (!allowedForTag.includes(name)) continue;
    const rawValue = match[2] ?? "";
    if (name === "href" || name === "src") {
      const safe = sanitizeUrl(rawValue, allowDataImages && name === "src");
      if (!safe) continue;
      attrs.push(`${name}="${safe}"`);
    } else if (name === "target") {
      attrs.push('target="_blank"');
    } else if (name === "rel") {
      attrs.push('rel="noreferrer noopener"');
    } else if (rawValue) {
      const cleaned = rawValue.replace(/^["']|["']$/g, "");
      attrs.push(`${name}="${cleaned}"`);
    } else {
      attrs.push(name);
    }
  }

  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

export function basicSanitizeHtml(input: string, options: SanitizeOptions) {
  const allowedTags = options.allowedTags.map((tag) => tag.toLowerCase());
  const allowedAttrs = options.allowedAttributes ?? {};
  const allowDataImages = options.allowDataImages ?? false;

  let html = input || "";
  html = html.replace(SCRIPT_STYLE_RE, "");
  html = html.replace(EVENT_HANDLER_RE, "");

  return html.replace(TAG_RE, (full, rawTag, rawAttrs = "") => {
    const tag = String(rawTag).toLowerCase();
    if (!allowedTags.includes(tag)) {
      return "";
    }
    const isClosing = full.startsWith("</");
    if (isClosing) {
      return `</${tag}>`;
    }
    const attrs = filterAttributes(rawAttrs, tag, allowedAttrs, allowDataImages);
    return `<${tag}${attrs}>`;
  });
}
