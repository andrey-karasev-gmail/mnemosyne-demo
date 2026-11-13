-- CreateTable
CREATE TABLE "OptimizationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" TEXT NOT NULL,
    "containers" INTEGER NOT NULL,
    "avgCpu" REAL NOT NULL,
    "avgMemory" REAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nodes" INTEGER NOT NULL,
    "reserved" BOOLEAN NOT NULL DEFAULT false,
    "highAvailability" BOOLEAN NOT NULL DEFAULT false,
    "monthlyCost" REAL NOT NULL,
    "optimizedCost" REAL NOT NULL,
    "savingsPercent" REAL NOT NULL,
    "traceJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CostTrace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL,
    "outputJson" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    CONSTRAINT "CostTrace_runId_fkey" FOREIGN KEY ("runId") REFERENCES "OptimizationRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
