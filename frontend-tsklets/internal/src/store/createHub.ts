import { create } from 'zustand'

export type CreateType = 'idea' | 'requirement' | 'epic' | 'feature' | 'task' | 'bug' | 'ticket'

interface CreateHubState {
  isOpen: boolean
  mode: 'quick' | 'flow'
  selectedType: CreateType | null
  context: {
    currentView: string
    suggestedType: CreateType | null
    parentId?: number
  }

  open: (context?: Partial<CreateHubState['context']>) => void
  close: () => void
  setMode: (mode: 'quick' | 'flow') => void
  selectType: (type: CreateType | null) => void
  setContext: (context: Partial<CreateHubState['context']>) => void
}

export const useCreateHub = create<CreateHubState>((set) => ({
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
}))
