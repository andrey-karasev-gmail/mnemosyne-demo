export interface OptimizationRequest {
  containers: number;
  avgCpu: number;
  avgMemory: number;
  region: string;
  reserved: boolean;
  highAvailability: boolean;
}

export type CloudRegion = "eastus" | "westus" | "centralus";

export interface Recommendation {
  id: string;
  title: string;
  monthlySavings: number;
  impact: "easy" | "medium" | "high";
  status: "ready" | "applied" | "dismissed";
}

export interface OptimizationResult {
  sku: string;
  estimatedCpu: number;
  estimatedMemory: number;
  monthlyCost: number;
  optimizedCost: number;
  savingsPercent: number;
}
