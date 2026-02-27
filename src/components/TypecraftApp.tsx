"use client";
import { useEffect } from "react";
import { contrastRatio } from "@/lib/data";
import { useTypecraftStore } from "@/lib/useTypecraftStore";
import { useFontLoader } from "@/lib/useFontLoader";
import Sidebar from "@/components/Sidebar";
import { SpecimenPanel, LandingPanel, CardPanel, CombosPanel } from "@/components/PreviewPanels";

const VIEWS = [
  { id: "specimen", label: "Type Specimen" },
  { id: "landing", label: "Landing Page" },
  { id: "card", label: "Brand Card" },
  { id: "combos", label: "Color Combos" },
] as const;

export default function TypecraftApp() {
  const { state, update, randomPairing } = useTypecraftStore();
  const { loadFont } = useFontLoader();

  // Load initial fonts
  useEffect(() => {
    loadFont(state.headingFont);
    loadFont(state.bodyFont);
  }, []);

  const getContrastInfo = () => {
    try {
      const ratio = contrastRatio(state.theme.bg, state.theme.text);
      if (ratio >= 7) return { cls: "contrast-pass", label: `AAA ${ratio.toFixed(1)}:1` };
      if (ratio >= 4.5) return { cls: "contrast-pass", label: `AA ${ratio.toFixed(1)}:1` };
      if (ratio >= 3) return { cls: "contrast-warn", label: `AA Large ${ratio.toFixed(1)}:1` };
      return { cls: "contrast-fail", label: `Fail ${ratio.toFixed(1)}:1` };
    } catch { return { cls: "contrast-warn", label: "?" }; }
  };

  const contrast = getContrastInfo();

  const copyCSS = async () => {
    const css = `/* Typecraft Export */
:root {
  --heading-font: '${state.headingFont}', serif;
  --body-font: '${state.bodyFont}', sans-serif;
  --heading-size: ${state.headingSize}px;
  --body-size: ${state.bodySize}px;
  --heading-spacing: ${state.headingSpacing}px;
  --line-height: ${state.lineHeight};
  --heading-weight: ${state.headingWeight};
  --color-bg: ${state.theme.bg};
  --color-text: ${state.theme.text};
  --color-accent: ${state.theme.accent};
  --color-secondary: ${state.theme.secondary};
}

h1, h2, h3 {
  font-family: var(--heading-font);
  font-weight: var(--heading-weight);
  letter-spacing: var(--heading-spacing);
}

body, p {
  font-family: var(--body-font);
  font-size: var(--body-size);
  line-height: var(--line-height);
}`;
    await navigator.clipboard.writeText(css);
  };

  const exportConfig = () => {
    const config = {
      fonts: { heading: state.headingFont, body: state.bodyFont },
      typography: {
        headingSize: state.headingSize,
        bodySize: state.bodySize,
        headingSpacing: state.headingSpacing,
        lineHeight: state.lineHeight,
        headingWeight: state.headingWeight,
      },
      colors: state.theme,
      googleFontsUrl: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(state.headingFont)}:wght@400;700;900&family=${encodeURIComponent(state.bodyFont)}:wght@400;500;700&display=swap`,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "typecraft-config.json";
    a.click();
  };

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <span className="logo-mark">Typecraft</span>
          <span className="logo-sub">Font Pairing Studio</span>
        </div>
        <div className="header-actions">
          <span className="contrast-badge">
            <span className={`contrast-dot ${contrast.cls}`} />
            <span>{contrast.label}</span>
          </span>
          <button className="btn" onClick={copyCSS}>Copy CSS</button>
          <button className="btn primary" onClick={exportConfig}>Export Config</button>
        </div>
      </header>

      {/* APP BODY */}
      <div className="app">
        <Sidebar
          state={state}
          onUpdate={update}
          onRandomPairing={randomPairing}
          onLoadFont={loadFont}
        />

        <div className="preview-area">
          {/* VIEW TABS */}
          <div className="view-tabs">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={`view-tab ${state.currentView === v.id ? "active" : ""}`}
                onClick={() => update({ currentView: v.id })}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* PREVIEW CANVAS */}
          <div className="preview-canvas">
            {state.currentView === "specimen" && <SpecimenPanel state={state} />}
            {state.currentView === "landing" && <LandingPanel state={state} />}
            {state.currentView === "card" && <CardPanel state={state} />}
            {state.currentView === "combos" && <CombosPanel state={state} />}
          </div>
        </div>
      </div>
    </>
  );
}
