interface Ticket {
    id: string;
    issueKey: string;
    title: string;
    description: string;
    productId: number;
    productName: string | null;
    productCode: string | null;
}
interface DevTaskModalProps {
    ticket: Ticket;
    onClose: () => void;
    onSuccess: (issueKey: string) => void;
}
export default function DevTaskModal({ ticket, onClose, onSuccess }: DevTaskModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DevTaskModal.d.ts.map