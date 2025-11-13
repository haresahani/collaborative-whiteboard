import "@testing-library/jest-dom";

// Polyfill matchMedia for jsdom (define on window and globalThis)
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null as unknown,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mocking globalThis.matchMedia for jsdom
(globalThis as any).matchMedia = mockMatchMedia;

// Mock canvas getContext to avoid jsdom not-implemented errors (override unconditionally)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mocking HTMLCanvasElement.prototype for jsdom
(HTMLCanvasElement.prototype as any).getContext = () => {
  // Minimal 2D context mock
  return {
    save: () => {},
    restore: () => {},
    scale: () => {},
    rotate: () => {},
    translate: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    arc: () => {},
    rect: () => {},
    measureText: () => ({ width: 0 }),
    set lineWidth(_v: number) {},
    set strokeStyle(_v: string) {},
    set fillStyle(_v: string) {},
    set globalAlpha(_v: number) {},
    set lineCap(_v: string) {},
    set lineJoin(_v: string) {},
    canvas: document.createElement("canvas"),
  } as unknown as CanvasRenderingContext2D;
};
