/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";

let nodePurify: ReturnType<typeof DOMPurify> | null = null;

let jsdomModule: any = null;
if (typeof window === "undefined") {
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    jsdomModule = req("jsdom");
  } catch (err) {
    console.error("[Sanitizer] Failed to load JSDOM in Node environment:", err);
  }
}

function getPurify(): ReturnType<typeof DOMPurify> {
  if (typeof window !== "undefined" && window.document) {
    return DOMPurify;
  }
  if (!nodePurify) {
    if (!jsdomModule) {
      throw new Error(
        "[Sanitizer] JSDOM is required in Node.js environment but was not loaded.",
      );
    }
    const { JSDOM } = jsdomModule;
    const dom = new JSDOM("");
    nodePurify = DOMPurify(
      dom.window as unknown as Parameters<typeof DOMPurify>[0],
    );
  }
  return nodePurify;
}

/**
 * Sanitizes plain text by stripping all HTML tags and XSS vectors.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  const purify = getPurify();
  return purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes rich HTML content, keeping safe formatting tags while removing scripts, event handlers, and malicious URIs.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  const purify = getPurify();
  return purify.sanitize(input, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "span",
    ],
    ALLOWED_ATTR: ["href", "title", "target"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^/:]|$))/i,
  });
}
