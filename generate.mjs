#!/usr/bin/env node
/**
 * Mach-6 Quantum Cyber Recon Jet Heatmap Generator
 * Visualizes GitHub contribution telemetry with an autonomous stealth interceptor,
 * dynamic plasma thrusters, laser targeting HUD, and kinetic energy bursts.
 */

import fs from "node:fs";
import path from "node:path";

const USERNAME = process.env.GH_USERNAME || "DRafi2006";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OUTPUT = process.env.OUTPUT_PATH || "dist/github-jet.svg";
const COLS = 34;
const ROWS = 7;
const CELL = 11;
const STEP = 14;
const GRID_X = 22;
const GRID_Y = 28;
const WIDTH = 530;
const HEIGHT = 185;
const JET_X_START = 38;
const JET_X_END = 492;
const LOOP_DUR = 18; // 18s smooth combat patrol
const MAX_TARGETS = 14;
const FLASH_COLOR = "#00FF9D";
const BULLET_COLOR = "#00F2FE";
const BLAST_COLOR = "#38EF7D";
const PAD_Y = 142;

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

async function fetchWeeks() {
  if (TOKEN) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: QUERY, variables: { login: USERNAME } }),
      });
      if (res.ok) {
        const json = await res.json();
        if (!json.errors && json.data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
          return json.data.user.contributionsCollection.contributionCalendar.weeks;
        }
      }
    } catch (err) {
      console.warn("GraphQL fetch failed, falling back to public calendar...", err.message);
    }
  }

  // Fallback: public contribution calendar
  try {
    const res = await fetch(`https://github.com/users/${USERNAME}/contributions`);
    if (res.ok) {
      const html = await res.text();
      const COLORS = ["#111927", "#0d3a2b", "#096e48", "#00b86b", "#00ff9d"];
      const cellRegex = /<td[^>]+data-date="([^"]+)"[^>]+id="([^"]+)"[^>]+data-level="([^"]+)"[^>]*>/g;
      const tooltips = {};
      const tipRegex = /<tool-tip[^>]+for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g;
      let tm;
      while ((tm = tipRegex.exec(html)) !== null) {
        tooltips[tm[1]] = tm[2].trim();
      }

      const daysByDate = {};
      let cm;
      while ((cm = cellRegex.exec(html)) !== null) {
        const date = cm[1];
        const id = cm[2];
        const level = parseInt(cm[3], 10);
        const tip = tooltips[id] || "";
        const countMatch = tip.match(/^(\d+)\s+contribution/);
        const count = countMatch ? parseInt(countMatch[1], 10) : 0;
        daysByDate[date] = {
          date,
          contributionCount: count,
          color: COLORS[level] || "#111927",
        };
      }

      const dates = Object.keys(daysByDate).sort();
      const weeks = [];
      let currentWeek = [];
      for (const d of dates) {
        const dayObj = daysByDate[d];
        const dayOfWeek = new Date(d + "T00:00:00Z").getUTCDay();
        if (dayOfWeek === 0 && currentWeek.length > 0) {
          weeks.push({ contributionDays: currentWeek });
          currentWeek = [];
        }
        currentWeek.push(dayObj);
      }
      if (currentWeek.length > 0) {
        weeks.push({ contributionDays: currentWeek });
      }

      if (weeks.length > 0) return weeks;
    }
  } catch (e) {
    console.warn("Public fetch fallback error, generating synthetic matrix...", e.message);
  }

  // Synthetic default for fallback preview
  const syntheticWeeks = [];
  for (let w = 0; w < COLS; w++) {
    const days = [];
    for (let d = 0; d < ROWS; d++) {
      const active = (w * 7 + d) % 3 === 0 || (w * 7 + d) % 5 === 0;
      const count = active ? ((w + d) % 7) + 1 : 0;
      const colors = ["#111927", "#0d3a2b", "#096e48", "#00b86b", "#00ff9d"];
      const level = active ? Math.min(4, Math.floor(count / 2) + 1) : 0;
      days.push({
        date: `2026-0${Math.floor(w/4)+1}-${(d+1).toString().padStart(2, '0')}`,
        contributionCount: count,
        color: colors[level]
      });
    }
    syntheticWeeks.push({ contributionDays: days });
  }
  return syntheticWeeks;
}

function buildCells(weeks) {
  const recent = weeks.slice(-COLS);
  const padCount = COLS - recent.length;
  const padded = Array.from({ length: padCount }, () => ({
    contributionDays: Array.from({ length: ROWS }, () => ({
      contributionCount: 0,
      color: "#111927",
      date: null,
    })),
  })).concat(recent);

  const cells = [];
  padded.forEach((week, col) => {
    week.contributionDays.forEach((day, row) => {
      cells.push({
        col,
        row,
        x: GRID_X + col * STEP,
        y: GRID_Y + row * STEP,
        color: day.color || "#111927",
        count: day.contributionCount || 0,
        date: day.date,
      });
    });
  });
  return cells;
}

