import type { Ticket, UserRole } from '@tsklets/types';
interface TicketActionsProps {
    ticket: Ticket;
    userRole: UserRole;
    onActionComplete: () => void;
}
export default function TicketActions({ ticket, userRole, onActionComplete, }: TicketActionsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=TicketActions.d.ts.map