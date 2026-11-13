# Mnemosyne Cloud Cost Demo — 30-minute guided walkthrough

**Format:** narrated product walkthrough with short guided pause cards. The pause cards add time for viewers to inspect the dashboard and try the controls; they are included in the 30-minute runtime.

## 00:00 — Welcome and what you will see

Welcome to this guided tour of the Mnemosyne cloud cost demo. Over the next half hour, we will follow one optimization request from the dashboard, through the cost model and Mnemosyne tracing, into Prisma storage, and back to the provenance view. We will also look at what the demonstration does not claim, so that the numbers and trace are interpreted correctly.

The project is a compact TypeScript workspace. It has a Next.js web application, a shared domain package that estimates resource needs and compares virtual machine options, an HTTP API, a GraphQL service, a database package built with Prisma, and a tracing package that calls Mnemosyne. Each piece has a distinct role, but the story is easiest to understand by following one request end to end.

The dashboard presents a familiar cloud cost workspace: a monthly spend summary, potential savings, active workloads, recommendations, environments, and an optimizer panel. The controls let us change the workload, region, reservation choice, and availability setting. When we ask the application to run an optimization, the API does more than return a number. It runs the actual optimizer with Mnemosyne instrumentation, checks that instrumentation did not change the result, and persists the decision alongside its provenance.

As we go, keep three questions in mind. What inputs drove the recommendation? Which calculations produced it? And can we retrieve the same explanation after the request has finished? Those questions connect the user interface, the code, the trace, and the database.

## 02:00 — Tour of the dashboard

Start at the overview page. The top row is a quick summary, not a billing statement. Monthly spend and identified savings are calculated from the current demo scenario. Active workloads reflects the number of containers in that scenario. The optimization score and several trend indicators are sample presentation data, included to make the workspace feel like a cloud cost dashboard.

Below the summary is a spend overview, a service breakdown, recommendations, and an environment table. These panels provide useful product context, but the central interactive element for this walkthrough is the optimizer. Its workload count, average CPU, average memory, region, reservation setting, and high availability setting feed the deterministic model in the shared domain package.

The default scenario uses forty-eight containers, one and a half CPU units per container, three gigabytes of memory per container, the East US region, a reservation discount, and no high availability multiplier. Changing a field updates the estimate on the page immediately. That fast preview is useful for exploring. It is separate from a saved run: the saved, traced operation happens when we press the run optimization button.

There is also an export report action. It builds a small CSV from the current scenario and its estimate. That report is separate from provenance. The report communicates the result; the trace records how the code arrived at it. We will inspect the trace after we send a real request to the API.

**Guided pause — 00:30.** Take a moment to find the workload controls, the region selector, the reservation switch, and the high availability switch. Notice which totals update before any run has been saved.

## 04:00 — The cost model and its assumptions

The domain model begins by normalizing the inputs. It rounds container count to an integer and clamps it to the supported range. CPU and memory requests are also bounded. If the region name is not one of the modeled regions, the model falls back to East US. This kind of input handling keeps the demo predictable, though a production service would normally make its accepted values and defaulting behavior visible in validation and logging.

The sizing function multiplies container count by average CPU and average memory, then rounds each total upward. In our default case, forty-eight workloads at one point five CPU each request seventy-two CPU units. At three gigabytes each, they request one hundred forty-four gigabytes of memory. These are aggregate requested resources for the demonstration; they are not live measurements from a cluster.

The model compares three illustrative machine sizes: D4s v5, D8s v5, and D16s v5. Each has a CPU and memory capacity and a monthly demo price. For each candidate, it determines the number of machines required by CPU and by memory, then uses the larger count. This is important: a shape has to fit both dimensions. A CPU-only comparison could recommend a machine that runs out of memory, while a memory-only comparison could waste CPU capacity.

The current baseline uses D16 machines. The optimizer sorts candidate totals by cost, then uses the least expensive fitting candidate. A reservation multiplies the recommended cost by a demo discount of eighteen percent. High availability doubles node counts, representing two zones in this simplified example. Region multipliers change the modeled price. These are transparent rules in source code, not a live price lookup or a cloud-provider quote.

## 06:30 — Explore a scenario

Let us reason through a scenario before saving it. If we increase the number of containers while keeping average requests steady, aggregate CPU and memory grow together. The required node count may stay flat for a while, then step upward when capacity is crossed. This creates a staircase: a small change in workload may have no effect at first, while crossing a threshold can add a full machine.

Now consider a different case. Increase average memory while holding CPU constant. A candidate with enough processors may still fail the memory requirement. The model calculates the node count implied by each resource separately and keeps the larger one. That lets us see which constraint is binding. In a real capacity planner, we might also account for utilization, overhead, autoscaling policy, system pods, storage, network limits, and failure headroom. This demo intentionally keeps the calculation small enough to explain on screen.

Switching on high availability doubles the node count for both the baseline and candidate. In this example that means the displayed comparison retains a two-zone footprint. It does not model a full reliability policy: there is no zone-specific capacity, failover simulation, or availability service-level calculation. Likewise, reservation is a price multiplier, not an eligibility or term analysis.

