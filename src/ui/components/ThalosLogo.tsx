import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

interface Props {
  /** Bounding-box size in points. Default 80. */
  size?: number;
  /**
   * 'onNavy'  — frosted-glass ring + white mark (on gradient headers)
   * 'dark'    — teal-navy gradient fill + dark bezel + ticks (on surfaces)
   * 'light'   — alias for 'dark'
   */
  variant?: 'light' | 'dark' | 'onNavy';
}

// ── Gauge tick marks ─────────────────────────────────────────────────────────
// 12 ticks at 30° intervals; cardinal directions (0/90/180/270) are major.
const TICKS: [number, boolean][] = [
  [0,   true],  [30,  false], [60,  false],
  [90,  true],  [120, false], [150, false],
  [180, true],  [210, false], [240, false],
  [270, true],  [300, false], [330, false],
];

/** Convert compass angle + two radii → SVG line endpoints. */
function tickCoords(alpha: number, r1: number, r2: number) {
  // compass α (0=top, clockwise) → standard math angle
  const rad = ((alpha - 90) * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  return { x1: 40 + r1 * c, y1: 40 + r1 * s, x2: 40 + r2 * c, y2: 40 + r2 * s };
}

// ── T lettermark ─────────────────────────────────────────────────────────────
// Crossbar: flat-ended, y=22→30, x=19→61 (42 px wide)
// Stem body:              y=30→52, x=36→44
// Compass-needle tip:     tapers to point (40, 62)
// All coordinates in 80-pt design space (SVG viewBox "0 0 80 80").
const T_PATH =
  'M 19 22 L 61 22 L 61 30 L 44 30 L 44 52 L 40 62 L 36 52 L 36 30 L 19 30 Z';

// ── Two-hump wave ─────────────────────────────────────────────────────────────
const WAVE_PATH = 'M 28 65 Q 34 63 40 65 Q 46 67 52 65';

export function ThalosLogo({ size = 80, variant = 'onNavy' }: Props) {
  const gId = `tl-g-${variant}`;

  // ── onNavy ────────────────────────────────────────────────────────────────
  if (variant === 'onNavy') {
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80">
        {/* Frosted outer ring */}
        <Circle cx={40} cy={40} r={38}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.50)"
          strokeWidth={1}
        />
        {/* Frosted inner fill */}
        <Circle cx={40} cy={40} r={32} fill="rgba(255,255,255,0.06)" />
        {/* Separator ring */}
        <Circle cx={40} cy={40} r={32} fill="none"
          stroke="rgba(255,255,255,0.28)" strokeWidth={0.75}
        />
        {/* Tick marks */}
        {TICKS.map(([a, major]) => {
          const { x1, y1, x2, y2 } = tickCoords(a, major ? 30 : 34, 38);
          return (
            <Line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={major ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.40)'}
              strokeWidth={major ? 1.5 : 0.75}
              strokeLinecap="round"
            />
          );
        })}
        {/* T mark */}
        <Path d={T_PATH} fill="#FFFFFF" />
        {/* Wave */}
        <Path d={WAVE_PATH}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.5} strokeLinecap="round" fill="none"
        />
      </Svg>
    );
  }

  // ── dark / light ──────────────────────────────────────────────────────────
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Defs>
        {/* Inner ocean fill: teal → deep navy */}
        <LinearGradient id={gId} x1="0.15" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor="#33A7B5" stopOpacity="1" />
          <Stop offset="1" stopColor="#001C5A" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Outer gauge bezel — dark navy with teal border */}
      <Circle cx={40} cy={40} r={38}
        fill="#001040"
        stroke="rgba(51,167,181,0.45)"
        strokeWidth={1}
      />

      {/* Inner teal-navy fill (ocean) */}
      <Circle cx={40} cy={40} r={32} fill={`url(#${gId})`} />

      {/* Separator ring (bezel edge) */}
      <Circle cx={40} cy={40} r={32} fill="none"
        stroke="rgba(255,255,255,0.22)" strokeWidth={0.75}
      />

      {/* Tick marks — majors cross into the fill, minors stay in bezel */}
      {TICKS.map(([a, major]) => {
        const { x1, y1, x2, y2 } = tickCoords(a, major ? 30 : 34, 38);
        return (
          <Line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={major ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.48)'}
            strokeWidth={major ? 1.5 : 0.75}
            strokeLinecap="round"
          />
        );
      })}

      {/* T mark */}
      <Path d={T_PATH} fill="#FFFFFF" />

      {/* Wave */}
      <Path d={WAVE_PATH}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.5} strokeLinecap="round" fill="none"
      />
    </Svg>
  );
}

export function ThalosWordmark({ size = 36 }: { size?: number }) {
  return <ThalosLogo size={size} variant="dark" />;
}
