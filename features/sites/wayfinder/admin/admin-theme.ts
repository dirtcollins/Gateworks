// Wayfinder admin theme — the "Ledger" palette. A modern fintech look
// (Ramp / Mercury / Brex): airy paper-white surfaces, an institutional indigo
// accent, soft elevation, and generous rounding. Ported from the Ledger site
// theme (features/sites/ledger/kit.tsx). Keys mirror the storefront `wf`
// tokens so this drops into every admin component unchanged.
export const wf = {
  ink: "#15181f", // primary text — near-black slate
  control: "#2f3aa3", // filled controls / primary — institutional indigo
  steel: "#41475a", // secondary text
  muted: "#8b91a3", // tertiary text / labels
  rail: "#e4e6ec", // hairline borders
  hairline: "#edeef2", // lighter divider
  paper: "#f5f6f8", // app background — cool airy paper
  bone: "#f7f8fb", // subtle fill — table headers
  pine: "#0f7a52", // positive / collected (Ledger mint)
  pineDeep: "#0c6443",
  amber: "#fbf2dd", // attention surface (Ledger amberSoft)
  amberDeep: "#ead7a6",
  red: "#a8324a", // negative / overdue (Ledger rose)
  safety: "#2f3aa3", // accent — institutional indigo
  indigoSoft: "#eef0fb", // accent tint surface
  mintSoft: "#e6f4ee",
  roseSoft: "#fbe9ec"
} as const;

// Generous rounding — the Ledger look. Cards/panels vs. controls.
export const RADIUS = 16;
export const RADIUS_SM = 10;

// Soft, low fintech elevation so panels read as surfaces on the paper canvas.
export const ELEVATION = "0 1px 2px rgba(21,24,31,0.05), 0 4px 14px rgba(21,24,31,0.04)";