Try the controls in a few combinations. Watch the recommended virtual machine family, node estimate, monthly estimate, and savings respond. These changes are local previews. The next step will submit one chosen scenario to the service, attach a trace, and create a database record.

**Guided pause — 00:45.** Try a low workload, then a higher workload. Change memory independently from CPU. Turn on high availability and compare how the node counts move.

## 09:00 — Follow the request into the API

When we press Run optimization, the browser sends a JSON request to the HTTP API on port three thousand one. The payload contains the six model inputs: container count, average CPU, average memory, region, reservation, and high availability. The API validates the payload with a schema before doing any work. Invalid types, out-of-range workload counts, or missing boolean settings are rejected with a client error rather than passed blindly to the optimizer.

The route then calls the tracing package. This is the integration point with Mnemosyne. The API does not recreate a second copy of the cost calculation for the trace. Instead, the tracing package launches a small entry file that imports the real optimizer from the shared domain package. That entry file receives the submitted values, calls the same optimize function used for the dashboard preview, and prints its result.

Mnemosyne instruments that execution. Its Babel-based compilation observes the values and operations along the path through the optimizer and its local sizing and pricing modules. The trace is represented as nodes connected by input relationships. Depending on the run, nodes can describe inputs, bindings, operations, and returned values. Source locations help tie nodes back to code.

This is why Mnemosyne is useful for tracing issues here. Suppose a recommendation looks surprising. We can inspect the input values that were actually used, follow the resource totals, see which capacity and price values flowed into the candidates, and find the final result node. We are looking at a causal record from the executed calculation, rather than a hand-written explanation that might drift away from the implementation.

## 11:30 — How the trace checks behavior

Instrumentation should make execution observable without silently changing the result. The tracing helper uses Mnemosyne's run-once workflow, which compares the ordinary execution with the instrumented execution. It exposes whether their output matched. The API checks this flag and fails the operation if behavior was not preserved. The response and stored run mark that result for the interface.

This comparison is a focused safeguard. It says that the ordinary and traced versions produced matching captured output for this invocation. It is not a proof that the optimizer is correct for every possible workload. It does not validate the illustrative price table, certify a cloud bill, or establish that the recommendation meets a production service-level objective. Those require independent domain checks and authoritative source data.

The trace diagram is generated from the nodes collected during execution. This matters for maintainability. If the calculation changes and the trace remains connected to the actual functions, the provenance can evolve with the implementation. A separately maintained diagram would be easier to write at first, but it could become stale when developers add a branch or a new input.

In the user interface, the provenance panel gives two complementary ways to inspect the result. The node list is practical for following individual values and reading labels. The Mermaid diagram gives a compact view of the dependency graph. A node count provides a quick sense of trace size, while the behavior-preserved status reports the equality check. If the explanation feels too dense, begin at the input nodes and follow the links forward to the returned optimizer object.

**Guided pause — 00:45.** Before moving on, think of one result that could surprise a user. Identify which input or intermediate value you would inspect first in a provenance graph.

## 14:00 — Read the provenance from input to result

For a practical debugging walk-through, begin with the submitted workload values. Confirm that the trace reflects the same count, CPU request, memory request, region, reservation, and high availability choices visible in the dashboard. This catches a class of problems where the interface displays one state but sends another.

Next, follow the sizing values. The estimated CPU and estimated memory should correspond to the rounded-up aggregate requests. If one of those values is unexpectedly large, the question becomes specific: was the per-container request too high, was the workload count wrong, or did a unit conversion happen upstream? A trace does not automatically answer every semantic question, but it narrows where to look and preserves the values needed to reproduce the calculation.

Then inspect candidate selection. The chosen node count must accommodate both resource dimensions. The candidate monthly cost depends on the SKU price, region multiplier, and high availability multiplier. The reserved estimate applies the reservation factor after the candidate's on-demand cost is calculated. A surprising savings percentage can therefore be investigated as a comparison between baseline cost and optimized cost, rather than treated as a mysterious final number.

The graph should be read as data flow, not as a prose explanation. A connection means that an observed value fed another observed node. The labels and values provide context, and source locations can point you toward the corresponding implementation. When the graph gets large, search for final outputs first, then trace their dependencies backward. The goal is to identify the smallest set of inputs and calculations that explains the outcome.

This style of provenance is especially helpful when a defect appears only for one combination of settings. Save that scenario, open its trace, and compare its path with a nearby scenario that behaves as expected. Differences in the graph can show which branch or capacity threshold changed the result.

## 17:00 — Prisma persistence and retrieval

After the trace passes the behavior check, the API creates an optimization run through Prisma. The run row stores the submitted settings, the recommended SKU and node count, the baseline and optimized monthly costs, the savings percentage, and a serialized trace document. Related trace rows store step names, input values, output values, and a duration field. The current demonstration sets that duration field to zero; it should not be interpreted as a measured per-step performance profile.

The database package uses Prisma with SQLite for local development. A migration defines the optimization run and trace tables, and the Prisma client is generated from the schema. This gives the demo a durable record after the HTTP request has completed. If we later close and reopen the provenance panel, the trace can be fetched by run identifier instead of depending on the original in-memory response.

