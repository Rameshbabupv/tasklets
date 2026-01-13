interface TenantCardProps {
    tenant: {
        id: number;
        name: string;
        tier: 'enterprise' | 'business' | 'starter';
        isActive: boolean;
        userCount: number;
        ticketCount: number;
    };
}
export default function TenantCard({ tenant }: TenantCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TenantCard.d.ts.map