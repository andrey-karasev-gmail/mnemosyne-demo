import path from "node:path";
import { runTraceOnce, toMermaid, type TapeNode } from "@web4w3/mnemosyne";

export interface TraceNode {
  step: string;
  input: unknown;
  output: unknown;
  durationMs: number;
}

export class TraceCollector {
  private readonly traces: TraceNode[] =
    [];

  add(trace: TraceNode) {
    this.traces.push(trace);
  }

  getAll() {
    return this.traces;
  }

  clear() {
    this.traces.length = 0;
  }
}

export interface OptimizationTrace {
  nodes: TapeNode[];
  diagram: string;
  identicalOutput: boolean;
  output: unknown;
}

const OPTIMIZER_ENTRY = path.resolve(__dirname, "../examples/optimize-trace.ts");

/** Run the real domain optimizer through Mnemosyne's Babel instrumentation. */
export function traceOptimization(input: {
  containers: number;
  avgCpu: number;
  avgMemory: number;
  region: string;
  reserved: boolean;
  highAvailability: boolean;
}): OptimizationTrace {
  const trace = runTraceOnce(
    { MNEMOSYNE_OPTIMIZE_INPUT: JSON.stringify(input) },
    OPTIMIZER_ENTRY,
  );
  if (!trace.identicalOutput) {
    throw new Error("Mnemosyne detected a behavior mismatch while tracing the optimizer.");
  }
  return {
    nodes: trace.nodes,
    diagram: toMermaid(trace.nodes),
    identicalOutput: trace.identicalOutput,
    output: trace.instrumentedLogs[0]?.[0],
  };
}
