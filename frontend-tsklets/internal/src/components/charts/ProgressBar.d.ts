interface ProgressBarProps {
    progress: number;
    label?: string;
    sublabel?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    status?: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'default';
    color?: string;
    animate?: boolean;
}
export default function ProgressBar({ progress, label, sublabel, showPercentage, size, status, color, animate, }: ProgressBarProps): import("react/jsx-runtime").JSX.Element;
interface RoadmapProgressProps {
    title: string;
    issueKey?: string;
    progress: number;
    targetDate?: string;
    status?: 'on-track' | 'at-risk' | 'delayed' | 'completed';
    color?: string;
    children?: React.ReactNode;
    onClick?: () => void;
}
export declare function RoadmapProgress({ title, issueKey, progress, targetDate, status, color, children, onClick, }: RoadmapProgressProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProgressBar.d.ts.map