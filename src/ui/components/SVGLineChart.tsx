/**
 * SVGLineChart — custom line chart built with react-native-svg.
 * Supports catmullRom smooth curves, dashed average reference line, and
 * x-axis date labels. Used by the Gas Consumption Stats screen.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Svg,
  Path,
  Circle,
  Line as SvgLine,
  Text as SvgText,
  G,
} from 'react-native-svg';

export interface ChartDataPoint {
  id: string;
  date: Date;
  value: number;
}

interface Props {
  data: ChartDataPoint[];
  width: number;
  height?: number;
  lineColor: string;
  avgValue?: number;
  avgLabel?: string;
  yAxisLabel?: string;
}

// ── Padding constants ──────────────────────────────────────────────────────────
const PAD_LEFT   = 10;
const PAD_RIGHT  = 10;
const PAD_TOP    = 28;   // room for avg annotation above line
const PAD_BOTTOM = 32;   // room for x-axis date labels

// ── CatmullRom → cubic bezier conversion ──────────────────────────────────────
function catmullRomPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  if (pts.length === 2) {
    return `M ${f(pts[0].x)} ${f(pts[0].y)} L ${f(pts[1].x)} ${f(pts[1].y)}`;
  }
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${f(cp1x)} ${f(cp1y)}, ${f(cp2x)} ${f(cp2y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

function f(n: number) { return n.toFixed(1); }

function fmtAxisDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SVGLineChart({
  data,
  width,
  height = 220,
  lineColor,
  avgValue,
  avgLabel,
  yAxisLabel,
}: Props) {
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  if (data.length === 0 || chartW <= 0 || chartH <= 0) return null;

  // Value domain
  const values   = data.map(d => d.value);
  const rawMin   = Math.min(...values);
  const rawMax   = Math.max(...values);
  // Add 10% padding so points don't touch edges
  const padding  = (rawMax - rawMin) * 0.15 || rawMax * 0.1 || 0.1;
  const minVal   = rawMin - padding;
  const maxVal   = rawMax + padding;
  const valRange = maxVal - minVal;

  // Date domain
  const timestamps = data.map(d => d.date.getTime());
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const dateRange = maxT - minT || 1;

  const toX = (t: number) => PAD_LEFT + ((t - minT) / dateRange) * chartW;
  const toY = (v: number) => PAD_TOP + chartH - ((v - minVal) / valRange) * chartH;

  const svgPts = data.map(d => ({ x: toX(d.date.getTime()), y: toY(d.value) }));
  const linePath = catmullRomPath(svgPts);

  // Average line y-coordinate
  const avgY = avgValue != null ? toY(avgValue) : null;

  // X-axis label indices — show at most 5, always include first and last
  const maxLabels = 5;
  const step = Math.max(1, Math.ceil(data.length / maxLabels));
  const labelIdxSet = new Set<number>();
  for (let i = 0; i < data.length; i += step) labelIdxSet.add(i);
  labelIdxSet.add(0);
  labelIdxSet.add(data.length - 1);
  const labelIndices = Array.from(labelIdxSet).sort((a, b) => a - b);

  // Y-axis grid lines (at 0%, 25%, 50%, 75%, 100%)
  const gridFractions = [0, 0.25, 0.5, 0.75, 1];
  const gridYs = gridFractions.map(f => PAD_TOP + chartH * (1 - f));

  return (
    <View style={{ height, width }}>
      <Svg width={width} height={height}>

        {/* Grid lines */}
        {gridYs.map((gy, i) => (
          <SvgLine
            key={`grid-${i}`}
            x1={PAD_LEFT} y1={gy}
            x2={PAD_LEFT + chartW} y2={gy}
            stroke="rgba(120,120,128,0.15)"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis label (top-left, small) */}
        {yAxisLabel ? (
          <SvgText
            x={PAD_LEFT}
            y={PAD_TOP - 6}
            fill="rgba(110,110,115,0.8)"
            fontSize={9}
            fontWeight="400"
          >
            {yAxisLabel}
          </SvgText>
        ) : null}

        {/* Average reference line (dashed orange) */}
        {avgY != null ? (
          <G>
            <SvgLine
              x1={PAD_LEFT} y1={avgY}
              x2={PAD_LEFT + chartW} y2={avgY}
              stroke="rgba(255,149,0,0.6)"
              strokeWidth={1}
              strokeDasharray="5,3"
            />
            {avgLabel ? (
              <SvgText
                x={PAD_LEFT + chartW - 2}
                y={avgY - 5}
                textAnchor="end"
                fill="rgba(255,149,0,1)"
                fontSize={10}
                fontWeight="500"
              >
                {avgLabel}
              </SvgText>
            ) : null}
          </G>
        ) : null}

        {/* Data line (catmullRom smooth) */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {svgPts.map((pt, i) => (
          <Circle key={`pt-${i}`} cx={pt.x} cy={pt.y} r={4} fill={lineColor} />
        ))}

        {/* X-axis date labels */}
        {labelIndices.map(i => (
          <SvgText
            key={`xl-${i}`}
            x={svgPts[i].x}
            y={PAD_TOP + chartH + 20}
            textAnchor="middle"
            fill="rgba(110,110,115,0.9)"
            fontSize={9}
          >
            {fmtAxisDate(data[i].date)}
          </SvgText>
        ))}

      </Svg>
    </View>
  );
}

// Placeholder — unused but keeps import clean
const _styles = StyleSheet.create({});
