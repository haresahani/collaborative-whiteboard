import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeHtml } from "../src/sanitizer";

describe("DOMPurify Sanitizer Unit Tests", () => {
  it("should strip script tags and XSS vectors from plain text", () => {
    const dirty = "<script>alert('xss')</script>Hello World";
    const cleaned = sanitizeText(dirty);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).toContain("Hello World");
  });

  it("should strip inline event handlers like onerror from plain text", () => {
    const dirty = `<img src="invalid.png" onerror="alert(1)" />Sticky Note Content`;
    const cleaned = sanitizeText(dirty);
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("<img");
    expect(cleaned).toContain("Sticky Note Content");
  });

  it("should strip javascript: URIs", () => {
    const dirty = `<a href="javascript:alert('xss')">Click Me</a>`;
    const cleaned = sanitizeText(dirty);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).toContain("Click Me");
  });

  it("should retain safe HTML tags in sanitizeHtml while stripping dangerous tags", () => {
    const dirty = `<b>Bold text</b> <script>bad()</script> <a href="https://example.com" onclick="steal()">Link</a>`;
    const cleaned = sanitizeHtml(dirty);
    expect(cleaned).toContain("<b>Bold text</b>");
    expect(cleaned).toContain('<a href="https://example.com">Link</a>');
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("onclick");
  });

  it("should handle empty or null non-string inputs gracefully", () => {
    // @ts-expect-error test non-string input
    expect(sanitizeText(null)).toBe("");
    // @ts-expect-error test non-string input
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText("")).toBe("");
  });
});
