import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '').replaceAll('%20', ' '));
const audioDir = path.join(root, 'work', 'audio');
const imageDir = path.join(root, 'work', 'slides');
await fs.mkdir(imageDir, { recursive: true });
const chapters = JSON.parse(await fs.readFile(path.join(audioDir, 'manifest.json'), 'utf8'));

const content = [
  { heading: ['A decision,', 'with a trail.'], kicker: 'CLOUD COST INTELLIGENCE', sub: 'A guided tour of the Mnemosyne demo', points: ['Explore a workload estimate', 'Trace the real calculation', 'Save and reopen its provenance'], diagram: ['DASHBOARD', 'OPTIMIZER', 'MNEMOSYNE', 'PRISMA'] },
  { heading: ['One workspace,', 'many signals.'], kicker: 'DASHBOARD TOUR', sub: 'A quick estimate lives beside the controls that shape it.', points: ['Spend and savings update with the scenario', 'Recommendations and environments add context', 'A run saves a trace; export creates a CSV'], diagram: ['Monthly spend', 'Potential savings', '48 workloads', 'Optimization score'] },
  { heading: ['Fit both', 'dimensions.'], kicker: 'THE COST MODEL', sub: 'Sizing is driven by aggregate CPU and memory requests.', points: ['Round required resources up', 'Check every VM against CPU and memory', 'Compare regional and reservation-adjusted costs'], diagram: ['48 containers', '72 CPU units', '144 GB memory', 'Lowest fitting cost'] },
  { heading: ['Capacity moves', 'in steps.'], kicker: 'SCENARIO EXPLORATION', sub: 'A small workload change can cross a node threshold.', points: ['CPU can bind before memory', 'Memory can bind before CPU', 'High availability doubles this demo’s node count'], diagram: ['Requests', 'Capacity check', 'Node threshold', 'Monthly estimate'] },
  { heading: ['The request', 'enters once.'], kicker: 'HTTP API', sub: 'The service validates the scenario before running the shared model.', points: ['Six settings arrive as JSON', 'Schema validation rejects unsupported values', 'The traced entry imports the real optimizer'], diagram: ['Browser', 'Validated request', 'Domain optimizer', 'Trace response'] },
  { heading: ['Observe without', 'changing behavior.'], kicker: 'MNEMOSYNE CHECK', sub: 'Ordinary and instrumented output are compared for this run.', points: ['Instrument the executed calculation', 'Capture values and dependency links', 'Stop if the output comparison fails'], diagram: ['Plain execution', 'Instrumented execution', 'Compare output', 'Preserved?'] },
  { heading: ['Follow the values', 'to the answer.'], kicker: 'READ THE PROVENANCE', sub: 'Start from the result, then follow its dependencies backward.', points: ['Confirm submitted inputs', 'Inspect resource totals and candidate costs', 'Use labels and source locations to narrow the search'], diagram: ['Inputs', 'Sizing totals', 'Candidate costs', 'Recommendation'] },
  { heading: ['A trace that', 'survives the request.'], kicker: 'PRISMA + SQLITE', sub: 'The result and its provenance are saved together.', points: ['Store the scenario and recommendation', 'Persist the serialized graph and trace rows', 'Retrieve a saved trace by run identifier'], diagram: ['OptimizationRun', 'CostTrace rows', 'SQLite file', 'Trace retrieval'] },
  { heading: ['Turn a report', 'into a repro.'], kicker: 'ISSUE WALKTHROUGH', sub: 'A saved scenario makes a surprising number easier to investigate.', points: ['Re-run the exact settings', 'Check the inputs and intermediate costs', 'Compare the trace with an expected scenario'], diagram: ['Reported result', 'Saved run ID', 'Trace dependencies', 'Root cause'] },
  { heading: ['Clear seams', 'help debugging.'], kicker: 'WORKSPACE LAYOUT', sub: 'Each package owns a distinct part of the request path.', points: ['Domain: sizing and candidate selection', 'Tracing: instrumentation and diagram', 'Database and API: persistence and retrieval'], diagram: ['Web app', 'API + GraphQL', 'Domain + tracing', 'Prisma + SQLite'] },
  { heading: ['Know what the', 'estimate assumes.'], kicker: 'LIMITS + NEXT STEPS', sub: 'The numbers are transparent demo values, not a provider quote.', points: ['Static illustrative prices', 'No live cluster telemetry or cloud account', 'Add catalog timestamps, redaction, and retention for production'], diagram: ['Demo assumptions', 'Authoritative pricing', 'Workload evidence', 'Auditable decision'] },
  { heading: ['Inputs in.', 'Decisions traced.'], kicker: 'RECAP', sub: 'A recommendation is easier to investigate when its path is saved.', points: ['One shared optimizer', 'A behavior-preserving trace check', 'A durable Prisma record'], diagram: ['Explore', 'Run', 'Trace', 'Retrieve'] },
];

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size, color, weight = 400, extra = '') => `<text x="${x}" y="${y}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${esc(value)}</text>`;
const rect = (x, y, w, h, fill, stroke = 'none', r = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;

function shell({ number, heading, kicker, sub, points, diagram, footer = 'MNEMOSYNE  /  COST OPTIMIZER DEMO' }) {
  const diagramMarkup = diagram.map((label, i) => {
    const y = 190 + i * 94;
    const active = i === diagram.length - 1;
    const fill = active ? '#242242' : '#151a2b';
    const stroke = active ? '#7b6cf5' : '#293044';
    const mark = ['#9b8cff', '#70d7bd', '#67b4f3', '#ffbd71'][i % 4];
    return `${rect(746, y, 425, 66, fill, stroke, 12)}<circle cx="779" cy="${y + 33}" r="12" fill="${mark}" opacity=".95"/>${text(808, y + 39, label, 20, '#e9ecf5', 600)}${i < diagram.length - 1 ? `<path d="M779 ${y + 54}v28" stroke="#4e5872" stroke-width="2" stroke-dasharray="4 6"/>` : ''}`;
  }).join('');
  const bulletMarkup = points.map((point, i) => `<circle cx="102" cy="${421 + i * 56}" r="5" fill="${i === 0 ? '#a394ff' : '#75d8bf'}"/>${text(123, 428 + i * 56, point, 18, '#d6dbea', 400)}`).join('');
  const titleMarkup = heading.map((line, i) => text(88, 200 + 72 * i, line, 57, i === 0 ? '#fbfbff' : '#aa9dff', 700, 'letter-spacing="-1.3"')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0d1220"/><stop offset="1" stop-color="#17162a"/></linearGradient><radialGradient id="glow"><stop stop-color="#5140a1" stop-opacity=".34"/><stop offset="1" stop-color="#5140a1" stop-opacity="0"/></radialGradient></defs>
    <rect width="1280" height="720" fill="url(#bg)"/><ellipse cx="1070" cy="-40" rx="560" ry="420" fill="url(#glow)"/>
    <path d="M0 620C240 575 360 710 640 662S1050 600 1280 650" fill="none" stroke="#282747" stroke-width="1" opacity=".7"/>
    ${rect(64, 42, 42, 42, '#26213f', '#4b417a', 12)}<path d="M76 64l9-9 9 9-9 9z" fill="none" stroke="#b6aaff" stroke-width="2"/><circle cx="85" cy="64" r="3" fill="#71d7be"/>
    ${text(120, 70, 'mnemosyne', 20, '#ebe9fa', 650)}${text(233, 70, '.', 23, '#a99bff', 700)}
    ${text(88, 133, kicker, 12, '#8f93ab', 700, 'letter-spacing="2.1"')}${titleMarkup}
    ${text(91, 348, sub, 18, '#aab2c5', 400)}${bulletMarkup}
    ${rect(712, 108, 492, 490, '#101625', '#2c3248', 20)}
    ${text(746, 153, 'DECISION PATH', 11, '#828aa3', 700, 'letter-spacing="1.8"')}${diagramMarkup}
    <line x1="64" y1="648" x2="1216" y2="648" stroke="#303147"/>
    ${text(68, 682, footer, 11, '#83889e', 600, 'letter-spacing="1.1"')}${text(1110, 682, `${String(number).padStart(2, '0')} / 12`, 11, '#a49bbf', 600, 'letter-spacing="1"')}
  </svg>`;
  return Buffer.from(svg);
}

const titleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101526"/><stop offset="1" stop-color="#18142c"/></linearGradient><radialGradient id="glow"><stop stop-color="#5545ad" stop-opacity=".55"/><stop offset="1" stop-color="#5545ad" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#bg)"/><ellipse cx="910" cy="320" rx="570" ry="440" fill="url(#glow)"/><g fill="none" stroke="#8f82e9" opacity=".72"><path d="M740 250L900 170 1060 245 1015 410 835 450 740 250Z"/><path d="M740 250L1015 410M900 170L835 450M1060 245L835 450"/></g><g fill="#72d9c1"><circle cx="740" cy="250" r="8"/><circle cx="900" cy="170" r="8"/><circle cx="1060" cy="245" r="8"/><circle cx="1015" cy="410" r="8"/><circle cx="835" cy="450" r="8"/></g><rect x="88" y="90" width="54" height="54" rx="15" fill="#30274d" stroke="#5f508a"/><path d="M101 117l14-14 14 14-14 14z" fill="none" stroke="#b6aaff" stroke-width="2.5"/><circle cx="115" cy="117" r="4" fill="#72d9c1"/><text x="160" y="125" font-family="Arial" font-size="27" fill="#f5f2ff" font-weight="600">mnemosyne</text><text x="88" y="275" font-family="Arial" font-size="18" fill="#9fa4ba" font-weight="700" letter-spacing="3">CLOUD COST INTELLIGENCE</text><text x="82" y="375" font-family="Arial" font-size="72" fill="#fff" font-weight="700" letter-spacing="-2">A decision,</text><text x="82" y="460" font-family="Arial" font-size="72" fill="#aa9cff" font-weight="700" letter-spacing="-2">with a trail.</text><text x="90" y="526" font-family="Arial" font-size="22" fill="#bac1d3">A 30-minute guided walkthrough</text><text x="90" y="653" font-family="Arial" font-size="13" fill="#858ba2" letter-spacing="2">OPTIMIZER  ·  MNEMOSYNE PROVENANCE  ·  PRISMA</text></svg>`;

function pauseSlide(number, prompt) {
  const words = (prompt || 'Pause and explore the dashboard controls.').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 46) { lines.push(line); line = word; } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  const body = lines.map((x, i) => `<text x="640" y="${330 + i * 46}" font-family="Arial" font-size="30" fill="#eef0f7" text-anchor="middle">${esc(x)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="bg"><stop stop-color="#101526"/><stop offset="1" stop-color="#1a1730"/></linearGradient></defs><rect width="1280" height="720" fill="url(#bg)"/><circle cx="640" cy="186" r="35" fill="#2e2950"/><path d="M634 166v23l19 11" fill="none" stroke="#b7aaff" stroke-width="4" stroke-linecap="round"/><text x="640" y="266" font-family="Arial" font-size="14" fill="#99a0b7" font-weight="700" letter-spacing="3" text-anchor="middle">PAUSE AND TRY</text>${body}<text x="640" y="630" font-family="Arial" font-size="14" fill="#8d91a6" text-anchor="middle">THE WALKTHROUGH WILL CONTINUE IN A MOMENT</text></svg>`);
}

async function save(name, svg) {
  const input = typeof svg === 'string' ? Buffer.from(svg) : svg;
  await sharp(input).png({ compressionLevel: 9 }).toFile(path.join(imageDir, name));
}

await save('intro.png', titleSvg);
for (let i = 0; i < chapters.length; i++) {
  const chapter = chapters[i];
  const slide = content[i];
  await save(`chapter-${String(i + 1).padStart(2, '0')}.png`, shell({ number: i + 1, ...slide }));
  if (chapter.pause > 0) await save(`pause-${String(i + 1).padStart(2, '0')}.png`, pauseSlide(i + 1, chapter.pauseText));
}
await save('outro.png', shell({ number: 12, heading: ['Inputs in.', 'Decisions traced.'], kicker: 'THANK YOU FOR WATCHING', sub: 'Explore the dashboard. Run a scenario. Open its saved trace.', points: ['One shared optimizer', 'A behavior-preserving trace check', 'A durable Prisma record'], diagram: ['Explore', 'Run', 'Trace', 'Retrieve'], footer: 'MNEMOSYNE  /  CLOUD COST INTELLIGENCE' }));
console.log(`Rendered ${chapters.length + 2 + chapters.filter((c) => c.pause > 0).length} visual cards.`);
