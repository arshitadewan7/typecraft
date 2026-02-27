export const GOOGLE_FONTS = [
  { name: "Playfair Display", category: "Serif", weights: [400, 600, 700, 900] },
  { name: "Lora", category: "Serif", weights: [400, 500, 600, 700] },
  { name: "Cormorant Garamond", category: "Serif", weights: [300, 400, 500, 600, 700] },
  { name: "Libre Baskerville", category: "Serif", weights: [400, 700] },
  { name: "EB Garamond", category: "Serif", weights: [400, 500, 600, 700, 800] },
  { name: "Crimson Text", category: "Serif", weights: [400, 600, 700] },
  { name: "Merriweather", category: "Serif", weights: [300, 400, 700, 900] },
  { name: "PT Serif", category: "Serif", weights: [400, 700] },
  { name: "Noto Serif", category: "Serif", weights: [400, 700] },
  { name: "DM Serif Display", category: "Serif", weights: [400] },
  { name: "Abril Fatface", category: "Display", weights: [400] },
  { name: "Bebas Neue", category: "Display", weights: [400] },
  { name: "Anton", category: "Display", weights: [400] },
  { name: "Oswald", category: "Sans-Serif", weights: [200, 300, 400, 500, 600, 700] },
  { name: "Raleway", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Montserrat", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Poppins", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Nunito", category: "Sans-Serif", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "DM Sans", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Plus Jakarta Sans", category: "Sans-Serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Outfit", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Syne", category: "Sans-Serif", weights: [400, 500, 600, 700, 800] },
  { name: "Manrope", category: "Sans-Serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Karla", category: "Sans-Serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Jost", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Barlow", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Work Sans", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Figtree", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "IBM Plex Sans", category: "Sans-Serif", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Rubik", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Oxanium", category: "Display", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Yeseva One", category: "Display", weights: [400] },
  { name: "Righteous", category: "Display", weights: [400] },
  { name: "Pacifico", category: "Handwriting", weights: [400] },
  { name: "Dancing Script", category: "Handwriting", weights: [400, 500, 600, 700] },
  { name: "Satisfy", category: "Handwriting", weights: [400] },
  { name: "Great Vibes", category: "Handwriting", weights: [400] },
  { name: "IBM Plex Mono", category: "Monospace", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Fira Code", category: "Monospace", weights: [300, 400, 500, 600, 700] },
  { name: "Source Code Pro", category: "Monospace", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Space Mono", category: "Monospace", weights: [400, 700] },
];

export const SYSTEM_FONTS = [
  { name: "Georgia", category: "System Serif", weights: [400, 700] },
  { name: "Times New Roman", category: "System Serif", weights: [400, 700] },
  { name: "Helvetica Neue", category: "System Sans", weights: [100, 300, 400, 500, 700, 900] },
  { name: "Arial", category: "System Sans", weights: [400, 700] },
  { name: "Verdana", category: "System Sans", weights: [400, 700] },
  { name: "Trebuchet MS", category: "System Sans", weights: [400, 700] },
  { name: "Courier New", category: "System Mono", weights: [400, 700] },
  { name: "Palatino", category: "System Serif", weights: [400, 700] },
];

export const ALL_FONTS = [...GOOGLE_FONTS, ...SYSTEM_FONTS];

export const CURATED_PAIRINGS = [
  { heading: "Playfair Display", body: "DM Sans", label: "Editorial" },
  { heading: "Cormorant Garamond", body: "Karla", label: "Luxury" },
  { heading: "Bebas Neue", body: "Barlow", label: "Modern Bold" },
  { heading: "Abril Fatface", body: "Lato", label: "Fashion" },
  { heading: "Oswald", body: "Merriweather", label: "News" },
  { heading: "Syne", body: "Manrope", label: "Tech" },
  { heading: "EB Garamond", body: "IBM Plex Sans", label: "Academic" },
  { heading: "Yeseva One", body: "Jost", label: "Creative" },
  { heading: "DM Serif Display", body: "Plus Jakarta Sans", label: "Startup" },
];

export const THEMES = [
  { name: "Obsidian", bg: "#0e0e0f", text: "#f0ede8", accent: "#e8d5b0", secondary: "#c4a882" },
  { name: "Arctic", bg: "#f5f7fa", text: "#1a1a2e", accent: "#2d4ef5", secondary: "#6b7fff" },
  { name: "Forest", bg: "#1a2420", text: "#e8f0eb", accent: "#6fcf97", secondary: "#27ae60" },
  { name: "Rose", bg: "#fff5f5", text: "#2d1515", accent: "#e05c5c", secondary: "#f08080" },
  { name: "Midnight", bg: "#0d1117", text: "#c9d1d9", accent: "#58a6ff", secondary: "#79c0ff" },
  { name: "Sand", bg: "#faf7f0", text: "#3d2b1f", accent: "#b8834a", secondary: "#d4a574" },
  { name: "Ink", bg: "#1c1c2e", text: "#e0e0ff", accent: "#a87ce0", secondary: "#7c56c9" },
  { name: "Ivory", bg: "#fefef8", text: "#2c2c20", accent: "#5c5c3d", secondary: "#8c8c5d" },
];

export const COLOR_COMBOS = [
  { bg: "#0e0e0f", text: "#f0ede8", accent: "#e8d5b0", label: "Dark / Cream" },
  { bg: "#f5f7fa", text: "#1a1a2e", accent: "#2d4ef5", label: "Light / Blue" },
  { bg: "#1a2420", text: "#e8f0eb", accent: "#6fcf97", label: "Dark / Green" },
  { bg: "#faf7f0", text: "#3d2b1f", accent: "#b8834a", label: "Warm / Sand" },
  { bg: "#0d1117", text: "#c9d1d9", accent: "#58a6ff", label: "Dark / Neon" },
  { bg: "#1c1c2e", text: "#e0e0ff", accent: "#a87ce0", label: "Dark / Purple" },
  { bg: "#fff5f5", text: "#2d1515", accent: "#e05c5c", label: "Light / Red" },
  { bg: "#fefef8", text: "#2c2c20", accent: "#5c5c3d", label: "Ivory / Olive" },
];

export type FontDef = { name: string; category: string; weights: number[] };
export type Theme = { name: string; bg: string; text: string; accent: string; secondary: string };
export type Pairing = { heading: string; body: string; label: string };

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
