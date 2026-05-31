import type { Theme } from "@/lib/data";

export type ActiveSlot = "heading" | "body";
export type CurrentView = "specimen" | "landing" | "card" | "combos" | "community";
export type SaveStatus = "saved" | "unsaved" | "autosaved";
export type SchemaVersion = 1;

export const PROJECT_SCHEMA_VERSION: SchemaVersion = 1;
export const DEFAULT_PROJECT_NAME = "Untitled Project";

export type TypographyState = {
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  headingSpacing: number;
  lineHeight: number;
  headingWeight: number;
  bodyWeight: number;
  headingItalic: boolean;
  bodyItalic: boolean;
  theme: Theme;
  activeSlot: ActiveSlot;
  currentView: CurrentView;
  customFonts: string[];
};

export type ProjectSnapshot = {
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  headingSpacing: number;
  lineHeight: number;
  headingWeight: number;
  bodyWeight: number;
  headingItalic: boolean;
  bodyItalic: boolean;
  theme: Theme;
  currentView: CurrentView;
  customFonts: string[];
};

export type ProjectV1 = {
  schemaVersion: SchemaVersion;
  id: string;
  name: string;
  updatedAt: string;
  snapshot: ProjectSnapshot;
};

export type ProjectMeta = Pick<ProjectV1, "id" | "name" | "updatedAt">;

export type ExportProfile = "css-vars" | "tokens-json" | "css-classes";

export type ValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};