The API exposes a runs list and a route that retrieves the trace for one run. The web page presents the provenance returned by the optimization request, and the run identifier can be used to retrieve the saved trace again. This is the part that turns tracing from a transient debugging printout into an explanation attached to a decision record.

For production, storage choices would need more thought: retention policy, trace size, indexing, access control, redaction of sensitive data, and migration management. A production database might be PostgreSQL or another supported system. SQLite is intentionally convenient here because the demo can be run locally without provisioning a database server.

## 19:30 — Trace an issue, step by step

Imagine that someone reports that a reserved East US scenario saves less than expected. First, reproduce the exact inputs and run the optimization. Record the run identifier. This creates a stable handle for both the result and its trace.

Open the provenance panel and verify the reservation input. Then find the optimized cost and inspect its dependencies. Confirm that the candidate on-demand estimate includes the correct number of nodes, the selected SKU price, and the East US multiplier. Check the reservation operation and see whether the eighteen percent adjustment is applied once. Compare the result with the D16 baseline and calculate the displayed savings as the difference divided by the baseline.

If every intermediate value matches expectations, the likely issue may be in the expectation itself. Perhaps the price is illustrative, or the user assumed a different discount. If a value changes unexpectedly between input and candidate totals, the trace points to the code path that produced it. If the dashboard shows one value but the persisted run contains another, compare the request payload and stored inputs. That can distinguish a front-end state issue from a model issue.

For a robust incident report, include the scenario, run identifier, output, behavior-preserved status, and the relevant trace section. Keep an eye on privacy: real traces can contain customer data or secrets if the instrumented code handles them. This demo's inputs are simple numeric settings, but production tracing should define what values are safe to retain and who can view them.

**Guided pause — 01:00.** Choose a potential discrepancy, such as a node count or discount. Walk backward from the final number and list the two or three intermediate values you would verify.

## 22:30 — Other services and project layout

The HTTP API is the path used by the dashboard for traced optimization and persistence. A separate GraphQL service is included on port four thousand. It provides a compact interface for health, recommendations, and optimization queries. The web application itself can run on port three thousand. These processes can be started in separate terminals for local development after dependencies are installed and Prisma has been generated and migrated.

The workspace packages keep responsibilities visible. The domain package owns sizing, pricing, and recommendation logic. The tracing package owns the Mnemosyne entry point and diagram generation. The database package owns the Prisma schema and client. The contracts package provides shared request and response types. The API connects those pieces, while the web application presents them to a person.

That separation helps with issue tracing too. If an HTTP request fails validation, start in the API route. If the resource math is unexpected, inspect the domain package. If no trace is returned, inspect the tracing entry and instrumentation setup. If the UI cannot reopen a saved explanation, inspect the trace retrieval route and Prisma relation. Finding the right boundary is often half of debugging.

The local SQLite file is part of the development setup. Treat it as application data: keep a copy if you need to preserve demo runs, and remember that recreating the database can remove those records. Prisma migrations describe schema changes over time, while client generation keeps the application types in sync with the schema.

## 25:00 — Limits and next steps

This project is an explanatory demo, not a production cloud optimization product. Its prices are static example values. It uses aggregate requests rather than telemetry. Its recommendation covers three machine sizes and a simplified regional multiplier. Reservations and high availability are modeled as clear multipliers. Recommendations, trends, and several overview values are sample dashboard content. The service does not connect to a cloud account or read a provider price catalog.

Those limits are useful because they make the data flow easy to inspect. Before applying this pattern to real spending decisions, replace sample values with current provider prices and account for contract terms, taxes, discounts, storage, network, support, and workload-specific constraints. Add workload utilization and operational headroom. Validate recommendations against real deployment policies. Keep the provenance, because the more complex the model becomes, the more valuable an inspectable explanation will be.

The next engineering steps could include richer trace filtering, highlighting a selected result's ancestors, a side-by-side comparison of two saved runs, explicit trace retention settings, and tests for domain invariants. The trace could also carry a model version and price catalog timestamp, so an old decision can be interpreted against the assumptions that existed when it was made. For sensitive workloads, add redaction before any trace is persisted.

## 27:30 — Recap and closing

We followed a scenario from dashboard controls to a validated API request, through the real shared cost model, and into Mnemosyne instrumentation. Mnemosyne captured the inputs and calculation relationships, and the helper compared ordinary output with instrumented output. Prisma then saved the optimization result and trace data so the explanation could be retrieved after the request finished.

The central idea is simple: when a number influences a decision, preserve enough context to understand how it was produced. A final recommendation is useful. A recommendation connected to its inputs, calculations, source locations, behavior check, and saved run is much easier to investigate when something looks wrong.

Thank you for taking this guided tour. You can now explore the dashboard, change the workload settings, run an optimization, and open its provenance. Start with one question, follow the values that answer it, and use the saved run to make the investigation repeatable.

**Closing card — 00:30.** Mnemosyne Cloud Cost Demo. Inputs in. Decisions traced. Results saved.
