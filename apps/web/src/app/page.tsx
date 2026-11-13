"use client";

import { useMemo, useState, type ReactNode } from "react";
import { optimize, type OptimizeInput } from "../../../../packages/domain/src";

type IconName = "grid" | "layers" | "spark" | "chart" | "settings" | "search" | "bell" | "chevron" | "arrow" | "download" | "cloud" | "server" | "check" | "plus" | "clock" | "external";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1A7 7 0 0 1 7.5 13l-1.8-.5v-2.8l1.8-.4a8 8 0 0 1 .8-1.6L7.4 6.2l1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 .8 1.6l1.8.4v2.8l-1.8.5a8 8 0 0 1-1.8 2.8Z" transform="translate(-1 1) scale(.92)"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 17v4h14v-4"/></>,
    cloud: <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18H7Z"/>,
    server: <><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 8h6M11 17h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const defaults: OptimizeInput = { containers: 48, avgCpu: 1.5, avgMemory: 3, region: "eastus", reserved: true, highAvailability: false };
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
type TraceNodeView = { id: number; kind: string; label: string; scope: string; value: unknown; inputs: number[]; loc?: { file: string; line: number; column: number } };
type OptimizationTraceView = { nodeCount: number; behaviorPreserved: boolean; nodes: TraceNodeView[]; diagram: string };

