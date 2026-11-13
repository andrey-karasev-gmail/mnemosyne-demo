import cors from "cors";
import express from "express";
import { z } from "zod";
import { prisma } from "@demo/database";
import { DEMO_RECOMMENDATIONS } from "@demo/domain";
import { traceOptimization } from "@demo/tracing";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: "32kb" }));

const optimizationInput = z.object({
  containers: z.number().int().min(1).max(10_000),
  avgCpu: z.number().positive().max(64),
  avgMemory: z.number().positive().max(512),
  region: z.string().min(1),
  reserved: z.boolean(),
  highAvailability: z.boolean(),
});

app.get("/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", service: "mnemosyne-cost-api", database: "connected" });
  } catch (error) {
    console.error("Prisma health check failed", error);
    response.status(503).json({ status: "error", service: "mnemosyne-cost-api", database: "unavailable" });
  }
});

app.post("/api/optimize", async (request, response) => {
  const parsed = optimizationInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid optimization input", details: parsed.error.flatten() });
    return;
  }

  try {
    const trace = traceOptimization(parsed.data);
    const result = trace.output as {
      sku: string;
      nodes: number;
      estimatedCpu: number;
      estimatedMemory: number;
      monthlyCost: number;
      optimizedCost: number;
      savingsPercent: number;
    };
    const run = await prisma.optimizationRun.create({
      data: {
        ...parsed.data,
        sku: result.sku,
        nodes: result.nodes,
        monthlyCost: result.monthlyCost,
        optimizedCost: result.optimizedCost,
        savingsPercent: result.savingsPercent,
        traceJson: JSON.stringify({ nodes: trace.nodes, diagram: trace.diagram, identicalOutput: trace.identicalOutput }),
        traces: {
          create: trace.nodes.map((node) => ({
            stepName: node.label,
            inputJson: JSON.stringify(node.inputs),
            outputJson: JSON.stringify(node.value) ?? "null",
            durationMs: 0,
          })),
        },
      },
    });

    response.json({
      ...result,
      runId: run.id,
      provenance: {
        nodeCount: trace.nodes.length,
        behaviorPreserved: trace.identicalOutput,
        nodes: trace.nodes,
        diagram: trace.diagram,
      },
    });
  } catch (error) {
    console.error("Optimization trace or database write failed", error);
    response.status(500).json({ error: "Optimization could not be traced or saved." });
  }
});

app.get("/api/recommendations", (_request, response) => {
  response.json(DEMO_RECOMMENDATIONS);
});

app.get("/api/runs", async (_request, response) => {
  const runs = await prisma.optimizationRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, createdAt: true, region: true, containers: true, sku: true, nodes: true, monthlyCost: true, optimizedCost: true, savingsPercent: true },
  });
  response.json(runs);
});

app.get("/api/runs/:runId/trace", async (request, response) => {
  const run = await prisma.optimizationRun.findUnique({
    where: { id: request.params.runId },
    select: { id: true, traceJson: true },
  });
  if (!run) {
    response.status(404).json({ error: "Optimization run not found." });
    return;
  }
  response.json({ runId: run.id, ...JSON.parse(run.traceJson) });
});

app.listen(port, () => {
  console.log(`Mnemosyne cost API listening on http://localhost:${port}`);
});
