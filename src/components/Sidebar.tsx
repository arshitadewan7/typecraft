"use client";
import { useState, useMemo } from "react";
import { ALL_FONTS, CURATED_PAIRINGS, THEMES, type Theme } from "@/lib/data";
import type { TypographyState } from "@/lib/useTypecraftStore";

interface SidebarProps {
  state: TypographyState;
  onUpdate: (patch: Partial<TypographyState>) => void;
  onRandomPairing: () => { headingFont: string; bodyFont: string };
  onLoadFont: (name: string) => void;
}

export default function Sidebar({ state, onUpdate, onRandomPairing, onLoadFont }: SidebarProps) {
  const [fontQuery, setFontQuery] = useState("");

  const filteredFonts = useMemo(() => {
    const q = fontQuery.toLowerCase();
    return ALL_FONTS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 50);
  }, [fontQuery]);

  const selectFont = (name: string) => {
    onLoadFont(name);
    if (state.activeSlot === "heading") onUpdate({ headingFont: name });
    else onUpdate({ bodyFont: name });
  };

  const handleRandom = () => {
    const { headingFont, bodyFont } = onRandomPairing();
    onLoadFont(headingFont);
    onLoadFont(bodyFont);
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
      if (state.activeSlot === "heading") onUpdate({ headingFont: name });
      else onUpdate({ bodyFont: name });
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

  const getFontMeta = (name: string) => {
    const f = ALL_FONTS.find((x) => x.name === name);
    if (!f) return "Custom";
    const source = f.category.startsWith("System") ? "System" : f.category === "Custom" ? "Custom" : "Google Fonts";
    return `${f.category} · ${source}`;
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
        </div>
        <div className="between-fonts">paired with</div>
        <div
          className={`font-slot ${state.activeSlot === "body" ? "active" : ""}`}
          onClick={() => onUpdate({ activeSlot: "body" })}
        >
          <div className="font-slot-role">Body</div>
          <div className="font-slot-name">{state.bodyFont}</div>
          <div className="font-slot-meta">{getFontMeta(state.bodyFont)}</div>
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
        <div style={{ marginTop: 6 }}>
          <div className="section-label section-label-sm">Heading Weight</div>
          <div className="toggle-row">
            {[400, 600, 700, 900].map((w) => (
              <div
                key={w}
                className={`toggle-option ${state.headingWeight === w ? "active" : ""}`}
                onClick={() => onUpdate({ headingWeight: w })}
              >
                {w === 400 ? "Reg" : w === 600 ? "Semi" : w === 700 ? "Bold" : "Black"}
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
}
