interface VelocityData {
    sprintName: string;
    velocity: number;
    plannedPoints: number;
    completedPoints: number;
}
interface VelocityChartProps {
    data: VelocityData[];
    height?: number;
}
export default function VelocityChart({ data, height }: VelocityChartProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=VelocityChart.d.ts.map