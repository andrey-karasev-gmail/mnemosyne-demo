import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '').replaceAll('%20', ' '));
const ffmpeg = process.env.FFMPEG_BIN || path.resolve(here, '..', '..', '.video-tools', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const work = path.join(here, 'reel-work');
const slides = path.join(work, 'slides');
const voice = path.join(here, 'reel-voice.wav');
const music = path.join(here, 'reel-original-music.wav');
const output = path.join(here, 'mnemosyne-demo-reel-30s.mp4');
await fs.mkdir(slides, { recursive: true });

const cards = [
  { tag: 'THE QUESTION', big: ['Why this', 'result?'], sub: 'Cloud cost needs more than a number.', detail: ['$3,100 / month', '22.5% estimated savings'], type: 'result' },
  { tag: 'THE MODEL', big: ['Fit CPU', '+ memory'], sub: 'The optimizer sizes both resources.', detail: ['48 workloads', '72 CPU  ·  144 GB memory'], type: 'resources' },
  { tag: 'THE TRACE', big: ['Trace the', 'real calculation'], sub: 'Mnemosyne follows the actual optimizer.', detail: ['Inputs  →  Sizing  →  Candidate  →  Result'], type: 'trace' },
  { tag: 'THE CHECK', big: ['Same answer,', 'with a trace'], sub: 'Ordinary and instrumented output are compared.', detail: ['Plain run     $3,100', 'Traced run    $3,100     ✓'], type: 'compare' },
  { tag: 'THE RECORD', big: ['Save the run', 'with Prisma'], sub: 'Keep the result connected to its provenance.', detail: ['Optimization run', 'Trace graph', 'SQLite record'], type: 'record' },
  { tag: 'MNEMOSYNE', big: ['Follow inputs', 'back to the why.'], sub: 'See what drove the decision.', detail: ['Explore the demo  ·  Open Provenance'], type: 'close' },
];

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const tx = (x, y, value, size, fill, weight = 500, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(value)}</text>`;
const rect = (x, y, w, h, fill, stroke = 'none', radius = 24) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;

function art(card, index) {
  const diagram = card.detail.map((line, i) => {
    const yy = 1038 + i * 118;
    const highlight = i === card.detail.length - 1;
    return `${rect(86, yy, 908, 88, highlight ? '#25213f' : '#151b2d', highlight ? '#7569c7' : '#30364b', 20)}<circle cx="130" cy="${yy + 44}" r="11" fill="${['#a491ff','#70d9c3','#70baf8'][i%3]}"/>${tx(166, yy + 54, line, line.length > 36 ? 27 : 33, '#eef0fb', highlight ? 650 : 550)}`;
  }).join('');
  const title = card.big.map((line, i) => tx(86, 428 + i * 110, line, 77, i === card.big.length - 1 ? '#b3a6ff' : '#fbfbff', 750, 'start', 'letter-spacing="-2"')).join('');
  const progress = cards.map((_, i) => `<rect x="${86 + i * 39}" y="1781" width="${i === index ? 27 : 8}" height="8" rx="4" fill="${i === index ? '#a79aff' : '#4a4e64'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0c1220"/><stop offset=".55" stop-color="#11172a"/><stop offset="1" stop-color="#201937"/></linearGradient><radialGradient id="glow"><stop stop-color="#5544a4" stop-opacity=".4"/><stop offset="1" stop-color="#5544a4" stop-opacity="0"/></radialGradient></defs>
    <rect width="1080" height="1920" fill="url(#bg)"/><ellipse cx="1000" cy="210" rx="520" ry="520" fill="url(#glow)"/><ellipse cx="0" cy="1470" rx="520" ry="430" fill="url(#glow)" opacity=".55"/>
    <path d="M0 820C280 760 590 870 1080 768M0 880C280 820 590 930 1080 828" stroke="#282741" stroke-width="2" fill="none" opacity=".5"/>
    ${rect(74, 72, 54, 54, '#282244', '#5b4f84', 16)}<path d="M88 99l13-13 13 13-13 13z" fill="none" stroke="#c0b5ff" stroke-width="2.5"/><circle cx="101" cy="99" r="4" fill="#70d9c3"/>${tx(148, 112, 'mnemosyne', 30, '#f4f1ff', 650)}${tx(294, 112, '.', 34, '#a99bff', 750)}
    ${tx(86, 248, card.tag, 18, '#98a0b8', 750, 'start', 'letter-spacing="3"')}${title}${tx(90, 700, card.sub, 27, '#b5bdd0', 450)}
    ${rect(64, 886, 952, 658, '#101727', '#2b324a', 30)}${tx(96, 952, 'OPTIMIZATION PROVENANCE', 15, '#848ca5', 700, 'start', 'letter-spacing="2.2"')}
    ${diagram}${tx(86, 1688, 'CLOUD COST INTELLIGENCE  ·  30 SECOND TOUR', 14, '#81879c', 650, 'start', 'letter-spacing="1.5"')}${progress}
  </svg>`;
}

for (let i = 0; i < cards.length; i++) {
  await sharp(Buffer.from(art(cards[i], i))).png({ compressionLevel: 8 }).toFile(path.join(slides, `card-${i + 1}.png`));
}

// Compose an original, sample-free synth score: Cmaj7–Am7–Fmaj7–Gsus2, repeated twice.
const sampleRate = 44100;
const duration = 30;
const samples = sampleRate * duration;
const buffer = Buffer.alloc(44 + samples * 4);
buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVE', 8);
buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 4, 28); buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(16, 34);
buffer.write('data', 36); buffer.writeUInt32LE(samples * 4, 40);
const chords = [[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,130.81,174.61,220],[98,146.83,196,220]];
const arp = [[261.63,329.63,392,493.88,392,329.63,261.63,392],[220,261.63,329.63,392,329.63,261.63,220,329.63],[174.61,220,261.63,349.23,261.63,220,174.61,261.63],[196,246.94,293.66,392,293.66,246.94,196,293.66]];
let seed = 51;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (let n = 0; n < samples; n++) {
  const t = n / sampleRate;
  const chordSpan = 3.75;
  const chordIndex = Math.floor(t / chordSpan) % 4;
  const chordTime = t % chordSpan;
  const fade = Math.min(1, chordTime / 0.35, (chordSpan - chordTime) / 0.28);
  let pad = 0;
  for (let k = 0; k < chords[chordIndex].length; k++) {
    const f = chords[chordIndex][k];
    pad += Math.sin(2 * Math.PI * f * t + k * 0.09) * (k === 0 ? 0.26 : 0.17);
    pad += Math.sin(2 * Math.PI * f * 2 * t) * 0.025;
  }
  pad = pad * fade * 0.10 * (0.9 + 0.1 * Math.sin(2 * Math.PI * 0.22 * t));
  const stepSpan = 0.375;
  const step = Math.floor(t / stepSpan) % 8;
  const stepTime = t % stepSpan;
  const note = arp[chordIndex][step];
  const pluck = (Math.sin(2 * Math.PI * note * t) + 0.2 * Math.sin(2 * Math.PI * note * 2 * t)) * Math.exp(-stepTime * 8) * 0.055;
  const beatTime = t % 0.75;
  const kick = Math.sin(2 * Math.PI * (49 + 48 * Math.exp(-beatTime * 24)) * t) * Math.exp(-beatTime * 24) * 0.22;
  const snareTime = (t + 0.00001) % 1.5;
  const snareEnv = Math.exp(-snareTime * 32) * (snareTime < 0.11 ? 1 : 0);
  const snare = (random() * 2 - 1) * snareEnv * 0.03;
  const left = Math.tanh(pad + pluck + kick + snare) * 0.72;
  const right = Math.tanh(pad + pluck * 0.78 + kick + snare * 0.88) * 0.72;
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left * 32767))), 44 + n * 4);
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right * 32767))), 46 + n * 4);
}
await fs.writeFile(music, buffer);

const run = (args, cwd, label) => {
  const result = spawnSync(ffmpeg, args, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label} failed:\n${result.stderr?.slice(-3000) || result.error}`);
};
const list = cards.map((_, i) => `file 'card-${i + 1}.png'\nduration 5`).join('\n') + "\nfile 'card-6.png'\n";
await fs.writeFile(path.join(slides, 'reel.ffconcat'), `ffconcat version 1.0\n${list}`);
const voiceDuration = (await fs.stat(voice)).size / (44100 * 2) - 0.0005;
if (voiceDuration > 29.5) throw new Error(`Voiceover is ${voiceDuration.toFixed(2)} seconds; shorten the script to fit.`);
const narrationSeconds = voiceDuration.toFixed(3);
run([
  '-hide_banner','-loglevel','error','-f','concat','-safe','0','-i','reel.ffconcat','-i',voice,'-i',music,
  '-filter_complex',`[1:a]apad=pad_dur=30,atrim=duration=30,volume=1.12,aformat=channel_layouts=stereo[vox];[2:a]volume=0.19,afade=t=in:st=0:d=0.6,afade=t=out:st=28:d=2,aformat=channel_layouts=stereo[bed];[vox][bed]amix=inputs=2:duration=longest:dropout_transition=0,alimiter=limit=0.96[a]`,
  '-map','0:v:0','-map','[a]','-vf','fps=30,scale=1080:1920:flags=lanczos,format=yuv420p','-fps_mode','cfr','-t','30',
  '-c:v','libx264','-preset','veryfast','-crf','22','-r','30','-c:a','aac','-b:a','160k','-ar','48000','-ac','2','-movflags','+faststart','-y',output
], slides, 'Encoding reel');
await fs.writeFile(path.join(here, 'reel-music-license.txt'), `Custom synthesized instrumental score composed for the Mnemosyne demo reel. The track is generated from oscillators and deterministic noise in build-reel.mjs; no third-party recording, sample, or music-library track is used. There are no attribution requirements for the generated track.\n`);
await fs.writeFile(path.join(here, 'reel-storyboard.md'), `# Mnemosyne demo reel · 30 seconds\n\nFormat: 9:16 vertical, narrated, with original synthesized music.\n\n| Time | Visual |\n|---:|---|\n| 00:00 | Why this result? |\n| 00:05 | Fit CPU and memory |\n| 00:10 | Trace the actual calculation |\n| 00:15 | Compare plain and traced output |\n| 00:20 | Save the run with Prisma |\n| 00:25 | Follow inputs back to the decision |\n\nVoiceover: ${narrationSeconds}s. Music: custom score, composed for this reel.\n`);
console.log(`Rendered ${output}; runtime 00:30, voiceover ${narrationSeconds}s with original music.`);
