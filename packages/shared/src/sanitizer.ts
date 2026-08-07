import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

let purify: ReturnType<typeof createDOMPurify>;

if (typeof window !== "undefined" && window.document) {
  purify = createDOMPurify(window);
} else {
  const dom = new JSDOM("");
  purify = createDOMPurify(
    dom.window as unknown as Parameters<typeof createDOMPurify>[0],
  );
}

/**
 * Sanitizes plain text by stripping all HTML tags and XSS vectors.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  const cleaned = purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return cleaned;
}

/**
 * Sanitizes rich HTML content, keeping safe formatting tags while removing scripts, event handlers, and malicious URIs.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
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
