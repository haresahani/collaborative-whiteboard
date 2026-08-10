import { describe, it, expect } from "vitest";
import { isValidImageFile } from "./imageLoader";

describe("Image Loader Utilities", () => {
  it("should validate image file types correctly", () => {
    const pngFile = new File([""], "test.png", { type: "image/png" });
    const jpgFile = new File([""], "test.jpg", { type: "image/jpeg" });
    const gifFile = new File([""], "test.gif", { type: "image/gif" });
    const icoFile = new File([""], "test.ico", { type: "image/x-icon" });
    const txtFile = new File([""], "test.txt", { type: "text/plain" });

    expect(isValidImageFile(pngFile)).toBe(true);
    expect(isValidImageFile(jpgFile)).toBe(true);
    expect(isValidImageFile(gifFile)).toBe(true);
    expect(isValidImageFile(icoFile)).toBe(true);
    expect(isValidImageFile(txtFile)).toBe(false);
  });
});
