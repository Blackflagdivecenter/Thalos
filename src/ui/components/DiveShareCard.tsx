/**
 * DiveShareCard — premium Thalos dive stats card for social sharing.
 *
 * Design language: near-black deep ocean backdrop, massive ghost depth
 * number watermark, bold teal data values, magenta/teal accent geometry.
 * Captured by react-native-view-shot in share.tsx → shareable JPEG.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface DiveShareCardProps {
  diveNumber:          number;
  date:                string;
  siteName:            string | null;
  location?:           string | null;
  maxDepthMeters:      number | null;
  bottomTimeMinutes:   number | null;
  gasType:             string | null;
  waterTempCelsius:    number | null;
  visibility:          string | null;
  buddyNames:          string[];
  imperial?:           boolean;
}

const M_TO_FT = 3.28084;

function fmtDepth(m: number | null, imp: boolean): string {
  if (m == null) return '';
  return imp ? `${(m * M_TO_FT).toFixed(0)}` : `${m.toFixed(1)}`;
}
function depthUnit(imp: boolean) { return imp ? 'ft' : 'm'; }
function fmtTemp(c: number | null, imp: boolean): string {
  if (c == null) return '';
  return imp ? `${(c * 9 / 5 + 32).toFixed(0)}°F` : `${c.toFixed(1)}°C`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

export function DiveShareCard({
  diveNumber, date, siteName, location,
  maxDepthMeters, bottomTimeMinutes, gasType,
  waterTempCelsius, visibility, buddyNames,
  imperial = false,
}: DiveShareCardProps) {
  const depthNum = fmtDepth(maxDepthMeters, imperial);
  const dUnit    = depthUnit(imperial);
  const temp     = fmtTemp(waterTempCelsius, imperial);
  const gas      = gasType?.toUpperCase() ?? 'AIR';
  const dateStr  = fmtDate(date);

  const stats: { value: string; unit?: string; label: string }[] = [];
  if (depthNum) stats.push({ value: depthNum, unit: dUnit,   label: 'DEPTH'   });
  if (bottomTimeMinutes != null) stats.push({ value: String(bottomTimeMinutes), unit: 'min', label: 'BOTTOM TIME' });
  if (gas)      stats.push({ value: gas,                     label: 'GAS MIX' });

  const condParts: string[] = [];
  if (temp)       condParts.push(temp);
  if (visibility) condParts.push(`${visibility} vis`);

  // Ghost background number — biggest stat for drama
  const ghostNum = depthNum || (bottomTimeMinutes != null ? String(bottomTimeMinutes) : '');

  return (
    <View style={s.card}>

      {/* ── Deep ocean gradient ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#040C16', '#071525', '#0A1E35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Teal radial glow (top-right) ────────────────────────────────── */}
      <View style={s.glowTR} />

      {/* ── Magenta glow (bottom-left) ──────────────────────────────────── */}
      <View style={s.glowBL} />

      {/* ── Ghost depth number ──────────────────────────────────────────── */}
      {ghostNum !== '' && (
        <Text style={s.ghostNum} numberOfLines={1} adjustsFontSizeToFit={false}>
          {ghostNum}
        </Text>
      )}

      {/* ── Left magenta accent bar ─────────────────────────────────────── */}
      <View style={s.leftBar} />

      {/* ── Top stripe ──────────────────────────────────────────────────── */}
      <View style={s.topStripe}>
        <View style={[s.stripeSegment, { backgroundColor: '#FA156B', flex: 2 }]} />
        <View style={[s.stripeSegment, { backgroundColor: '#3DBDCB', flex: 3 }]} />
        <View style={[s.stripeSegment, { backgroundColor: 'rgba(255,255,255,0.08)', flex: 1 }]} />
      </View>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.brand}>THALOS</Text>
        <View style={s.diveBadge}>
          <Text style={s.diveBadgeNum}>#{diveNumber}</Text>
          <Text style={s.diveBadgeLabel}>DIVE</Text>
        </View>
      </View>

      {/* ── Teal rule ───────────────────────────────────────────────────── */}
      <View style={s.rule}>
        <View style={s.ruleLine} />
        <View style={s.ruleDot} />
      </View>

      {/* ── Site name ───────────────────────────────────────────────────── */}
      <View style={s.siteBlock}>
        <Text style={s.siteName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {siteName?.toUpperCase() ?? 'OPEN WATER'}
        </Text>
        {location ? <Text style={s.location}>{location}</Text> : null}
      </View>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <React.Fragment key={st.label}>
              {i > 0 && <View style={s.statDivider} />}
              <View style={s.statCell}>
                <View style={s.statValueRow}>
                  <Text style={s.statValue}>{st.value}</Text>
                  {st.unit ? <Text style={s.statUnit}>{st.unit}</Text> : null}
                </View>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* ── Conditions ──────────────────────────────────────────────────── */}
      {condParts.length > 0 && (
        <View style={s.condsRow}>
          {condParts.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <View style={s.condDot} />}
              <Text style={s.condText}>{c}</Text>
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={s.spacer} />

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <View style={s.footerLeft}>
          <Text style={s.dateText}>{dateStr}</Text>
          {buddyNames.length > 0 && (
            <Text style={s.buddyText} numberOfLines={1}>
              with {buddyNames.slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
        {/* Small thalos mark */}
        <View style={s.thalosMarkWrap}>
          <View style={s.thalosMark} />
        </View>
      </View>

      {/* ── Bottom stripe ───────────────────────────────────────────────── */}
      <View style={s.bottomStripe}>
        <View style={[s.stripeSegment, { backgroundColor: 'rgba(255,255,255,0.06)', flex: 1 }]} />
        <View style={[s.stripeSegment, { backgroundColor: '#3DBDCB', flex: 3 }]} />
        <View style={[s.stripeSegment, { backgroundColor: '#FA156B', flex: 1 }]} />
      </View>

    </View>
  );
}

const CARD_SIZE = 380; // logical pts — ViewShot captures at device DPR

const s = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 18,
  },

  // ── Glows ──────────────────────────────────────────────────────────────────
  glowTR: {
    position: 'absolute',
    top: -60, right: -60,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(61,189,203,0.10)',
  },
  glowBL: {
    position: 'absolute',
    bottom: -40, left: -40,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(250,21,107,0.08)',
  },

  // ── Ghost number ───────────────────────────────────────────────────────────
  ghostNum: {
    position: 'absolute',
    right: -10,
    bottom: 40,
    fontSize: 200,
    fontWeight: '900',
    color: 'rgba(61,189,203,0.045)',
    letterSpacing: -10,
    lineHeight: 200,
  },

  // ── Left bar ───────────────────────────────────────────────────────────────
  leftBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: '#FA156B',
  },

  // ── Stripes ────────────────────────────────────────────────────────────────
  topStripe:    { flexDirection: 'row', height: 5 },
  bottomStripe: { flexDirection: 'row', height: 4 },
  stripeSegment: { height: '100%' },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 6,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 5,
  },
  diveBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(61,189,203,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,189,203,0.25)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  diveBadgeNum: {
    color: '#3DBDCB',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 17,
  },
  diveBadgeLabel: {
    color: 'rgba(61,189,203,0.55)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.8,
    lineHeight: 9,
  },

  // ── Rule ───────────────────────────────────────────────────────────────────
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 6,
  },
  ruleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(61,189,203,0.20)',
  },
  ruleDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#3DBDCB',
  },

  // ── Site ───────────────────────────────────────────────────────────────────
  siteBlock: {
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  siteName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  location: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 3,
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(61,189,203,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(61,189,203,0.18)',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  statCell:      { flex: 1, alignItems: 'center' },
  statValueRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  statValue: {
    color: '#3DBDCB',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  statUnit: {
    color: 'rgba(61,189,203,0.70)',
    fontSize: 10,
    fontWeight: '700',
    paddingBottom: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(61,189,203,0.15)',
    marginVertical: 4,
  },

  // ── Conditions ─────────────────────────────────────────────────────────────
  condsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  condDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  condText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
  },

  spacer: { flex: 1 },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  footerLeft: {},
  dateText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  buddyText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 9,
    marginTop: 2,
  },
  thalosMarkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thalosMark: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(61,189,203,0.30)',
  },
});
