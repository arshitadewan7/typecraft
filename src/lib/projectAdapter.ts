import { THEMES } from "@/lib/data";
import {
  DEFAULT_PROJECT_NAME,
  PROJECT_SCHEMA_VERSION,
  type ProjectSnapshot,
  type ProjectV1,
  type TypographyState,
} from "@/lib/types";

export const DEFAULT_TYPOGRAPHY_STATE: TypographyState = {
  headingFont: "Garamond Premier Roman",
  bodyFont: "Garamond Premier Roman",
  headingSize: 52,
  bodySize: 16,
  headingSpacing: -1,
  lineHeight: 1.7,
  headingWeight: 700,
  theme: THEMES[0],
  activeSlot: "heading",
  currentView: "specimen",
  customFonts: [],
};

export function stateToProjectSnapshot(state: TypographyState): ProjectSnapshot {
  return {
    headingFont: state.headingFont,
    bodyFont: state.bodyFont,
    headingSize: state.headingSize,
    bodySize: state.bodySize,
    headingSpacing: state.headingSpacing,
    lineHeight: state.lineHeight,
    headingWeight: state.headingWeight,
    theme: state.theme,
    currentView: state.currentView,
    customFonts: state.customFonts,
  };
}

export function projectSnapshotToState(snapshot: ProjectSnapshot): TypographyState {
  return {
    ...DEFAULT_TYPOGRAPHY_STATE,
    ...snapshot,
  };
}

export function createProjectFromState(
  state: TypographyState,
  name = DEFAULT_PROJECT_NAME,
  id = createId(),
): ProjectV1 {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id,
    name,
    updatedAt: new Date().toISOString(),
    snapshot: stateToProjectSnapshot(state),
  };
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
