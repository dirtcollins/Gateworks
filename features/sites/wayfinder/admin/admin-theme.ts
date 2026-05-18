// Wayfinder admin theme — a cool, modern dashboard palette, deliberately
// distinct from the warm-paper storefront. The back-office is a tool, not a
// shopfront, so it leans on cool slate neutrals, crisp hairlines, soft
// elevation, and rounded corners. Keys mirror the storefront `wf` tokens so
// this is a drop-in for every admin component.
export const wf = {
  ink: "#0f1419", // cool near-black — headings and text only
  control: "#1e293b", // slate-800 — filled buttons and active states (softer than ink)
  steel: "#475569", // slate-600 — body text, labels
  muted: "#64748b", // slate-500 — secondary text
  rail: "#e2e8f0", // slate-200 — borders
  hairline: "#eef2f6", // very light cool divider
  paper: "#f4f6f9", // cool light gray — app background
  bone: "#f1f4f9", // slate-50/100 — table headers, subtle fills
  pine: "#0d9488", // teal-600 — positive / good
  pineDeep: "#0f766e", // teal-700
  amber: "#fef3c7", // light amber — warning fills
  amberDeep: "#fcd34d", // amber border
  red: "#dc2626", // modern red — danger
  safety: "#f5a623" // brand accent — carries through from the storefront
} as const;

// Corner radius — the storefront is sharp; the admin is rounded and modern.
export const RADIUS = 8;
export const RADIUS_SM = 6;

// Soft, cool-tinted elevation so panels read as surfaces, not outlined boxes.
export const ELEVATION = "0 1px 2px rgba(15,23,42,0.04), 0 4px 14px rgba(15,23,42,0.06)";