export default function Home() {
  const [input, setInput] = useState(defaults);
  const [activeNav, setActiveNav] = useState("Overview");
  const [period, setPeriod] = useState("Last 30 days");
  const [notice, setNotice] = useState("");
  const [trace, setTrace] = useState<OptimizationTraceView | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceBusy, setTraceBusy] = useState(false);
  const result = useMemo(() => optimize(input), [input]);
  const savings = result.monthlyCost - result.optimizedCost;
  const update = <K extends keyof OptimizeInput>(key: K, value: OptimizeInput[K]) => {
    setTrace(null);
    setInput((current) => ({ ...current, [key]: value }));
  };
  const runOptimization = async () => {
    setTraceBusy(true);
    setTrace(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The optimization request failed.");
      setTrace(payload.provenance as OptimizationTraceView);
      setTraceOpen(true);
      setNotice(`Run ${payload.runId} traced and saved through Prisma.`);
      setTimeout(() => setNotice(""), 4500);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The optimizer service could not be reached.");
    } finally {
      setTraceBusy(false);
    }
  };
  const exportReport = () => {
    const rows = [["Metric", "Value"], ["Workloads", input.containers], ["Recommended VM", result.sku], ["Estimated nodes", result.nodes], ["Current monthly estimate", result.monthlyCost], ["Optimized monthly estimate", result.optimizedCost], ["Monthly savings", savings]];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "mnemosyne-cost-report.csv"; link.click(); URL.revokeObjectURL(link.href);
    setNotice("Your cost report has been downloaded."); setTimeout(() => setNotice(""), 3500);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Mnemosyne home"><span className="brand-mark"><span/><span/><span/><span/></span><span>mnemosyne<span className="brand-dot">.</span></span></a>
        <div className="workspace-switch"><div className="workspace-icon">A</div><div className="workspace-copy"><span>WORKSPACE</span><strong>Acme Cloud <Icon name="chevron" size={14}/></strong></div><span className="workspace-menu">···</span></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {[ ["Overview", "grid"], ["Environments", "layers"], ["Recommendations", "spark", "4"], ["Cost explorer", "chart"] ].map(([label, icon, badge]) => <button key={label} className={`nav-item ${activeNav === label ? "selected" : ""}`} onClick={() => { setActiveNav(label!); const target = label === "Environments" ? ".environment-panel" : label === "Recommendations" ? ".recommendations-panel" : label === "Cost explorer" ? ".spend-panel" : "#overview"; document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Icon name={icon as IconName}/><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}</button>)}
        </nav>
        <div className="nav-label nav-label-lower">MANAGE</div>
        <nav className="main-nav" aria-label="Management"><button className={`nav-item ${activeNav === "Settings" ? "selected" : ""}`} onClick={() => { setActiveNav("Settings"); setNotice("Workspace settings are not connected in this demo."); }}><Icon name="settings"/><span>Settings</span></button></nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-glyph"><Icon name="spark" size={17}/></div><strong>Need a hand?</strong><p>Our cloud experts are one message away.</p><button onClick={() => setNotice("A cloud specialist will be with you shortly.")}>Talk to an expert <Icon name="arrow" size={14}/></button></div><div className="profile"><div className="avatar">JD</div><div className="profile-info"><strong>Jordan Davis</strong><span>jordan@acme.io</span></div><span className="profile-more">···</span></div></div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search" onClick={() => setNotice("Search is ready. Try filtering your environments.")}><Icon name="search"/></button><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice("You’re all caught up.")}><Icon name="bell"/><i/></button><span className="top-divider"/><div className="date-picker"><Icon name="clock" size={15}/><select aria-label="Time period" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 30 days</option><option>Last 7 days</option><option>This quarter</option></select><Icon name="chevron" size={14}/></div></div></header>

        <div className="content-wrap">
          <section className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> CLOUD COST INTELLIGENCE</div><h1>Good morning, Jordan <span className="wave">✳</span></h1><p>Here’s what’s happening across your cloud environment.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={exportReport}><Icon name="download" size={16}/> Export report</button>{trace && <button className="button button-secondary" onClick={() => setTraceOpen(true)}>Provenance · {trace.nodeCount}</button>}<button className="button button-primary" onClick={runOptimization} disabled={traceBusy}><Icon name="spark" size={16}/> {traceBusy ? "Tracing…" : "Run optimization"}</button></div></section>

          <section className="metric-grid" aria-label="Cloud cost summary">
            <article className="metric-card"><div className="metric-top"><span>MONTHLY SPEND</span><span className="metric-icon icon-violet"><Icon name="cloud" size={17}/></span></div><div className="metric-value">{money(result.monthlyCost)}<span className="metric-trend negative">↗ 8.2%</span></div><div className="metric-foot"><span>vs. previous month</span><span className="sparkline spark-spend"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
            <article className="metric-card"><div className="metric-top"><span>IDENTIFIED SAVINGS</span><span className="metric-icon icon-green"><Icon name="spark" size={17}/></span></div><div className="metric-value">{money(savings)}<span className="metric-trend positive">↓ {result.savingsPercent}%</span></div><div className="metric-foot"><span>potential monthly reduction</span><span className="sparkline spark-save"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
            <article className="metric-card"><div className="metric-top"><span>ACTIVE WORKLOADS</span><span className="metric-icon icon-blue"><Icon name="layers" size={17}/></span></div><div className="metric-value">{input.containers}<span className="metric-unit">containers</span></div><div className="metric-foot"><span className="status-good"><i/> All systems healthy</span><span className="metric-muted">across 3 environments</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>OPTIMIZATION SCORE</span><span className="metric-icon icon-amber"><Icon name="chart" size={17}/></span></div><div className="metric-value">87<span className="score-total">/100</span><span className="score-pill">Great</span></div><div className="metric-foot"><span>Top 15% of teams</span><span className="metric-muted">↑ 6 pts this month</span></div></article>
          </section>

          <section className="dashboard-grid">
            <article className="panel spend-panel"><div className="panel-heading"><div><h2>Spend overview</h2><p>Track your cloud costs over time</p></div><button className="select-button" onClick={() => setPeriod(period === "Last 30 days" ? "Last 7 days" : "Last 30 days")}>{period}<Icon name="chevron" size={14}/></button></div><div className="chart-summary"><strong>{money(result.monthlyCost)}</strong><span className="chart-summary-note">projected this month <em>↗ 8.2%</em></span></div><div className="chart-wrap"><div className="y-labels"><span>$8k</span><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span></div><div className="chart-area"><div className="chart-gridlines"><i/><i/><i/><i/><i/></div><svg className="spend-chart" viewBox="0 0 720 220" preserveAspectRatio="none" role="img" aria-label="Cloud spend rising gradually over the last month"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8472f6" stopOpacity=".2"/><stop offset="100%" stopColor="#8472f6" stopOpacity="0"/></linearGradient></defs><path d="M0 171 C28 158 40 164 64 150 S103 162 126 139 S164 147 188 126 S220 141 246 115 S283 131 305 107 S342 121 370 99 S401 111 428 91 S459 106 486 74 S521 89 546 72 S579 79 603 49 S641 64 667 39 S696 43 720 18 L720 220 L0 220Z" fill="url(#chartFill)"/><path d="M0 171 C28 158 40 164 64 150 S103 162 126 139 S164 147 188 126 S220 141 246 115 S283 131 305 107 S342 121 370 99 S401 111 428 91 S459 106 486 74 S521 89 546 72 S579 79 603 49 S641 64 667 39 S696 43 720 18" fill="none" stroke="#7564e9" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round"/><circle cx="720" cy="18" r="5" fill="#fff" stroke="#7564e9" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div className="x-labels"><span>Oct 13</span><span>Oct 18</span><span>Oct 23</span><span>Oct 28</span><span>Nov 2</span><span>Nov 7</span><span>Nov 11</span></div></div></div><div className="chart-legend"><span><i className="legend-dot actual"/>Actual spend</span><span><i className="legend-dot forecast"/>Forecast</span><span className="forecast-label">Forecast based on the last 30 days</span></div></article>

            <article className="panel breakdown-panel"><div className="panel-heading"><div><h2>Spend by service</h2><p>Where your budget goes</p></div><button className="more-button" aria-label="More options" onClick={() => setNotice("Service breakdown is up to date.")}>···</button></div><div className="donut-row"><div className="donut-chart"><div className="donut-center"><strong>100%</strong><span>of spend</span></div></div><div className="service-legend"><div><i className="service-color compute"/><span>Compute</span><b>54%</b></div><div><i className="service-color database"/><span>Database</span><b>24%</b></div><div><i className="service-color storage"/><span>Storage</span><b>14%</b></div><div><i className="service-color network"/><span>Network</span><b>8%</b></div></div></div><div className="breakdown-total"><span>Total spend</span><strong>{money(result.monthlyCost)}</strong></div></article>

            <article className="panel recommendations-panel"><div className="panel-heading"><div><h2>Quick wins</h2><p>Recommendations ready for you</p></div><button className="text-link" onClick={() => setActiveNav("Recommendations")}>View all <Icon name="arrow" size={14}/></button></div><div className="recommendation-item"><div className="rec-icon rec-icon-purple"><Icon name="server" size={18}/></div><div className="rec-copy"><div><strong>Right-size 6 workloads</strong><span className="rec-tag tag-easy">EASY</span></div><p>Lower CPU utilization in production</p></div><div className="rec-saving"><b>$1,240</b><span>/ month</span></div><button className="row-arrow" aria-label="View right-sizing recommendation" onClick={() => setActiveNav("Recommendations")}><Icon name="arrow" size={16}/></button></div><div className="recommendation-item"><div className="rec-icon rec-icon-blue"><Icon name="cloud" size={18}/></div><div className="rec-copy"><div><strong>Commit to reserved capacity</strong><span className="rec-tag tag-good">HIGH IMPACT</span></div><p>Save with a 1-year compute commitment</p></div><div className="rec-saving"><b>$860</b><span>/ month</span></div><button className="row-arrow" aria-label="View reservation recommendation" onClick={() => setActiveNav("Recommendations")}><Icon name="arrow" size={16}/></button></div><button className="all-recs" onClick={() => setActiveNav("Recommendations")}><span><Icon name="spark" size={15}/> 4 recommendations can save you <b>$3,680/mo</b></span><Icon name="arrow" size={15}/></button></article>

            <article className="panel optimizer-panel"><div className="panel-heading"><div><h2>Cost optimizer</h2><p>Model an optimized cloud footprint</p></div><span className="optimizer-badge"><i/> LIVE</span></div><div className="optimizer-controls"><label className="control-label" htmlFor="containers">Workload size <span>{input.containers} containers</span></label><input id="containers" className="range-input" type="range" min="8" max="160" step="8" value={input.containers} onChange={(event) => update("containers", Number(event.target.value))}/><div className="range-ends"><span>8</span><span>160</span></div><div className="control-pair"><label>CPU / container<select value={input.avgCpu} onChange={(event) => update("avgCpu", Number(event.target.value))}><option value="0.5">0.5 vCPU</option><option value="1">1 vCPU</option><option value="1.5">1.5 vCPU</option><option value="2">2 vCPU</option><option value="4">4 vCPU</option></select></label><label>Memory<select value={input.avgMemory} onChange={(event) => update("avgMemory", Number(event.target.value))}><option value="1">1 GB</option><option value="2">2 GB</option><option value="3">3 GB</option><option value="4">4 GB</option><option value="8">8 GB</option></select></label></div><label className="control-label region-label" htmlFor="region">Cloud region</label><select id="region" className="region-select" value={input.region} onChange={(event) => update("region", event.target.value)}><option value="eastus">East US</option><option value="westus">West US</option><option value="centralus">Central US</option></select><div className="toggle-row"><span><strong>Reserved instances</strong><small>Save up to 18% with a 1-year term</small></span><button role="switch" aria-checked={input.reserved} aria-label="Reserved instances" className={`switch ${input.reserved ? "on" : ""}`} onClick={() => update("reserved", !input.reserved)}><i/></button></div><div className="toggle-row"><span><strong>High availability</strong><small>Multi-zone redundancy</small></span><button role="switch" aria-checked={input.highAvailability} aria-label="High availability" className={`switch ${input.highAvailability ? "on" : ""}`} onClick={() => update("highAvailability", !input.highAvailability)}><i/></button></div></div><div className="optimizer-result"><div><span>ESTIMATED MONTHLY COST</span><strong>{money(result.optimizedCost)}<small> / mo</small></strong></div><span className="result-save"><Icon name="check" size={13}/> Save {money(savings)}</span></div><button className="button button-primary optimizer-cta" onClick={runOptimization} disabled={traceBusy}><span>{traceBusy ? "Tracing optimizer…" : "Trace & save run"}</span><Icon name="arrow" size={16}/></button><p className="optimizer-footnote">Estimate uses {result.sku} · {result.nodes} node{result.nodes === 1 ? "" : "s"} · Prices are illustrative</p></article>

            <article className="panel environment-panel"><div className="panel-heading"><div><h2>Environments</h2><p>Cost and health at a glance</p></div><button className="text-link" onClick={() => setActiveNav("Environments")}>All environments <Icon name="arrow" size={14}/></button></div><div className="environment-table"><div className="table-head"><span>ENVIRONMENT</span><span>STATUS</span><span>MONTHLY COST</span><span>CHANGE</span></div><div className="environment-row"><div className="env-name"><span className="env-marker production"><Icon name="cloud" size={16}/></span><span><strong>Production</strong><small>East US · 24 workloads</small></span></div><span className="env-status"><i/>Healthy</span><strong className="env-cost">{money(result.monthlyCost * .64)}</strong><span className="env-change up">↗ 12.4%</span></div><div className="environment-row"><div className="env-name"><span className="env-marker staging"><Icon name="layers" size={16}/></span><span><strong>Staging</strong><small>East US · 16 workloads</small></span></div><span className="env-status"><i/>Healthy</span><strong className="env-cost">{money(result.monthlyCost * .24)}</strong><span className="env-change down">↓ 3.1%</span></div><div className="environment-row"><div className="env-name"><span className="env-marker development"><Icon name="server" size={16}/></span><span><strong>Development</strong><small>West US · 8 workloads</small></span></div><span className="env-status"><i/>Healthy</span><strong className="env-cost">{money(result.monthlyCost * .12)}</strong><span className="env-change up">↗ 1.8%</span></div></div></article>
          </section>
          <footer className="page-footer"><span>© 2025 Mnemosyne Cloud</span><span><i/> All systems operational</span><a href="#overview" onClick={(event) => { event.preventDefault(); setNotice("Documentation is coming soon."); }}>Documentation <Icon name="external" size={13}/></a></footer>
        </div>
      </main>
      {traceOpen && trace && <div className="trace-overlay" role="presentation" onClick={() => setTraceOpen(false)}><section className="trace-modal" role="dialog" aria-modal="true" aria-labelledby="trace-title" onClick={(event) => event.stopPropagation()}><header className="trace-modal-heading"><div><div className="eyebrow"><span className="live-dot"/> MNEMOSYNE EXECUTION TRACE</div><h2 id="trace-title">Why did this optimizer choose this result?</h2><p>{trace.nodeCount} recorded nodes · actual optimizer source · saved with this run</p></div><button className="trace-close" aria-label="Close trace" onClick={() => setTraceOpen(false)}>×</button></header><div className="trace-proof"><span className="trace-proof-icon"><Icon name="check" size={15}/></span><span><strong>Behavior preserved</strong><small>Plain and instrumented executions returned the same output.</small></span><span className="trace-proof-count">{trace.nodeCount} nodes</span></div><div className="trace-body"><div className="trace-node-list"><div className="trace-section-title"><strong>Observed steps</strong><span>Inputs flow into named calculations and outputs</span></div>{trace.nodes.map((node) => <div className="trace-node" key={node.id}><span className={`trace-kind kind-${node.kind}`}>{node.kind}</span><div className="trace-node-main"><strong>{node.label}</strong><small>{node.scope}{node.loc ? ` · ${node.loc.file.split(/[\\/]/).slice(-2).join("/")}:${node.loc.line}` : ""} · inputs {node.inputs.length ? node.inputs.map((id) => `#${id}`).join(", ") : "none"}</small></div><code>{typeof node.value === "object" ? JSON.stringify(node.value) : String(node.value)}</code></div>)}</div><details className="trace-diagram"><summary>View full provenance graph</summary><pre>{trace.diagram}</pre></details></div><footer className="trace-modal-footer"><span>Run recorded in the local Prisma database.</span><button className="button button-primary" onClick={() => setTraceOpen(false)}>Done</button></footer></section></div>}
      {notice && <div className="toast" role="status"><span><Icon name="check" size={16}/></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
    </div>
  );
}
