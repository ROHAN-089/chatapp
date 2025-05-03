import { create } from "zustand";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("chat-theme") || "coffee", // default theme
    setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme); // Update HTML attribute
        set({ theme });
        localStorage.setItem("chat-theme", theme);
    },
}));