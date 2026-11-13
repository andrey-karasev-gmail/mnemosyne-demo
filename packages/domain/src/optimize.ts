import { estimateResources } from "./sizing";
import { REGION_MULTIPLIERS, VM_CAPACITY, VM_PRICING } from "./pricing";

export interface OptimizeInput {
  containers: number;
  avgCpu: number;
  avgMemory: number;
  region: string;
  reserved: boolean;
  highAvailability: boolean;
}

const SKUS = Object.keys(VM_PRICING) as Array<keyof typeof VM_PRICING>;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function optimize(input: OptimizeInput) {
  const containers = clamp(Math.round(input.containers), 1, 10_000);
  const avgCpu = clamp(input.avgCpu, 0.1, 64);
  const avgMemory = clamp(input.avgMemory, 0.1, 512);
  const region = input.region in REGION_MULTIPLIERS ? input.region as keyof typeof REGION_MULTIPLIERS : "eastus";
  const regionMultiplier = REGION_MULTIPLIERS[region];
  const highAvailabilityMultiplier = input.highAvailability ? 2 : 1;
  const sizing = estimateResources(containers, avgCpu, avgMemory);

  // Compare a conservative D16 baseline with the lowest monthly-cost shape that
  // satisfies the requested CPU and memory capacity.
  const baselineNodes = Math.max(
    Math.ceil(sizing.estimatedCpu / VM_CAPACITY.D16s_v5.cpu),
    Math.ceil(sizing.estimatedMemory / VM_CAPACITY.D16s_v5.memory),
    1,
  ) * highAvailabilityMultiplier;
  const monthlyCost = baselineNodes * VM_PRICING.D16s_v5 * regionMultiplier;

  const candidates = SKUS.map((sku) => {
    const capacity = VM_CAPACITY[sku];
    const nodes = Math.max(
      Math.ceil(sizing.estimatedCpu / capacity.cpu),
      Math.ceil(sizing.estimatedMemory / capacity.memory),
      1,
    ) * highAvailabilityMultiplier;
    const onDemandCost = nodes * VM_PRICING[sku] * regionMultiplier;
    return { sku, nodes, onDemandCost };
  }).sort((a, b) => a.onDemandCost - b.onDemandCost || VM_CAPACITY[a.sku].cpu - VM_CAPACITY[b.sku].cpu);

  const best = candidates[0];
  const optimizedCost = best.onDemandCost * (input.reserved ? 0.82 : 1);
  const savingsPercent = monthlyCost === 0 ? 0 : ((monthlyCost - optimizedCost) / monthlyCost) * 100;

  return {
    sku: best.sku,
    nodes: best.nodes,
    ...sizing,
    monthlyCost: Number(monthlyCost.toFixed(2)),
    optimizedCost: Number(optimizedCost.toFixed(2)),
    savingsPercent: Number(savingsPercent.toFixed(2)),
  };
}
