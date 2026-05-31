import { ALL_FONTS, contrastRatio } from "@/lib/data";
import type { ExportProfile, ProjectV1, ValidationIssue } from "@/lib/types";

type ExportTokens = {
  typography: {
    headingSize: string;
    bodySize: string;
    headingSpacing: string;
    lineHeight: number;
    headingWeight: number;
  };
  color: {
    bg: string;
    text: string;
    accent: string;
    secondary: string;
  };
  font: {
    heading: string;
    body: string;
    headingFallback: string;
    bodyFallback: string;
  };
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function generateExport(project: ProjectV1, profile: ExportProfile): string {
  const tokens = getTokens(project);

  if (profile === "tokens-json") {
    return JSON.stringify(
      {
        version: 1,
        namespace: "tc",
        tokens,
      },
      null,
      2,
    );
  }

  if (profile === "css-classes") {
    return [
      "/* Typecraft utility classes */",
      ".tc-heading {",
      `  font-family: ${tokens.font.heading}, ${tokens.font.headingFallback};`,
      `  font-size: ${tokens.typography.headingSize};`,
      `  letter-spacing: ${tokens.typography.headingSpacing};`,
      `  font-weight: ${tokens.typography.headingWeight};`,
      "}",
      ".tc-body {",
      `  font-family: ${tokens.font.body}, ${tokens.font.bodyFallback};`,
      `  font-size: ${tokens.typography.bodySize};`,
      `  line-height: ${tokens.typography.lineHeight};`,
      "}",
      ".tc-theme {",
      `  background: ${tokens.color.bg};`,
      `  color: ${tokens.color.text};`,
      "}",
      ".tc-accent {",
      `  color: ${tokens.color.accent};`,
      "}",
    ].join("\n");
  }

  return [
    "/* Typecraft CSS variables */",
    ":root {",
    `  --tc-font-heading: ${tokens.font.heading}, ${tokens.font.headingFallback};`,
    `  --tc-font-body: ${tokens.font.body}, ${tokens.font.bodyFallback};`,
    `  --tc-typography-heading-size: ${tokens.typography.headingSize};`,
    `  --tc-typography-body-size: ${tokens.typography.bodySize};`,
    `  --tc-typography-heading-spacing: ${tokens.typography.headingSpacing};`,
    `  --tc-typography-line-height: ${tokens.typography.lineHeight};`,
    `  --tc-typography-heading-weight: ${tokens.typography.headingWeight};`,
    `  --tc-color-bg: ${tokens.color.bg};`,
    `  --tc-color-text: ${tokens.color.text};`,
    `  --tc-color-accent: ${tokens.color.accent};`,
    `  --tc-color-secondary: ${tokens.color.secondary};`,
    "}",
  ].join("\n");
}

export function validateProject(project: ProjectV1): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { snapshot } = project;
  const knownFonts = new Set([
    ...ALL_FONTS.map((f) => f.name),
    ...snapshot.customFonts,
  ]);

  if (!knownFonts.has(snapshot.headingFont)) {
    issues.push({
      level: "warning",
      code: "unknown_heading_font",
      message: `Heading font "${snapshot.headingFont}" is not in the catalog.`,
    });
  }
  if (!knownFonts.has(snapshot.bodyFont)) {
    issues.push({
      level: "warning",
      code: "unknown_body_font",
      message: `Body font "${snapshot.bodyFont}" is not in the catalog.`,
    });
  }

  for (const [key, value] of Object.entries({
    bg: snapshot.theme.bg,
    text: snapshot.theme.text,
    accent: snapshot.theme.accent,
    secondary: snapshot.theme.secondary,
  })) {
    if (!HEX_COLOR.test(value)) {
      issues.push({
        level: "error",
        code: `invalid_${key}_color`,
        message: `Theme color "${key}" is invalid: ${value}`,
      });
    }
  }

  if (snapshot.bodySize <= 0 || snapshot.headingSize <= 0 || snapshot.lineHeight <= 0) {
    issues.push({
      level: "error",
      code: "invalid_typography_scale",
      message: "Typography settings contain non-positive values.",
    });
  }

  if (snapshot.bodySize > snapshot.headingSize) {
    issues.push({
      level: "warning",
      code: "body_larger_than_heading",
      message: "Body size is larger than heading size.",
    });
  }

  const ratio = contrastRatio(snapshot.theme.bg, snapshot.theme.text);
  if (ratio < 4.5) {
    issues.push({
      level: "warning",
      code: "low_contrast",
      message: `Contrast ratio is ${ratio.toFixed(1)}:1, below AA for normal text.`,
    });
  }

  return issues;
}

function getTokens(project: ProjectV1): ExportTokens {
  const { snapshot } = project;
  return {
    typography: {
      headingSize: `${snapshot.headingSize}px`,
      bodySize: `${snapshot.bodySize}px`,
      headingSpacing: `${snapshot.headingSpacing}px`,
      lineHeight: snapshot.lineHeight,
      headingWeight: snapshot.headingWeight,
    },
    color: {
      bg: snapshot.theme.bg,
      text: snapshot.theme.text,
      accent: snapshot.theme.accent,
      secondary: snapshot.theme.secondary,
    },
    font: {
      heading: quoteFont(snapshot.headingFont),
      body: quoteFont(snapshot.bodyFont),
      headingFallback: getFallback(snapshot.headingFont),
      bodyFallback: getFallback(snapshot.bodyFont),
    },
  };
}

function quoteFont(font: string) {
  return `'${font}'`;
}

function getFallback(font: string) {
  const lower = font.toLowerCase();
  if (lower.includes("mono") || lower.includes("code")) return "monospace";
  if (lower.includes("serif")) return "serif";
  return "sans-serif";
}
