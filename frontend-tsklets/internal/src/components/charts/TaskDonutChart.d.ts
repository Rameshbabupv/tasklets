interface TaskDistribution {
    label: string;
    value: number;
    color: string;
    darkColor?: string;
}
interface TaskDonutChartProps {
    data: TaskDistribution[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerValue?: string | number;
}
export default function TaskDonutChart({ data, size, strokeWidth, centerLabel, centerValue, }: TaskDonutChartProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TaskDonutChart.d.ts.map