# GridIQ — CLAUDE.md

Project instructions and style reference for Claude Code. Read this before making any changes.

---

## Project Overview

GridIQ is a **Formula 1 2026 season companion app** — race predictions, fantasy team builder, and live championship tracking. It is a **zero-dependency vanilla JS app** (no npm, no framework, no backend).

**File map:**
```
index.html       — markup & tab structure
css/styles.css   — all styling (~1,700 lines), NO inline styles
js/app.js        — all business logic and UI rendering (~980 lines)
js/database.js   — all F1 season data, manually maintained
js/smoke.js      — WebGL2 smoke background animation (do not modify unless fixing bugs)
```

---

## Keeping Data Current (LIVE Updates)

The app has **no backend**. All data lives in `js/database.js`. After every race weekend, this file must be updated manually.

### After each race, update `js/database.js`:

1. **`racesCompleted`** — increment by 1
2. **The completed race object** — set `status: "completed"` and `winner: "<DriverLastName>"`
3. **Driver standings** — update `points` for every driver who scored; update `position` (sort by points descending, re-number 1–22)
4. **Constructor standings** — update `points` for each team; update `position`
5. **Driver `wins`, `podiums`** — increment if applicable
6. **Comment at top of file** — update `Last synced:` date and round number

### Round status values
| Value | Meaning |
|-------|---------|
| `"completed"` | Race has been run, winner is set |
| `"upcoming"` | Future race, winner is `null` |

### Never fabricate results — only update from official formula1.com standings.

### Countdown timer
The next-race countdown in `app.js` reads `races` array and finds the first `status: "upcoming"` entry by `date`. Keeping `status` and `date` fields accurate is all that's needed — the timer calculates itself.

---

## Style System — Maintain Consistency

Never introduce new colors, fonts, or spacing units. Use only existing CSS variables.

### CSS Custom Properties (defined in `:root` and `[data-theme="light"]`)

| Variable | Dark Value | Light Value | Usage |
|----------|-----------|------------|-------|
| `--bg` | `#080808` | `#F5F5F7` | Page background |
| `--bg-card` | `#101010` | `#FFFFFF` | Card surfaces |
| `--bg-raised` | `#161616` | `#EBEBF0` | Elevated/nested surfaces |
| `--accent` | `#FF1E00` | `#FF1E00` | Primary CTA, highlights — F1 red |
| `--accent-dim` | `rgba(255,30,0,0.12)` | `rgba(255,30,0,0.10)` | Tinted accent backgrounds |
| `--accent-glow` | `rgba(255,30,0,0.35)` | `rgba(255,30,0,0.20)` | Glow/shadow on accent elements |
| `--green` | `#00D2BE` | `#009B8D` | Positive values, gains, success |
| `--text` | `#F0F0F0` | `#15151E` | Primary text |
| `--text-2` | `#888888` | `#6B6B7B` | Secondary/supporting text |
| `--text-3` | `#444444` | `#9999AA` | Muted/disabled text, dividers |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.08)` | Card/container borders |
| `--nav-h` | `60px` | — | Nav bar height, used for scroll offsets |
| `--radius` | `12px` | — | Standard border-radius |
| `--radius-sm` | `8px` | — | Compact element radius |
| `--content-pad` | `16px` | — | Horizontal page padding |

### Typography — two fonts only

| Variable | Font | Use for |
|----------|------|---------|
| `--font-tech` | `'Chakra Petch'` | Headers, labels, numbers, F1 display text |
| `--font-body` | `'Inter'` | Body copy, descriptions, UI labels |

- All tech/stat labels: `font-family: var(--font-tech); letter-spacing: 0.08–0.12em; text-transform: uppercase;`
- Body copy: `font-family: var(--font-body);`
- **Never introduce new fonts.**

### Constructor brand colors (used for dots, highlights, driver card accents)

| Team | Color |
|------|-------|
| Mercedes | `#00D2BE` |
| Ferrari | `#FF2800` |
| McLaren | `#FF8000` |
| Red Bull | `#3671C6` |
| Aston Martin | `#358C75` |
| Alpine | `#FF87BC` |
| Williams | `#64C4FF` |
| Haas | `#B6BABD` |
| Kick Sauber | `#52E252` |
| RB (VCARB) | `#6692FF` |

---

## Component Patterns

