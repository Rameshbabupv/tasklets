export type ChangeType = 'created' | 'status_changed' | 'priority_changed' | 'severity_changed' | 'comment_added' | 'attachment_added' | 'watcher_added' | 'watcher_removed' | 'escalated' | 'assigned' | 'pushed_to_systech' | 'resolved' | 'reopened';
export interface ChangelogEntry {
    id: number;
    ticketId: string;
    changeType: ChangeType;
    userId: number;
    userName: string;
    userEmail?: string;
    oldValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, any>;
    createdAt: string;
}
interface TicketChangelogProps {
    ticketId: string;
    className?: string;
}
export default function TicketChangelog({ ticketId, className }: TicketChangelogProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TicketChangelog.d.ts.map