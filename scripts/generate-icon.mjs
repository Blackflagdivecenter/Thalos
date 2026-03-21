/**
 * Generates app icon PNGs from the Thalos logo SVG.
 * Run: node scripts/generate-icon.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Logo geometry (mirrors ThalosLogo.tsx 'dark' variant) ─────────────────────
// All in 80×80 design space, scaled up to fill a 1024×1024 icon.

function buildSVG(size) {
  const s = size;
  const scale = s / 80;
  const cx = s / 2;

  // Radii in design space → scaled
  const rOuter  = 38 * scale;
  const rInner  = 32 * scale;
  const rMajor1 = 30 * scale; // major tick inner
  const rMinor1 = 34 * scale; // minor tick inner

  // T lettermark path — design space origin (40,40) centred in 80×80
  // Translate to 512,512 centre in 1024×1024
  const tx = cx - 40 * scale;
  const ty = cx - 40 * scale;

  function scaleCoord(v) { return v * scale + (v < 40 ? tx : tx); }
  function sc(v) { return (v * scale + (s / 2 - 40 * scale)).toFixed(3); }

  // Tick marks
  const ticks = [
    [0,   true], [30,  false], [60,  false],
    [90,  true], [120, false], [150, false],
    [180, true], [210, false], [240, false],
    [270, true], [300, false], [330, false],
  ];

  function tickLine([alpha, major]) {
    const rad = ((alpha - 90) * Math.PI) / 180;
    const cosA = Math.cos(rad), sinA = Math.sin(rad);
    const r1 = (major ? rMajor1 : rMinor1);
    const r2 = rOuter;
    const x1 = (cx + r1 * cosA).toFixed(3);
    const y1 = (cx + r1 * sinA).toFixed(3);
    const x2 = (cx + r2 * cosA).toFixed(3);
    const y2 = (cx + r2 * sinA).toFixed(3);
    const stroke = major ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.48)';
    const sw = (major ? 1.5 : 0.75) * scale;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round"/>`;
  }

  // T path in scaled coordinates
  // Original: M 19 22 L 61 22 L 61 30 L 44 30 L 44 52 L 40 62 L 36 52 L 36 30 L 19 30 Z
  const pts = [
    [19,22],[61,22],[61,30],[44,30],[44,52],[40,62],[36,52],[36,30],[19,30]
  ];
  const tPath = 'M ' + pts.map(([x,y]) => `${sc(x)} ${sc(y)}`).join(' L ') + ' Z';

  // Wave path
  // M 28 65 Q 34 63 40 65 Q 46 67 52 65
  const waveSW = (1.5 * scale).toFixed(2);
  const wavePath = `M ${sc(28)} ${sc(65)} Q ${sc(34)} ${sc(63)} ${sc(40)} ${sc(65)} Q ${sc(46)} ${sc(67)} ${sc(52)} ${sc(65)}`;

  // Padding: icon should have a navy background with the circle centered
  const bgColor = '#001040';
  const gradId = 'oceanGrad';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="${gradId}" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#33A7B5" stop-opacity="1"/>
      <stop offset="1" stop-color="#001C5A" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" fill="${bgColor}"/>

  <!-- Outer gauge bezel -->
  <circle cx="${cx}" cy="${cx}" r="${rOuter.toFixed(3)}"
    fill="#001040" stroke="rgba(51,167,181,0.55)" stroke-width="${(1.5*scale).toFixed(2)}"/>

  <!-- Inner ocean fill -->
  <circle cx="${cx}" cy="${cx}" r="${rInner.toFixed(3)}" fill="url(#${gradId})"/>

  <!-- Separator ring -->
  <circle cx="${cx}" cy="${cx}" r="${rInner.toFixed(3)}"
    fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="${(0.75*scale).toFixed(2)}"/>

  <!-- Tick marks -->
  ${ticks.map(tickLine).join('\n  ')}

  <!-- T lettermark -->
  <path d="${tPath}" fill="#FFFFFF"/>

  <!-- Wave -->
  <path d="${wavePath}" stroke="rgba(255,255,255,0.65)" stroke-width="${waveSW}" stroke-linecap="round" fill="none"/>
</svg>`;
}

async function generate(svgStr, outPath, size) {
  const buf = Buffer.from(svgStr);
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

// 1024×1024 app icon
const svg1024 = buildSVG(1024);
await generate(svg1024, join(root, 'assets/icon.png'), 1024);

// 1024×1024 Android foreground (same design, no background — white circle on transparent)
await generate(svg1024, join(root, 'assets/android-icon-foreground.png'), 1024);

// splash icon (centered logo on navy, 200px)
const svg200 = buildSVG(200);
await generate(svg200, join(root, 'assets/splash-icon.png'), 200);

console.log('\nAll icons generated.');
