interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    color?: string;
    emoji?: string;
    trend?: {
        value: number;
        label: string;
    };
}
export default function StatCard({ icon, label, value, color, emoji, trend }: StatCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StatCard.d.ts.map