function pickTargets(cells) {
  return [...cells]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TARGETS)
    .sort((a, b) => a.col - b.col || a.row - b.row);
}

function keyTimeForCol(col, direction) {
  const span = 0.46;
  const t = 0.02 + (col / (COLS - 1)) * span;
  return direction === "forward" ? t : 1 - t;
}

function fmt(n) {
  return Number(n.toFixed(4));
}

function buildGrid(cells, targets) {
  const targetKey = new Set(targets.map((t) => `${t.col}-${t.row}`));
  let svg = "";
  for (const c of cells) {
    const isTarget = targetKey.has(`${c.col}-${c.row}`);
    if (!isTarget) {
      svg += `<rect x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c.color}"/>\n`;
      continue;
    }
    const tFwd = keyTimeForCol(c.col, "forward");
    const tBack = keyTimeForCol(c.col, "backward");
    const [t1, t2] = [Math.min(tFwd, tBack), Math.max(tFwd, tBack)];
    const dur = 0.007;
    svg += `<rect x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c.color}">` +
      `<animate attributeName="fill" dur="${LOOP_DUR}s" repeatCount="indefinite" ` +
      `keyTimes="0;${fmt(t1)};${fmt(t1 + dur)};${fmt(t2)};${fmt(t2 + dur)};1" ` +
      `values="${c.color};${c.color};${FLASH_COLOR};${c.color};${FLASH_COLOR};${c.color}"/>` +
      `</rect>\n`;
  }
  return svg;
}

function buildBulletsAndBlasts(targets) {
  let bullets = "";
  let blasts = "";
  const dur = 0.007;

  for (const dir of ["forward", "backward"]) {
    const ordered = dir === "forward" ? targets : [...targets].reverse();
    for (const c of ordered) {
      const t = keyTimeForCol(c.col, dir);
      const rise = t - dur * 2.8;
      const arrive = t;
      const fadeEnd = t + dur;
      const cx = fmt(c.x + CELL / 2);
      const targetY = fmt(c.y + CELL / 2);

      bullets += `<line x1="${cx}" y1="${PAD_Y}" x2="${cx}" y2="${targetY}" stroke="${BULLET_COLOR}" stroke-width="1.8" stroke-linecap="round" opacity="0">` +
        `<animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite" ` +
        `keyTimes="0;${fmt(rise)};${fmt(arrive)};${fmt(fadeEnd)};1" values="0;1;1;0;0"/>` +
        `</line>\n`;

      blasts += `<circle cx="${cx}" cy="${targetY}" r="0" fill="none" stroke="${BLAST_COLOR}" stroke-width="1.8" opacity="0">` +
        `<animate attributeName="r" dur="${LOOP_DUR}s" repeatCount="indefinite" ` +
        `keyTimes="0;${fmt(arrive)};${fmt(arrive + dur * 3)};1" values="0;2;11;11"/>` +
        `<animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite" ` +
        `keyTimes="0;${fmt(arrive)};${fmt(arrive + dur * 3)};1" values="0;1;0;0"/>` +
        `</circle>\n`;
    }
  }
  return { bullets, blasts };
}

function buildStarsAndHud() {
  const pts = [
    [10, 15, 1.4], [10, 80, 1.8], [10, 145, 2.2],
    [520, 18, 1.5], [520, 95, 2.0], [520, 150, 1.6],
    [265, 14, 2.4], [140, 172, 1.8], [390, 172, 2.0]
  ];
  const stars = pts.map(([x, y, dur]) =>
    `<circle cx="${x}" cy="${y}" r="1" fill="#00FF9D" opacity="0.3"><animate attributeName="opacity" values="0.1;0.8;0.1" dur="${dur}s" repeatCount="indefinite"/></circle>`
  ).join("\n");

  return `
    ${stars}
    <!-- Top HUD Coordinates -->
    <text x="22" y="18" fill="#00FF9D" font-family="'Courier New', monospace" font-size="8.5" font-weight="bold" letter-spacing="1">RADAR PATROL // MACH-6 RECON INTERCEPTOR</text>
    <text x="508" y="18" text-anchor="end" fill="#00F2FE" font-family="'Courier New', monospace" font-size="8.5" letter-spacing="0.5">SECTOR: @${USERNAME}</text>
    <line x1="22" y1="22" x2="508" y2="22" stroke="#00FF9D" stroke-width="0.8" opacity="0.35"/>
    <line x1="22" y1="132" x2="508" y2="132" stroke="#00F2FE" stroke-width="0.8" opacity="0.25"/>
    <!-- Bottom HUD Status -->
    <text x="22" y="174" fill="#64748B" font-family="'Courier New', monospace" font-size="8">● TELEMETRY: OPTIMAL</text>
    <text x="265" y="174" text-anchor="middle" fill="#00FF9D" font-family="'Courier New', monospace" font-size="8" letter-spacing="0.5">● PATROLLING REAL COMMIT CLUSTERS</text>
    <text x="508" y="174" text-anchor="end" fill="#64748B" font-family="'Courier New', monospace" font-size="8">SYS: ACTIVE</text>
  `;
}

