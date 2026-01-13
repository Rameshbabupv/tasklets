import { create } from 'zustand';
export const useCreateHub = create((set) => ({
    isOpen: false,
    mode: 'quick',
    selectedType: null,
    context: {
        currentView: 'dashboard',
        suggestedType: null,
    },
    open: (context) => set((state) => ({
        isOpen: true,
        context: { ...state.context, ...context }
    })),
    close: () => set({ isOpen: false, selectedType: null }),
    setMode: (mode) => set({ mode }),
    selectType: (type) => set({ selectedType: type }),
    setContext: (context) => set((state) => ({
        context: { ...state.context, ...context }
    })),
}));
