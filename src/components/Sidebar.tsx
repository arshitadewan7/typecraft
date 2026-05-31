"use client";
import { useMemo, useRef, useState } from "react";
import { ALL_FONTS, CURATED_PAIRINGS, THEMES, type Theme } from "@/lib/data";
import { identifyFontsFromImage, type FontIdentificationResult } from "@/lib/fontIdentifier";
import type { TypographyState } from "@/lib/types";

interface SidebarProps {
  state: TypographyState;
  onUpdate: (patch: Partial<TypographyState>) => void;
  onRandomPairing: () => void;
  onLoadFont: (name: string) => void;
  quality: {
    contrastLabel: string;
    contrastClass: string;
    scaleLabel: string;
    scaleClass: string;
    warnings: string[];
  };
}

export default function Sidebar({ state, onUpdate, onRandomPairing, onLoadFont, quality }: SidebarProps) {
  const [fontQuery, setFontQuery] = useState("");
  const [draggingIdentify, setDraggingIdentify] = useState(false);
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identifyResult, setIdentifyResult] = useState<FontIdentificationResult | null>(null);
  const identifyInputRef = useRef<HTMLInputElement>(null);

  const fontCatalog = useMemo(() => {
    const customFonts = state.customFonts.map((name) => ({ name, category: "Custom", weights: [400] }));
    const map = new Map<string, { name: string; category: string; weights: number[] }>();
    for (const font of [...ALL_FONTS, ...customFonts]) map.set(font.name, font);
    return Array.from(map.values());
  }, [state.customFonts]);

  const filteredFonts = useMemo(() => {
    const q = fontQuery.toLowerCase();
    return fontCatalog.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 60);
  }, [fontCatalog, fontQuery]);

  const selectFont = (name: string) => {
    onLoadFont(name);
    if (state.activeSlot === "heading") onUpdate({ headingFont: name });
    else onUpdate({ bodyFont: name });
  };

  const handleRandom = () => {
    onRandomPairing();
  };

  const handleCustomFont = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = "Custom: " + file.name.replace(/\.[^.]+$/, "");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const style = document.createElement("style");
      style.textContent = `@font-face { font-family: "${name}"; src: url("${ev.target?.result}"); }`;
      document.head.appendChild(style);
      const nextCustomFonts = state.customFonts.includes(name) ? state.customFonts : [...state.customFonts, name];
      if (state.activeSlot === "heading") onUpdate({ headingFont: name, customFonts: nextCustomFonts });
      else onUpdate({ bodyFont: name, customFonts: nextCustomFonts });
      onLoadFont(name);
    };
    reader.readAsDataURL(file);
  };

  const applyTheme = (theme: Theme) => {
    onUpdate({ theme });
  };

  const applyCurated = (heading: string, body: string) => {
    onLoadFont(heading);
    onLoadFont(body);
    onUpdate({ headingFont: heading, bodyFont: body });
  };

  const applyIdentifiedFont = (name: string) => {
    onLoadFont(name);
    if (state.activeSlot === "heading") onUpdate({ headingFont: name });
    else onUpdate({ bodyFont: name });
  };

  const runIdentifier = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setIdentifyError("Please upload an image file.");
      return;
    }
    setIdentifyLoading(true);
    setIdentifyError(null);
    try {
      const result = await identifyFontsFromImage(file);
      setIdentifyResult(result);
    } catch (error) {
      setIdentifyResult(null);
      setIdentifyError(error instanceof Error ? error.message : "Unable to identify font.");
    } finally {
      setIdentifyLoading(false);
    }
  };

  const onIdentifyDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    setDraggingIdentify(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await runIdentifier(file);
  };

  const onIdentifyDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDraggingIdentify(true);
  };

  const onIdentifyDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDraggingIdentify(false);
  };

  const onIdentifyUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (file) await runIdentifier(file);
    e.target.value = "";
  };

  const getFontMeta = (name: string) => {
    const f = fontCatalog.find((x) => x.name === name);
    if (!f) return "Custom";
    const source = f.category.startsWith("System") ? "System" : f.category === "Custom" ? "Custom" : "Google Fonts";
    return `${f.category} · ${source}`;
  };

  const getWeight = (slot: "heading" | "body") => {
    return slot === "heading" ? state.headingWeight : state.bodyWeight;
  };

  const getItalic = (slot: "heading" | "body") => {
    return slot === "heading" ? state.headingItalic : state.bodyItalic;
  };

  const toggleBold = (slot: "heading" | "body") => {
    const isBold = getWeight(slot) >= 700;
    if (slot === "heading") onUpdate({ headingWeight: isBold ? 400 : 700 });
    else onUpdate({ bodyWeight: isBold ? 400 : 700 });
  };

  const toggleItalic = (slot: "heading" | "body") => {
    if (slot === "heading") onUpdate({ headingItalic: !state.headingItalic });
    else onUpdate({ bodyItalic: !state.bodyItalic });
  };

  return (
    <div className="sidebar">
      {/* Font Slots */}
      <div className="sidebar-section">
        <div className="section-label">
          <span>Font Pairing</span>
          <span style={{ color: "var(--accent)", fontSize: 9 }}>SLOT</span>
        </div>
        <div
          className={`font-slot ${state.activeSlot === "heading" ? "active" : ""}`}
          onClick={() => onUpdate({ activeSlot: "heading" })}
        >
          <div className="font-slot-role">Heading</div>
          <div className="font-slot-name">{state.headingFont}</div>
          <div className="font-slot-meta">{getFontMeta(state.headingFont)}</div>
          <div className="slot-style-row">
            <button
              type="button"
              className={`slot-style-btn ${state.headingWeight >= 700 ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleBold("heading");
              }}
            >
              Bold
            </button>
            <button
              type="button"
              className={`slot-style-btn ${state.headingItalic ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleItalic("heading");
              }}
            >
              Italic
            </button>
          </div>
        </div>
        <div className="between-fonts">paired with</div>
        <div
          className={`font-slot ${state.activeSlot === "body" ? "active" : ""}`}
          onClick={() => onUpdate({ activeSlot: "body" })}
        >
          <div className="font-slot-role">Body</div>
          <div className="font-slot-name">{state.bodyFont}</div>
          <div className="font-slot-meta">{getFontMeta(state.bodyFont)}</div>
          <div className="slot-style-row">
            <button
              type="button"
              className={`slot-style-btn ${state.bodyWeight >= 700 ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleBold("body");
              }}
            >
              Bold
            </button>
            <button
              type="button"
              className={`slot-style-btn ${state.bodyItalic ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleItalic("body");
              }}
            >
              Italic
            </button>
          </div>
        </div>
        <button className="random-btn" onClick={handleRandom}>↺ Random Pairing</button>
      </div>

      {/* Font Picker */}
      <div className="sidebar-section">
        <div className="section-label">
          <span>Select {state.activeSlot === "heading" ? "Heading" : "Body"} Font</span>
        </div>
        <input
          type="text"
          className="font-search"
          placeholder="Search fonts..."
          value={fontQuery}
          onChange={(e) => setFontQuery(e.target.value)}
        />
        <div className="font-list">
          {filteredFonts.map((f) => {
            const isSelected = state.activeSlot === "heading" ? f.name === state.headingFont : f.name === state.bodyFont;
            return (
              <div
                key={f.name}
                className={`font-list-item ${isSelected ? "selected" : ""}`}
                onClick={() => selectFont(f.name)}
              >
                <span className="font-list-item-name">{f.name}</span>
                <span className="font-list-item-tag">{f.category}</span>
              </div>
            );
          })}
        </div>
        <label className="upload-zone">
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleCustomFont} />
          ↑ Upload Custom Font (.ttf, .otf, .woff)
        </label>
      </div>

      {/* Typography Controls */}
      <div className="sidebar-section">
        <div className="section-label">Typography Scale</div>
        {[
          { label: "Heading Size", id: "headingSize", min: 24, max: 96, step: 1, unit: "px", key: "headingSize" as const },
          { label: "Body Size", id: "bodySize", min: 12, max: 24, step: 1, unit: "px", key: "bodySize" as const },
          { label: "Letter Spacing", id: "headingSpacing", min: -3, max: 10, step: 0.5, unit: "px", key: "headingSpacing" as const },
          { label: "Line Height", id: "lineHeight", min: 1, max: 2.5, step: 0.05, unit: "", key: "lineHeight" as const },
        ].map(({ label, min, max, step, unit, key }) => (
          <div className="slider-row" key={key}>
            <div className="slider-label">
              <span>{label}</span>
              <span className="slider-value">{state[key]}{unit}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={state[key]}
              onChange={(e) => onUpdate({ [key]: +e.target.value } as Partial<TypographyState>)}
            />
          </div>
        ))}
      </div>

      {/* Color Themes */}
      <div className="sidebar-section">
        <div className="section-label">Color Theme</div>
        <div className="theme-grid">
          {THEMES.map((t, i) => (
            <div
              key={t.name}
              className={`theme-chip ${state.theme.name === t.name ? "active" : ""}`}
              style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }}
              title={t.name}
              onClick={() => applyTheme(t)}
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="section-label section-label-sm">Custom Colors</div>
          <div className="custom-colors-grid">
            {(["bg", "text", "accent", "secondary"] as const).map((key) => (
              <div key={key}>
                <div className="color-input-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <input
                  type="color"
                  value={state.theme[key]}
                  onChange={(e) =>
                    onUpdate({ theme: { ...state.theme, [key]: e.target.value, name: "Custom" } })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Curated Pairings */}
      <div className="sidebar-section">
        <div className="section-label">Curated Pairings</div>
        <div className="curated-grid">
          {CURATED_PAIRINGS.map((p) => (
            <div
              key={p.label}
              className="curated-card"
              onClick={() => applyCurated(p.heading, p.body)}
            >
              <div className="curated-heading" style={{ fontFamily: `'${p.heading}', serif` }}>
                {p.label}
              </div>
              <div className="curated-body-text" style={{ fontFamily: `'${p.body}', sans-serif` }}>
                Quick brown fox
              </div>
              <div className="curated-names">
                <span className="curated-pill">{p.heading.split(" ")[0]}</span>
                <span className="curated-pill">{p.body.split(" ")[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">Identify Font</div>
        <div
          className={`font-identify-zone ${draggingIdentify ? "dragging" : ""}`}
          onDrop={onIdentifyDrop}
          onDragOver={onIdentifyDragOver}
          onDragLeave={onIdentifyDragLeave}
          onClick={() => identifyInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") identifyInputRef.current?.click();
          }}
        >
          <input
            ref={identifyInputRef}
            type="file"
            accept="image/*"
            onChange={onIdentifyUpload}
            style={{ display: "none" }}
          />
          <div className="font-identify-title">Drop image here or click to upload</div>
          <div className="font-identify-hint">Best results with high-contrast text lines</div>
        </div>

        {identifyLoading && <div className="font-identify-status">Identifying font...</div>}
        {identifyError && <div className="font-identify-error">{identifyError}</div>}
        {identifyResult && (
          <div className="font-identify-results">
            <div className="font-identify-text">Detected text: {identifyResult.extractedText}</div>
            {identifyResult.matches.map((match) => (
              <button
                key={match.fontName}
                type="button"
                className="font-identify-result"
                onClick={() => applyIdentifiedFont(match.fontName)}
              >
                <span style={{ fontFamily: `'${match.fontName}', serif` }}>{match.fontName}</span>
                <span>{match.confidence}%</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-label">Quality Checks</div>
        <div style={{ display: "grid", gap: 8 }}>
          <span className="contrast-badge">
            <span className={`contrast-dot ${quality.contrastClass}`} />
            <span>{quality.contrastLabel}</span>
          </span>
          <span className="contrast-badge">
            <span className={`contrast-dot ${quality.scaleClass}`} />
            <span>{quality.scaleLabel}</span>
          </span>
          {quality.warnings.length === 0 && (
            <span className="contrast-badge">
              <span className="contrast-dot contrast-pass" />
              <span>Font coverage OK</span>
            </span>
          )}
          {quality.warnings.map((warning) => (
            <span className="contrast-badge" key={warning}>
              <span className="contrast-dot contrast-warn" />
              <span>{warning}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
