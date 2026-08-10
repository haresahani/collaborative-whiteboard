import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.removeAttribute("data-theme");

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

// Apply on system preference change when "system" theme is active
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
  const stored = localStorage.getItem("wb-theme") as Theme | null;
  if (!stored || stored === "system") applyTheme("system");
});

const storedTheme = (localStorage.getItem("wb-theme") as Theme | null) ?? "system";
applyTheme(storedTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: storedTheme,
  setTheme: (theme) => {
    localStorage.setItem("wb-theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));
