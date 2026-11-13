import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '').replaceAll('%20', ' '));
const audioDir = path.join(root, 'work', 'audio');
const imageDir = path.join(root, 'work', 'slides');
const workDir = path.join(root, 'work');
const output = path.join(root, 'mnemosyne-demo-30-minute-walkthrough.mp4');
const ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg';
const manifest = JSON.parse(await fs.readFile(path.join(audioDir, 'manifest.json'), 'utf8'));
const run = (args, cwd, label) => {
  const result = spawnSync(ffmpeg, args, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label} failed:\n${result.stderr?.slice(-4000) || result.error}`);
};
const q = (s) => `'${s.replaceAll("'", "'\\''")}'`;

async function wavSeconds(filename) {
  const handle = await fs.open(path.join(audioDir, filename), 'r');
  try {
    const header = Buffer.alloc(46);
    await handle.read(header, 0, 46, 0);
    const sampleRate = header.readUInt32LE(24);
    const blockAlign = header.readUInt16LE(32);
    const dataSize = header.readUInt32LE(42);
    return dataSize / (sampleRate * blockAlign);
  } finally { await handle.close(); }
}

const chapters = [];
for (const item of manifest) chapters.push({ ...item, exactDuration: await wavSeconds(item.audio) });
const spokenSeconds = chapters.reduce((sum, c) => sum + c.exactDuration, 0);
const pauseSeconds = chapters.reduce((sum, c) => sum + c.pause, 0);
const introSeconds = 15;
const outroSeconds = 1800 - introSeconds - spokenSeconds - pauseSeconds;
if (outroSeconds < 0) throw new Error('Narration and guided pauses exceed the 30-minute runtime.');

const audioEntries = [];
const slideEntries = [];
const events = [];
const addSilence = (name, seconds) => {
  if (seconds <= 0) return;
  run(['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', seconds.toFixed(6), '-c:a', 'pcm_s16le', '-y', name], audioDir, `Creating ${name}`);
  audioEntries.push(name);
};
const addVisual = (name, seconds) => slideEntries.push({ name, seconds });
addSilence('intro-silence.wav', introSeconds);
addVisual('intro.png', introSeconds);
events.push({ title: 'Opening title', seconds: introSeconds });

for (const chapter of chapters) {
  const image = `chapter-${String(chapter.index).padStart(2, '0')}.png`;
  audioEntries.push(chapter.audio);
  addVisual(image, chapter.exactDuration);
  events.push({ title: chapter.title, seconds: chapter.exactDuration });
  if (chapter.pause > 0) {
    const gap = `pause-${String(chapter.index).padStart(2, '0')}.wav`;
    addSilence(gap, chapter.pause);
    const pauseImage = `pause-${String(chapter.index).padStart(2, '0')}.png`;
    addVisual(pauseImage, chapter.pause);
    events.push({ title: chapter.pauseText || 'Guided pause', seconds: chapter.pause });
  }
}
addSilence('outro-silence.wav', outroSeconds);
addVisual('outro.png', outroSeconds);
events.push({ title: 'Closing card', seconds: outroSeconds });

const concatAudio = audioEntries.map((name) => `file ${q(name)}`).join('\n') + '\n';
await fs.writeFile(path.join(audioDir, 'audio.ffconcat'), `ffconcat version 1.0\n${concatAudio}`);
const concatVideo = slideEntries.map((item) => `file ${q(item.name)}\nduration ${item.seconds.toFixed(6)}`).join('\n') + `\nfile ${q(slideEntries.at(-1).name)}\n`;
await fs.writeFile(path.join(imageDir, 'slides.ffconcat'), `ffconcat version 1.0\n${concatVideo}`);

run(['-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'audio.ffconcat', '-c:a', 'pcm_s16le', '-y', 'full-narration.wav'], audioDir, 'Combining narration');
run([
  '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', 'slides.ffconcat', '-i', path.join(audioDir, 'full-narration.wav'),
  '-map', '0:v:0', '-map', '1:a:0', '-vf', 'fps=1,format=yuv420p', '-fps_mode', 'cfr', '-r', '1', '-t', '1800',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-maxrate', '900k', '-bufsize', '1800k', '-g', '25',
  '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', '-y', output
], imageDir, 'Rendering MP4');

let cursor = 0;
const timestamp = (seconds) => {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const lines = ['# Video chapter guide', '', '30-minute guided tour of the dashboard, optimizer, Mnemosyne provenance, and Prisma persistence.', '', '| Start | Segment |', '|---:|---|'];
for (const event of events) {
  lines.push(`| ${timestamp(cursor)} | ${event.title.replaceAll('|', '/')} |`);
  cursor += event.seconds;
}
lines.push('', `Exact planned duration: 30:00. Output: ${path.basename(output)}.`, '');
await fs.writeFile(path.join(root, 'storyboard.md'), lines.join('\n'));
console.log(`Rendered ${output}`);
console.log(`Timeline: 30:00 (narration ${spokenSeconds.toFixed(2)}s, guided pauses ${pauseSeconds}s, opening ${introSeconds}s, closing ${outroSeconds.toFixed(2)}s).`);
