export function estimateResources(containers: number, avgCpu: number, avgMemory: number) {
  const count = Math.max(1, Math.ceil(containers));
  return {
    estimatedCpu: Math.ceil(count * avgCpu),
    estimatedMemory: Math.ceil(count * avgMemory),
  };
}
