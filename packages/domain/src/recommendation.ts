export interface CostRecommendation {
  id: string;
  title: string;
  monthlySavings: number;
  impact: "easy" | "medium" | "high";
  status: "ready";
}

export const DEMO_RECOMMENDATIONS: CostRecommendation[] = [
  { id: "right-size", title: "Right-size 6 workloads", monthlySavings: 1240, impact: "easy", status: "ready" },
  { id: "reserved-capacity", title: "Commit to reserved capacity", monthlySavings: 860, impact: "high", status: "ready" },
  { id: "storage-tier", title: "Move inactive snapshots to cool storage", monthlySavings: 420, impact: "easy", status: "ready" },
  { id: "autoscaling", title: "Tune development autoscaling", monthlySavings: 1160, impact: "medium", status: "ready" },
];
