import DOMPurify from "dompurify";

let nodePurify: ReturnType<typeof DOMPurify> | null = null;

function getPurify(): ReturnType<typeof DOMPurify> {
  if (typeof window !== "undefined" && window.document) {
    return DOMPurify;
  }
  if (!nodePurify) {
    // Dynamic require for Node.js environment to prevent Vite bundling jsdom in browser
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JSDOM } = require("jsdom");
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
