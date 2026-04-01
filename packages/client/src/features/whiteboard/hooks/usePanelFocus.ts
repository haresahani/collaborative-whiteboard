import { useEffect, useRef } from "react";

export function usePanelFocus(isOpen: boolean) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      const focusId = window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(focusId);
    }

    if (previousFocusRef.current?.isConnected) {
      previousFocusRef.current.focus();
    }

    return undefined;
  }, [isOpen]);

  return closeButtonRef;
}
