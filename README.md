# Mnemosyne Cloud Cost Demo

A cloud cost optimization demo that traces recommendations through the real optimizer with Mnemosyne and saves result provenance with Prisma. It includes a Next.js dashboard, REST and GraphQL APIs, a shared TypeScript cost model, and local SQLite persistence.

## Prepare Prisma

Generate the client and apply the SQLite schema before starting the API:

```bash
npm run db:generate
npm run db:migrate
```

The development database lives at `packages/database/prisma/dev.db`.

## Start the dashboard

```bash
npm install
npm run dev:web
```

Open <http://localhost:3000>. The estimate updates as you change workload size, resource requests, region, reservations, or availability. **Run optimization** sends the scenario to the API, traces it with Mnemosyne, verifies that tracing preserved the result, and saves both the run and trace in Prisma. Use **Provenance** to inspect the execution graph and input-to-output steps. **Export report** downloads the current scenario as CSV.

## Start the services

In separate terminals, run:

```bash
npm run dev:api
npm run dev:graphql
```

The REST service listens on port `3001` (`GET /health`, `POST /api/optimize`, `GET /api/recommendations`, `GET /api/runs`, and `GET /api/runs/:runId/trace`). The GraphQL service listens on port `4000` and exposes `health`, `recommendations`, and `optimize(input:)` queries.

## Mnemosyne provenance

`packages/tracing` calls Mnemosyne’s `runTraceOnce` on a small entry file that imports the real optimizer from `packages/domain`. Mnemosyne instruments the optimizer and its local sizing and pricing modules, records a DAG of inputs, bindings, operations, and outputs, and compares plain and instrumented console results. The API stores the DAG and Mermaid diagram with each optimization run; the dashboard’s Provenance panel displays that saved trace. The demo links to the adjacent `mnemosyne` checkout with a local file dependency, so keep both repositories under the same `Sources` directory.

## Cost model

The estimator totals requested CPU and memory, finds the lowest monthly-cost D4s_v5, D8s_v5, or D16s_v5 shape that fits, then applies the selected region, reservation discount, and optional two-zone high-availability multiplier. The baseline compares that recommendation with a D16s_v5 footprint. VM rates are illustrative demo values; connect a cloud price catalog before using this for purchasing or billing decisions.

The page uses sample service breakdown and environment rows to make the dashboard feel complete without requiring cloud credentials. The optimization controls and totals use the shared deterministic model.

## Video

Watch the [30-second vertical reel](docs/video/mnemosyne-demo-reel-30s.mp4). It includes a custom synthesized instrumental score with no third-party samples or music-library track; see the [music license note](docs/video/reel-music-license.txt). The [reel narration](docs/video/reel-narration.md) and [storyboard](docs/video/reel-storyboard.md) are included too.

The [full 30-minute walkthrough](docs/video/mnemosyne-demo-30-minute-walkthrough.mp4), [chapter guide](docs/video/storyboard.md), and [full transcript](docs/video/narration.md) are also available.
