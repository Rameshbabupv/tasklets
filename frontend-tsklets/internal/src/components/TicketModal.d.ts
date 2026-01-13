interface DevTaskTicket {
    id: string;
    issueKey: string;
    title: string;
    description: string;
    productId: number;
    productName: string | null;
    productCode: string | null;
}
interface TicketModalProps {
    issueKey: string;
    onClose: () => void;
    onStatusChange?: () => void;
    onCreateDevTask?: (ticket: DevTaskTicket) => void;
}
export default function TicketModal({ issueKey, onClose, onStatusChange, onCreateDevTask }: TicketModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TicketModal.d.ts.map