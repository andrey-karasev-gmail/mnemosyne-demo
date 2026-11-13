export function recommendSku(cpu: number): "D4s_v5" | "D8s_v5" | "D16s_v5" {
  if (cpu <= 4) return "D4s_v5";
  if (cpu <= 8) return "D8s_v5";
  return "D16s_v5";
}