function buildStealthJet() {
  return `<g id="jet">
  <g transform="translate(0,0)">
    <!-- Plasma Exhaust Thruster Glow -->
    <polygon points="-4,8 4,8 0,22" fill="url(#plasmaThruster)" opacity="0.95">
      <animate attributeName="opacity" values="0.75;1;0.6;1;0.8" dur="0.12s" repeatCount="indefinite"/>
    </polygon>
    <!-- Afterburner Shock Rings -->
    <ellipse cx="0" cy="18" rx="3.5" ry="1.5" fill="none" stroke="#00F2FE" stroke-width="0.8" opacity="0.8">
      <animate attributeName="ry" values="1;2.5;1" dur="0.15s" repeatCount="indefinite"/>
    </ellipse>

    <!-- Main Stealth Delta Body -->
    <polygon points="0,-18 10,7 5,5 -5,5 -10,7" fill="#0F172A" stroke="#00F2FE" stroke-width="1.2"/>
    <!-- Inner Wing Armor Panels -->
    <polygon points="-10,7 -16,14 -4,8" fill="#1E293B" stroke="#00FF9D" stroke-width="0.7"/>
    <polygon points="10,7 16,14 4,8" fill="#1E293B" stroke="#00FF9D" stroke-width="0.7"/>
    <!-- Cyber Cockpit Canopy Glow -->
    <polygon points="0,-12 3,-2 0,0 -3,-2" fill="#00FF9D" opacity="0.95">
      <animate attributeName="fill" values="#00FF9D;#00F2FE;#00FF9D" dur="2s" repeatCount="indefinite"/>
    </polygon>
    <!-- Wingtip Navigation Strobes -->
    <circle cx="-15" cy="13" r="1.5" fill="#FF0055">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite"/>
    </circle>
    <circle cx="15" cy="13" r="1.5" fill="#00FF9D">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite"/>
    </circle>
  </g>
  <animateTransform attributeName="transform" attributeType="XML" type="translate"
    dur="${LOOP_DUR}s" repeatCount="indefinite"
    keyTimes="0;0.5;1"
    values="${JET_X_START}.00,150.00;${JET_X_END}.00,150.00;${JET_X_START}.00,150.00"/>
</g>`;
}

function buildSvg(weeks) {
  const cells = buildCells(weeks);
  const targets = pickTargets(cells);
  const { bullets, blasts } = buildBulletsAndBlasts(targets);

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#050B14"/>
    <stop offset="50%" stop-color="#08101E"/>
    <stop offset="100%" stop-color="#03070E"/>
  </linearGradient>
  <linearGradient id="plasmaThruster" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#00F2FE"/>
    <stop offset="60%" stop-color="#00FF9D"/>
    <stop offset="100%" stop-color="transparent"/>
  </linearGradient>
  <linearGradient id="gridScan" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#00FF9D" stop-opacity="0"/>
    <stop offset="50%" stop-color="#00F2FE" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#00FF9D" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="12" fill="url(#bgGrad)" stroke="#00FF9D" stroke-width="1.2" stroke-opacity="0.4"/>
<!-- Scan sweep line -->
<rect x="0" y="24" width="${WIDTH}" height="106" fill="url(#gridScan)" opacity="0.25">
  <animate attributeName="x" from="-${WIDTH}" to="${WIDTH}" dur="5s" repeatCount="indefinite"/>
</rect>
${buildStarsAndHud()}
<g id="grid">
${buildGrid(cells, targets)}</g>
<g id="bullets">
${bullets}</g>
<g id="blasts">
${blasts}</g>
${buildStealthJet()}
</svg>`;
}

async function main() {
  console.log(`Generating Quantum Recon Mach-6 Jet Heatmap for @${USERNAME}...`);
  const weeks = await fetchWeeks();
  const svg = buildSvg(weeks);
  const outPath = path.resolve(OUTPUT);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, svg, "utf8");
  console.log(`Successfully generated ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