When adding new UI, match these existing patterns exactly:

### Cards
```css
background: var(--bg-card);
border: 1px solid var(--border);
border-radius: var(--radius);
padding: 16px;
```
Elevated variant adds `box-shadow: 0 4px 24px rgba(0,0,0,0.3)`.

### Section Headers
```html
<div class="section-header">
  <span class="section-title">TITLE</span>          <!-- Chakra Petch, uppercase, --text -->
  <span class="section-subtitle">subtitle text</span> <!-- Inter, --text-2 -->
</div>
```

### Stat / Data Rows (standings, calendar entries)
- Flex row, `align-items: center`, `gap: 12px`
- Position number: `--font-tech`, `--text-3`, fixed width `24px`
- Colored team dot: `8px` circle, constructor brand color
- Name: `--font-body`, `--text`, `font-weight: 600`
- Value (points/price): `--font-tech`, `--accent` or `--text`
- Hover: `background: var(--bg-raised)`, `border-radius: var(--radius-sm)`

### Buttons
- Primary CTA: `background: var(--accent)`, white text, `border-radius: var(--radius-sm)`, `font-family: var(--font-tech)`, `text-transform: uppercase`, `letter-spacing: 0.08em`
- Outline/secondary: `border: 1px solid var(--accent)`, `color: var(--accent)`, transparent background
- Toggle/filter pill: active state uses `background: var(--accent)`, inactive uses `var(--bg-raised)`

### Modals
- Full-screen overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px)`
- Inner box: `background: var(--bg-card)`, `border-radius: var(--radius)`, `max-width: 480px`, centered
- Close button: top-right, `--text-2` color, becomes `--text` on hover

### Badges / inline labels
- Small caps label: `font-family: var(--font-tech); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2)`
- Tinted badge: `background: var(--accent-dim); color: var(--accent); border-radius: 4px; padding: 2px 8px`

---

## Rendering Architecture

All UI renders through explicit functions in `app.js`. Follow the same pattern when adding features:

```javascript
function renderMySection() {
  const el = document.getElementById('my-section-id');
  if (!el) return;
  el.innerHTML = `...template string...`;
  // attach event listeners after setting innerHTML
}
```

- Call new render functions from `renderAll()` or the relevant tab's render block.
- State mutations go through the `STATE` object, then trigger a re-render.
- **Never use inline styles** (`element.style.xxx`). Add a CSS class instead.
- **Never manipulate `smoke.js`** unless fixing a WebGL bug — it's isolated by design.

---

## Simulation / Predictor Logic

The predictor in `app.js` uses a weighted scoring model. When updating ratings or adding drivers:

- `driver.rating` is an object with keys: `overall`, `wet`, `technical`, `overtaking`, `consistency`
- Track-type modifiers: `power` circuits boost top-speed drivers, `technical` boosts handling/downforce drivers
- Weather toggle: `wet` boosts `driver.rating.wet` score; `dry` uses `overall`
- Do not change the 65/35 driver/constructor weighting without updating the insight card copy too

---

## Fantasy System Rules

- Budget cap: **$100M** (never change this without updating all UI copy)
- Lineup: **5 drivers + 2 constructors**
- `driver.price` and `constructor.price` are in millions (e.g., `22.5` = $22.5M)
- PPM = `points / price` — recalculates live from current standings
- Auto-optimize uses a greedy PPM sort with budget constraint — it's intentionally simple

---

## What NOT to Do

- Do not add npm packages or a build step — this is a zero-dependency project.
- Do not add a backend, database, or API calls without explicit instruction.
- Do not introduce new CSS variables, colors, or fonts — use the existing system.
- Do not use `!important` in CSS.
- Do not add inline styles via JavaScript.
- Do not modify `smoke.js` for non-bug changes.
- Do not add comments or docstrings to code you didn't change.
- Do not create new files unless strictly necessary.
- Do not add features or refactors beyond what was asked.

---

## Data Sync Checklist (run after every race weekend)

```
[ ] Increment racesCompleted
[ ] Set race status → "completed", winner → "<LastName>"
[ ] Update all driver points values
[ ] Re-sort and re-number driver positions (1-22 by points)
[ ] Update constructor points
[ ] Re-sort and re-number constructor positions
[ ] Update driver wins / podiums if applicable
[ ] Update "Last synced" comment at top of database.js
```
