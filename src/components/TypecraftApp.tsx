"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_FONTS, contrastRatio } from "@/lib/data";
import { generateExport, validateProject } from "@/lib/exportEngine";
import { stateToProjectSnapshot } from "@/lib/projectAdapter";
import { useTypecraftStore } from "@/lib/useTypecraftStore";
import { useFontLoader } from "@/lib/useFontLoader";
import type { ExportProfile } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import { SpecimenPanel, LandingPanel, CardPanel, CombosPanel } from "@/components/PreviewPanels";
import SocialHub from "@/components/SocialHub";

const VIEWS = [
  { id: "specimen", label: "Type Specimen" },
  { id: "landing", label: "Landing Page" },
  { id: "card", label: "Brand Card" },
  { id: "combos", label: "Color Combos" },
  { id: "community", label: "Community" },
] as const;

const EXPORT_PROFILES: Array<{ id: ExportProfile; label: string }> = [
  { id: "css-vars", label: "CSS Variables" },
  { id: "tokens-json", label: "Tokens JSON" },
  { id: "css-classes", label: "CSS Classes" },
];

export default function TypecraftApp() {
  const {
    state,
    update,
    randomPairing,
    projects,
    currentProjectId,
    currentProjectName,
    saveStatus,
    error,
    currentProject,
    clearError,
    openProject,
    createNewProject,
    renameCurrentProject,
    duplicateCurrentProject,
    deleteCurrentProject,
    saveCurrentProject,
    exportCurrentProject,
    importProjectFromText,
    hydrated,
  } = useTypecraftStore();

  const { loadFont } = useFontLoader();
  const [exportProfile, setExportProfile] = useState<ExportProfile>("css-vars");
  const [showExportPanel, setShowExportPanel] = useState(false);
  const importProjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    loadFont(state.headingFont);
    loadFont(state.bodyFont);
  }, [hydrated, loadFont, state.bodyFont, state.headingFont]);

  const handleRandomPairing = () => {
    const { headingFont, bodyFont } = randomPairing();
    loadFont(headingFont);
    loadFont(bodyFont);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        saveCurrentProject();
      } else if (key === "n") {
        e.preventDefault();
        createNewProject();
      } else if (key === "e") {
        e.preventDefault();
        setShowExportPanel((prev) => !prev);
      } else if (key === "o") {
        e.preventDefault();
        importProjectRef.current?.click();
      } else if (key === "r") {
        e.preventDefault();
        handleRandomPairing();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createNewProject, saveCurrentProject]);

  const quality = useMemo(() => {
    const ratio = contrastRatio(state.theme.bg, state.theme.text);
    const contrastLabel = ratio >= 7 ? `Contrast AAA ${ratio.toFixed(1)}:1` : ratio >= 4.5 ? `Contrast AA ${ratio.toFixed(1)}:1` : `Contrast Low ${ratio.toFixed(1)}:1`;
    const contrastClass = ratio >= 4.5 ? "contrast-pass" : ratio >= 3 ? "contrast-warn" : "contrast-fail";

    const scaleRatio = state.headingSize / Math.max(state.bodySize, 1);
    const scaleLabel = scaleRatio >= 1.8 ? `Scale Good ${scaleRatio.toFixed(2)}x` : scaleRatio >= 1.4 ? `Scale Moderate ${scaleRatio.toFixed(2)}x` : `Scale Tight ${scaleRatio.toFixed(2)}x`;
    const scaleClass = scaleRatio >= 1.8 ? "contrast-pass" : scaleRatio >= 1.4 ? "contrast-warn" : "contrast-fail";

    const knownFonts = new Set([...ALL_FONTS.map((f) => f.name), ...state.customFonts]);
    const warnings: string[] = [];
    if (!knownFonts.has(state.headingFont)) warnings.push(`Unknown heading font: ${state.headingFont}`);
    if (!knownFonts.has(state.bodyFont)) warnings.push(`Unknown body font: ${state.bodyFont}`);

    return { contrastLabel, contrastClass, scaleLabel, scaleClass, warnings };
  }, [state]);

  const currentSnapshot = useMemo(() => stateToProjectSnapshot(state), [state]);

  const exportIssues = useMemo(() => (currentProject ? validateProject(currentProject) : []), [currentProject]);
  const hasExportError = exportIssues.some((issue) => issue.level === "error");
  const exportPreview = useMemo(() => {
    if (!currentProject) return "";
    return generateExport(currentProject, exportProfile);
  }, [currentProject, exportProfile]);

  const copyExport = async () => {
    if (hasExportError || !exportPreview) return;
    try {
      await navigator.clipboard.writeText(exportPreview);
    } catch {
      // clipboard errors are surfaced as a global banner for consistency
    }
  };

  const downloadText = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const downloadExport = () => {
    if (!exportPreview || hasExportError) return;
    const extension = exportProfile === "tokens-json" ? "json" : "css";
    const mime = exportProfile === "tokens-json" ? "application/json" : "text/css";
    downloadText(`typecraft-${exportProfile}.${extension}`, exportPreview, mime);
  };

  const downloadProjectJson = () => {
    const json = exportCurrentProject();
    if (!json) return;
    downloadText("typecraft-project.json", json, "application/json");
  };

  const handleImportProject: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      importProjectFromText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="logo">
          <span className="logo-mark">Typecraft</span>
          <span className="logo-sub">Production Typography Workspace</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            className="font-search"
            style={{ width: 220 }}
            value={currentProjectName}
            onChange={(e) => renameCurrentProject(e.target.value)}
            aria-label="Project name"
          />
          <select
            className="font-search"
            style={{ width: 170 }}
            value={currentProjectId}
            onChange={(e) => openProject(e.target.value)}
            aria-label="Recent projects"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <span className="contrast-badge">
            <span className={`contrast-dot ${saveStatus === "saved" ? "contrast-pass" : saveStatus === "autosaved" ? "contrast-warn" : "contrast-fail"}`} />
            <span>{saveStatus.toUpperCase()}</span>
          </span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={createNewProject}>New</button>
          <button className="btn" onClick={duplicateCurrentProject}>Duplicate</button>
          <button className="btn" onClick={deleteCurrentProject}>Delete</button>
          <button className="btn" onClick={saveCurrentProject}>Save</button>
          <button className="btn" onClick={downloadProjectJson}>Export Project</button>
          <button className="btn" onClick={() => importProjectRef.current?.click()}>Import Project</button>
          <input ref={importProjectRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportProject} />
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="btn" onClick={clearError}>Dismiss</button>
        </div>
      )}

      <div className="shortcut-row">
        <span>`Cmd/Ctrl+S` Save</span>
        <span>`Cmd/Ctrl+N` New</span>
        <span>`Cmd/Ctrl+O` Import</span>
        <span>`Cmd/Ctrl+E` Toggle Export</span>
        <span>`Cmd/Ctrl+R` Random Pairing</span>
      </div>

      <div className="app">
        <Sidebar
          state={state}
          onUpdate={update}
          onRandomPairing={handleRandomPairing}
          onLoadFont={loadFont}
          quality={quality}
        />

        <div className="preview-area">
          <div className="view-tabs">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                className={`view-tab ${state.currentView === view.id ? "active" : ""}`}
                onClick={() => update({ currentView: view.id })}
              >
                {view.label}
              </button>
            ))}
            <button className={`view-tab ${showExportPanel ? "active" : ""}`} onClick={() => setShowExportPanel((prev) => !prev)}>
              Export
            </button>
          </div>

          {showExportPanel && (
            <div className="export-panel fade-in">
              <div className="export-top">
                <div className="toggle-row">
                  {EXPORT_PROFILES.map((profile) => (
                    <div
                      key={profile.id}
                      className={`toggle-option ${exportProfile === profile.id ? "active" : ""}`}
                      onClick={() => setExportProfile(profile.id)}
                    >
                      {profile.label}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={copyExport} disabled={hasExportError}>Copy</button>
                  <button className="btn primary" onClick={downloadExport} disabled={hasExportError}>Download</button>
                </div>
              </div>
              <div className="export-issues">
                {exportIssues.length === 0 && <span className="contrast-badge"><span className="contrast-dot contrast-pass" />Ready for export</span>}
                {exportIssues.map((issue) => (
                  <span className="contrast-badge" key={`${issue.code}-${issue.message}`}>
                    <span className={`contrast-dot ${issue.level === "error" ? "contrast-fail" : "contrast-warn"}`} />
                    {issue.message}
                  </span>
                ))}
              </div>
              <textarea className="export-preview" value={exportPreview} readOnly />
            </div>
          )}

          <div className="preview-canvas">
            {state.currentView === "specimen" && <SpecimenPanel state={state} />}
            {state.currentView === "landing" && <LandingPanel state={state} />}
            {state.currentView === "card" && <CardPanel state={state} />}
            {state.currentView === "combos" && <CombosPanel state={state} />}
            {state.currentView === "community" && (
              <SocialHub
                currentSnapshot={currentSnapshot}
                onApplyPairing={(snapshot) => update({ ...snapshot, currentView: "specimen" })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
