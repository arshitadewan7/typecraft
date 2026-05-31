"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_FONTS } from "@/lib/data";
import { DEFAULT_TYPOGRAPHY_STATE, createProjectFromState, projectSnapshotToState } from "@/lib/projectAdapter";
import {
  deleteProject,
  duplicateProject,
  exportProjectJson,
  getLastOpenedProjectId,
  importProjectJson,
  listProjectMeta,
  listProjects,
  saveProject,
  setLastOpenedProjectId,
} from "@/lib/projectRepository";
import type { ProjectMeta, SaveStatus, TypographyState } from "@/lib/types";

type PersistMode = "saved" | "autosaved";

export function useTypecraftStore() {
  const [state, setState] = useState<TypographyState>(DEFAULT_TYPOGRAPHY_STATE);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const suspendAutosaveRef = useRef(false);

  const refreshProjectMeta = useCallback(() => {
    setProjects(listProjectMeta());
  }, []);

  const applyProject = useCallback((projectId: string) => {
    const project = listProjects().find((p) => p.id === projectId);
    if (!project) return;
    suspendAutosaveRef.current = true;
    setState(projectSnapshotToState(project.snapshot));
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setSaveStatus("saved");
    setDirty(false);
    setLastOpenedProjectId(project.id);
    setTimeout(() => {
      suspendAutosaveRef.current = false;
    }, 0);
  }, []);

  const persistCurrent = useCallback(
    (mode: PersistMode) => {
      if (!currentProjectId) return;
      const next = saveProject(createProjectFromState(state, currentProjectName || "Untitled Project", currentProjectId));
      setCurrentProjectName(next.name);
      setSaveStatus(mode);
      refreshProjectMeta();
    },
    [currentProjectId, currentProjectName, refreshProjectMeta, state],
  );

  useEffect(() => {
    const allProjects = listProjects();
    if (allProjects.length === 0) {
      const created = saveProject(createProjectFromState(DEFAULT_TYPOGRAPHY_STATE));
      setState(projectSnapshotToState(created.snapshot));
      setCurrentProjectId(created.id);
      setCurrentProjectName(created.name);
      refreshProjectMeta();
      setHydrated(true);
      return;
    }

    const lastOpenedId = getLastOpenedProjectId();
    const initial = allProjects.find((p) => p.id === lastOpenedId) ?? allProjects[0];
    setState(projectSnapshotToState(initial.snapshot));
    setCurrentProjectId(initial.id);
    setCurrentProjectName(initial.name);
    refreshProjectMeta();
    setLastOpenedProjectId(initial.id);
    setHydrated(true);
  }, [refreshProjectMeta]);

  useEffect(() => {
    if (!hydrated || !dirty || !currentProjectId || suspendAutosaveRef.current) return;
    setSaveStatus("unsaved");
    const timeout = setTimeout(() => {
      persistCurrent("autosaved");
      setDirty(false);
    }, 700);
    return () => clearTimeout(timeout);
  }, [currentProjectId, dirty, hydrated, persistCurrent]);

  const update = useCallback((patch: Partial<TypographyState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const randomPairing = useCallback(() => {
    const headings = ALL_FONTS.filter((f) =>
      ["Serif", "Display", "Handwriting", "System Serif"].includes(f.category),
    );
    const bodies = ALL_FONTS.filter((f) =>
      ["Sans-Serif", "Serif", "Monospace", "System Sans", "System Serif", "System Mono"].includes(f.category),
    );
    const h = headings[Math.floor(Math.random() * headings.length)];
    const b = bodies[Math.floor(Math.random() * bodies.length)];
    setState((prev) => ({ ...prev, headingFont: h.name, bodyFont: b.name }));
    setDirty(true);
    return { headingFont: h.name, bodyFont: b.name };
  }, []);

  const createNewProject = useCallback(() => {
    const untitledCount = projects.filter((p) => p.name.startsWith("Untitled Project")).length;
    const name = untitledCount === 0 ? "Untitled Project" : `Untitled Project ${untitledCount + 1}`;
    const created = saveProject(createProjectFromState(DEFAULT_TYPOGRAPHY_STATE, name));
    refreshProjectMeta();
    applyProject(created.id);
  }, [applyProject, projects, refreshProjectMeta]);

  const openProject = useCallback(
    (id: string) => {
      applyProject(id);
    },
    [applyProject],
  );

  const renameCurrentProject = useCallback((name: string) => {
    setCurrentProjectName(name);
    setDirty(true);
  }, []);

  const duplicateCurrentProject = useCallback(() => {
    if (!currentProjectId) return;
    const duplicate = duplicateProject(currentProjectId, `${currentProjectName} Copy`);
    refreshProjectMeta();
    if (duplicate) applyProject(duplicate.id);
  }, [applyProject, currentProjectId, currentProjectName, refreshProjectMeta]);

  const deleteCurrentProject = useCallback(() => {
    if (!currentProjectId) return;
    deleteProject(currentProjectId);
    refreshProjectMeta();
    const remaining = listProjects();
    if (remaining.length > 0) {
      applyProject(remaining[0].id);
      return;
    }
    createNewProject();
  }, [applyProject, createNewProject, currentProjectId, refreshProjectMeta]);

  const saveCurrentProject = useCallback(() => {
    persistCurrent("saved");
    setDirty(false);
  }, [persistCurrent]);

  const exportCurrentProject = useCallback(() => {
    if (!currentProjectId) return null;
    const project = createProjectFromState(state, currentProjectName || "Untitled Project", currentProjectId);
    return exportProjectJson(project);
  }, [currentProjectId, currentProjectName, state]);

  const importProjectFromText = useCallback(
    (raw: string) => {
      const result = importProjectJson(raw);
      if (result.error || !result.project) {
        setError(result.error || "Unable to import project");
        return false;
      }
      refreshProjectMeta();
      applyProject(result.project.id);
      return true;
    },
    [applyProject, refreshProjectMeta],
  );

  const clearError = useCallback(() => setError(null), []);

  const currentProject = useMemo(
    () => (currentProjectId ? createProjectFromState(state, currentProjectName || "Untitled Project", currentProjectId) : null),
    [currentProjectId, currentProjectName, state],
  );

  return {
    state,
    update,
    randomPairing,
    projects,
    currentProjectId,
    currentProjectName,
    saveStatus,
    hydrated,
    error,
    currentProject,
    setError,
    clearError,
    openProject,
    createNewProject,
    renameCurrentProject,
    duplicateCurrentProject,
    deleteCurrentProject,
    saveCurrentProject,
    exportCurrentProject,
    importProjectFromText,
  };
}
