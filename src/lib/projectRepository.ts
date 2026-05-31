import { DEFAULT_TYPOGRAPHY_STATE, createProjectFromState, projectSnapshotToState } from "@/lib/projectAdapter";
import { THEMES } from "@/lib/data";
import {
  DEFAULT_PROJECT_NAME,
  PROJECT_SCHEMA_VERSION,
  type ProjectMeta,
  type ProjectSnapshot,
  type ProjectV1,
  type TypographyState,
} from "@/lib/types";

const PROJECTS_KEY = "typecraft.projects.v1";
const LAST_OPENED_KEY = "typecraft.lastOpenedProjectId";

type LegacyConfig = {
  fonts?: { heading?: string; body?: string };
  typography?: {
    headingSize?: number;
    bodySize?: number;
    headingSpacing?: number;
    lineHeight?: number;
    headingWeight?: number;
  };
  colors?: {
    bg?: string;
    text?: string;
    accent?: string;
    secondary?: string;
    name?: string;
  };
};

export function listProjects(): ProjectV1[] {
  const projects = readProjects();
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listProjectMeta(): ProjectMeta[] {
  return listProjects().map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
}

export function getProject(id: string): ProjectV1 | null {
  return readProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: ProjectV1): ProjectV1 {
  const projects = readProjects();
  const next: ProjectV1 = {
    ...project,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const idx = projects.findIndex((p) => p.id === next.id);
  if (idx >= 0) projects[idx] = next;
  else projects.push(next);
  writeProjects(projects);
  setLastOpenedProjectId(next.id);
  return next;
}

export function deleteProject(id: string): boolean {
  const projects = readProjects();
  const next = projects.filter((p) => p.id !== id);
  const changed = next.length !== projects.length;
  if (!changed) return false;
  writeProjects(next);
  const lastOpened = getLastOpenedProjectId();
  if (lastOpened === id) setLastOpenedProjectId(next[0]?.id ?? "");
  return true;
}

export function duplicateProject(id: string, nextName?: string): ProjectV1 | null {
  const src = getProject(id);
  if (!src) return null;
  const state = projectSnapshotToState(src.snapshot);
  const duplicate = createProjectFromState(state, nextName ?? `${src.name} Copy`);
  return saveProject(duplicate);
}

export function getLastOpenedProjectId(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(LAST_OPENED_KEY);
  return raw && raw.trim().length > 0 ? raw : null;
}

export function setLastOpenedProjectId(id: string) {
  const storage = getStorage();
  if (!storage) return;
  if (id) storage.setItem(LAST_OPENED_KEY, id);
  else storage.removeItem(LAST_OPENED_KEY);
}

export function exportProjectJson(project: ProjectV1) {
  return JSON.stringify(project, null, 2);
}

export function importProjectJson(raw: string): { project: ProjectV1 | null; error: string | null } {
  try {
    const parsed = JSON.parse(raw);
    const migrated = migrateToProjectV1(parsed);
    if (!migrated) return { project: null, error: "Unsupported project schema" };
    const imported = saveProject({
      ...migrated,
      id: createProjectFromState(DEFAULT_TYPOGRAPHY_STATE).id,
      name: migrated.name || `Imported ${DEFAULT_PROJECT_NAME}`,
      updatedAt: new Date().toISOString(),
    });
    return { project: imported, error: null };
  } catch {
    return { project: null, error: "Invalid JSON file" };
  }
}

function readProjects(): ProjectV1[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed
      .map((item) => migrateToProjectV1(item))
      .filter((item): item is ProjectV1 => Boolean(item));
    return uniqById(migrated);
  } catch {
    return [];
  }
}

function writeProjects(projects: ProjectV1[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function migrateToProjectV1(input: unknown): ProjectV1 | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Partial<ProjectV1>;
  if (x.schemaVersion === PROJECT_SCHEMA_VERSION && isValidProject(x)) {
    return x as ProjectV1;
  }

  const legacy = input as LegacyConfig;
  if (!legacy.fonts && !legacy.typography && !legacy.colors) return null;

  const fallbackState: TypographyState = DEFAULT_TYPOGRAPHY_STATE;
  const theme = {
    ...THEMES[0],
    ...legacy.colors,
    name: legacy.colors?.name || "Imported",
  };

  const snapshot: ProjectSnapshot = {
    headingFont: legacy.fonts?.heading || fallbackState.headingFont,
    bodyFont: legacy.fonts?.body || fallbackState.bodyFont,
    headingSize: legacy.typography?.headingSize || fallbackState.headingSize,
    bodySize: legacy.typography?.bodySize || fallbackState.bodySize,
    headingSpacing: legacy.typography?.headingSpacing || fallbackState.headingSpacing,
    lineHeight: legacy.typography?.lineHeight || fallbackState.lineHeight,
    headingWeight: legacy.typography?.headingWeight || fallbackState.headingWeight,
    theme,
    currentView: "specimen",
    customFonts: [],
  };

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: createProjectFromState(DEFAULT_TYPOGRAPHY_STATE).id,
    name: "Imported Project",
    updatedAt: new Date().toISOString(),
    snapshot,
  };
}

function isValidProject(input: Partial<ProjectV1>): input is ProjectV1 {
  return Boolean(
    input.id &&
      input.name &&
      input.updatedAt &&
      input.snapshot &&
      typeof input.snapshot === "object" &&
      typeof (input.snapshot as ProjectSnapshot).headingFont === "string",
  );
}

function uniqById(projects: ProjectV1[]) {
  const map = new Map<string, ProjectV1>();
  for (const project of projects) map.set(project.id, project);
  return Array.from(map.values());
}

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
