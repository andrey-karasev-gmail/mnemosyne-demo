export const REGIONAL_PRICING = {
  eastus: 0.92,
  westus: 1.07,
  centralus: 0.98,
};

export const REGION_MULTIPLIERS = {
  eastus: 1,
  westus: 1.16,
  centralus: 1.06,
} as const;

export const VM_PRICING = {
  D4s_v5: 220,
  D8s_v5: 420,
  D16s_v5: 800,
};

export const VM_CAPACITY = {
  D4s_v5: { cpu: 4, memory: 16 },
  D8s_v5: { cpu: 8, memory: 32 },
  D16s_v5: { cpu: 16, memory: 64 },
} as const;
