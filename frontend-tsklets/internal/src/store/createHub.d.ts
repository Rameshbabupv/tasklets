export type CreateType = 'idea' | 'requirement' | 'epic' | 'feature' | 'task' | 'bug' | 'ticket';
interface CreateHubState {
    isOpen: boolean;
    mode: 'quick' | 'flow';
    selectedType: CreateType | null;
    context: {
        currentView: string;
        suggestedType: CreateType | null;
        parentId?: number;
    };
    open: (context?: Partial<CreateHubState['context']>) => void;
    close: () => void;
    setMode: (mode: 'quick' | 'flow') => void;
    selectType: (type: CreateType | null) => void;
    setContext: (context: Partial<CreateHubState['context']>) => void;
}
export declare const useCreateHub: import("zustand").UseBoundStore<import("zustand").StoreApi<CreateHubState>>;
export {};
//# sourceMappingURL=createHub.d.ts.map