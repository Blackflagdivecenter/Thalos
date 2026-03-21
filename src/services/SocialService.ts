import type { BuddyProfile, SocialPlatform } from '@/src/models';

export interface DiveShareInfo {
  diveNumber:          number;
  date:                string;
  siteName:            string | null;
  maxDepthMeters:      number | null;
  bottomTimeMinutes:   number | null;
  gasType:             string | null;
  waterTempCelsius:    number | null;
  visibility:          string | null;
}

function platformHandles(buddies: BuddyProfile[], platform: SocialPlatform): string[] {
  return buddies
    .map(b => {
      switch (platform) {
        case 'instagram': return b.instagram;
        case 'tiktok':    return b.tiktok;
        case 'facebook':  return b.facebookHandle;
        case 'twitter':   return b.twitterHandle;
      }
    })
    .filter((h): h is string => Boolean(h));
}

function fmtDepth(m: number | null): string {
  return m != null ? `${m.toFixed(1)} m` : '';
}
function fmtTemp(c: number | null): string {
  return c != null ? `${c.toFixed(1)}°C` : '';
}
function siteTag(site: string | null): string {
  if (!site) return '';
  const slug = site.toLowerCase().replace(/[^a-z0-9]/g, '');
  return slug.length > 2 ? `#${slug}` : '';
}

export function generateCaption(
  dive: DiveShareInfo,
  buddies: BuddyProfile[],
  platform: SocialPlatform,
): string {
  const site   = dive.siteName ?? 'open water';
  const depth  = fmtDepth(dive.maxDepthMeters);
  const time   = dive.bottomTimeMinutes != null ? `${dive.bottomTimeMinutes} min` : '';
  const temp   = fmtTemp(dive.waterTempCelsius);
  const gas    = dive.gasType && dive.gasType.toLowerCase() !== 'air' ? dive.gasType : '';
  const tags   = platformHandles(buddies, platform);
  const names  = buddies.map(b => b.name);

  switch (platform) {

    case 'instagram': {
      const statsLine = [
        depth && `📊 ${depth}`,
        time  && `${time} bottom`,
      ].filter(Boolean).join(' · ');

      const condLine = [
        temp  && `🌡 ${temp}`,
        dive.visibility && `👁 ${dive.visibility} vis`,
        gas   && `💨 ${gas}`,
      ].filter(Boolean).join('  ·  ');

      const tagLine = tags.length > 0 ? `With ${tags.map(h => `@${h}`).join(' ')}` : '';
      const stag    = siteTag(dive.siteName);

      return [
        `🤿 Dive #${dive.diveNumber} — ${site}`,
        statsLine,
        condLine,
        tagLine,
        '',
        `#scuba #scubadiving #diving #underwater #divelog`,
        `#openwater #divebuddy${stag ? ` ${stag}` : ''}`,
      ].filter(l => l !== '').join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    case 'tiktok': {
      const hook   = depth ? `${depth} underwater 🌊` : `Under the surface 🌊`;
      const second = [time && `${time}`, `at ${site}`].filter(Boolean).join(' ');
      const tagLine = tags.map(h => `@${h}`).join(' ');

      return [
        hook,
        second,
        tagLine,
        '',
        '#scuba #diving #fyp #underwater #ocean #scubalife',
      ].filter(Boolean).join('\n');
    }

    case 'facebook': {
      const withStr = names.length > 0
        ? ` with ${names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]}`
        : '';

      const lines: string[] = [
        `Just logged a great dive at ${site}${withStr}! 🤿`,
      ];

      if (depth || time) {
        const s = [depth, time && `${time} bottom time`].filter(Boolean).join(' · ');
        lines.push(`Stats: ${s}.`);
      }

      const conds = [
        temp && `${temp} water`,
        dive.visibility && `${dive.visibility} visibility`,
      ].filter(Boolean);
      if (conds.length > 0) lines.push(`Conditions: ${conds.join(', ')}.`);
      if (gas) lines.push(`Gas: ${gas}.`);

      return lines.join('\n');
    }

    case 'twitter': {
      const tagStr = tags.map(h => `@${h}`).join(' ');
      const statsRow = [depth, time, gas || 'Air', temp, dive.visibility && `${dive.visibility} vis`]
        .filter(Boolean).join(' · ');

      const parts = [
        `Dive #${dive.diveNumber} ✅  ${site}`,
        statsRow,
        tagStr,
        '#scuba #diving',
      ].filter(Boolean).join('\n');

      return parts.length > 280 ? parts.slice(0, 277) + '…' : parts;
    }
  }
}
