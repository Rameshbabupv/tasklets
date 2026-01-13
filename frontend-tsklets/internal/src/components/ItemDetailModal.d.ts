interface ItemDetail {
    id: number;
    title: string;
    description?: string | null;
    status?: string;
    priority?: number;
    type?: string;
    storyPoints?: number | null;
    issueKey?: string;
    estimate?: number | null;
    actualTime?: number | null;
    dueDate?: string | null;
    labels?: string[] | null;
    blockedReason?: string | null;
    severity?: 'critical' | 'major' | 'minor' | 'trivial' | null;
    environment?: 'production' | 'staging' | 'development' | 'local' | null;
    targetDate?: string | null;
    startDate?: string | null;
    color?: string | null;
    progress?: number | null;
    acceptanceCriteria?: string | null;
    resolution?: string | null;
    resolutionNote?: string | null;
    closedAt?: string | null;
    metadata?: Record<string, any> | null;
    createdAt?: string;
    updatedAt?: string;
}
interface ItemDetailModalProps {
    item: ItemDetail | null;
    itemType: 'epic' | 'feature' | 'task';
    onClose: () => void;
}
export default function ItemDetailModal({ item, itemType, onClose }: ItemDetailModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ItemDetailModal.d.ts.map