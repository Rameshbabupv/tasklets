import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useTheme = create()(persist((set) => ({
    theme: 'dark', // Default to dark theme
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
    })),
    setTheme: (theme) => set({ theme }),
}), {
    name: 'theme-storage',
}));
