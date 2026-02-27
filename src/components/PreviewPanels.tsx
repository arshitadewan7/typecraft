"use client";
import { useState } from "react";
import { COLOR_COMBOS } from "@/lib/data";
import type { TypographyState } from "@/lib/useTypecraftStore";

type PanelProps = { state: TypographyState };

// =====================
// SPECIMEN PANEL
// =====================
export function SpecimenPanel({ state }: PanelProps) {
  const hf = `'${state.headingFont}', serif`;
  const bf = `'${state.bodyFont}', sans-serif`;
  const { bg, text } = state.theme;

  return (
    <div>
      <div className="specimen-block fade-in">
        <div className="specimen-header">
          <span>DISPLAY — HEADING FONT</span>
          <span>{state.headingFont}</span>
        </div>
        <div className="specimen-body" style={{ background: bg, color: text }}>
          <div style={{ fontFamily: hf, fontSize: state.headingSize, fontWeight: state.headingWeight, letterSpacing: state.headingSpacing, lineHeight: 1.1, marginBottom: 20 }}>
            The Art of Perfect Typography
          </div>
          <div style={{ fontFamily: hf, fontSize: 28, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>
            Every letter tells a story worth reading
          </div>
          <div style={{ fontFamily: hf, fontSize: 64, fontWeight: 900, letterSpacing: -2, opacity: 0.15, lineHeight: 1 }}>
            Aa Bb Cc
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
              AaBbCcDdEeFfGgHhIiJjKk 0123456789
            </span>
          </div>
        </div>
      </div>

      <div className="specimen-block fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="specimen-header">
          <span>BODY — PARAGRAPH FONT</span>
          <span>{state.bodyFont}</span>
        </div>
        <div className="specimen-body" style={{ background: bg, color: text }}>
          <div style={{ fontFamily: bf, fontSize: state.bodySize, lineHeight: state.lineHeight, marginBottom: 12 }}>
            Great typography is invisible. It serves the reader without calling attention to itself — each letterform chosen not for novelty, but for clarity. The right pairing of a display font with a workhorse body creates harmony between personality and function.
          </div>
          <div style={{ fontFamily: bf, fontSize: 12, lineHeight: 1.6, opacity: 0.6, fontStyle: "italic" }}>
            Caption text at 12px — Perfect for footnotes, labels, and supporting information.
          </div>
        </div>
      </div>

      <div className="specimen-block fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="specimen-header">
          <span>PAIRING IN CONTEXT</span>
        </div>
        <div className="specimen-body" style={{ background: bg, color: text }}>
          <div style={{ fontFamily: hf, fontSize: 36, fontWeight: state.headingWeight, marginBottom: 8 }}>
            Design Systems for Modern Brands
          </div>
          <div style={{ fontFamily: bf, fontSize: 14, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 20 }}>
            Visual Language · Brand Identity
          </div>
          <div style={{ fontFamily: bf, fontSize: 15, lineHeight: state.lineHeight, maxWidth: 620 }}>
            A well-crafted design system is the foundation of any enduring brand. It establishes a shared visual language — consistent use of type, color, and space — that allows teams to communicate with clarity, move with speed, and maintain coherence across every touchpoint.
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// LANDING PANEL
// =====================
export function LandingPanel({ state }: PanelProps) {
  const hf = `'${state.headingFont}', serif`;
  const bf = `'${state.bodyFont}', sans-serif`;
  const { bg, text, accent } = state.theme;

  return (
    <div className="landing-mock fade-in">
      <div className="mock-browser-bar">
        <div className="mock-dot" style={{ background: "#e05c5c" }} />
        <div className="mock-dot" style={{ background: "#e0b45c" }} />
        <div className="mock-dot" style={{ background: "#5ce0a0" }} />
        <div style={{ flex: 1, marginLeft: 12, background: "var(--surface2)", borderRadius: 4, height: 20, maxWidth: 320 }} />
      </div>
      <div style={{ background: bg, color: text }}>
        <div className="mock-nav">
          <div className="mock-nav-logo" style={{ fontFamily: hf }}>Luminary</div>
          <div className="mock-nav-links" style={{ fontFamily: bf }}>
            <span>About</span><span>Work</span><span>Pricing</span><span>Contact</span>
          </div>
        </div>
        <div className="mock-hero">
          <div className="mock-hero-tag" style={{ fontFamily: bf }}>Design Studio</div>
          <div className="mock-hero-title" style={{ fontFamily: hf, fontSize: Math.min(state.headingSize * 0.9, 56), fontWeight: state.headingWeight, letterSpacing: state.headingSpacing }}>
            We craft brands<br />that endure.
          </div>
          <div className="mock-hero-sub" style={{ fontFamily: bf, fontSize: state.bodySize }}>
            Strategic design for ambitious companies. We partner with founders and teams who believe in the power of beautiful, intentional work.
          </div>
          <button className="mock-cta" style={{ background: accent, color: bg, fontFamily: bf }}>
            Start a Project →
          </button>
        </div>
        <div className="mock-features">
          {[
            { icon: "◈", title: "Brand Identity", text: "Complete visual systems built for longevity and adaptability." },
            { icon: "◉", title: "Digital Design", text: "Web and app experiences that convert visitors into customers." },
            { icon: "◎", title: "Typography", text: "Custom type systems that give your brand a distinctive voice." },
          ].map((feat) => (
            <div className="mock-feature" key={feat.title}>
              <div className="mock-feature-icon">{feat.icon}</div>
              <div className="mock-feature-title" style={{ fontFamily: hf }}>{feat.title}</div>
              <div className="mock-feature-text" style={{ fontFamily: bf }}>{feat.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================
// CARD PANEL
// =====================
export function CardPanel({ state }: PanelProps) {
  const hf = `'${state.headingFont}', serif`;
  const bf = `'${state.bodyFont}', sans-serif`;
  const { bg, text, accent } = state.theme;

  const [cardName, setCardName] = useState("Alexandra Chen");
  const [cardTitle, setCardTitle] = useState("Creative Director");
  const [cardBrand, setCardBrand] = useState("Luminary");
  const [cardEmail, setCardEmail] = useState("hello@luminary.co");

  return (
    <div>
      <div className="card-showcase fade-in">
        <div className="business-card" style={{ background: bg, color: text, border: `2px solid ${accent}30` }}>
          <div>
            <div className="card-name" style={{ fontFamily: hf, fontWeight: state.headingWeight }}>{cardName}</div>
            <div className="card-title" style={{ fontFamily: bf }}>{cardTitle}</div>
          </div>
          <div className="card-contact" style={{ fontFamily: bf }}>
            {cardEmail}<br />+1 (415) 000 1234<br />luminary.co
          </div>
        </div>
        <div className="business-card" style={{ background: accent, color: bg, alignItems: "flex-end", justifyContent: "flex-end" }}>
          <div className="card-brand" style={{ fontFamily: hf, fontWeight: state.headingWeight }}>{cardBrand}</div>
        </div>
      </div>

      <div className="card-edit-panel">
        <div className="section-label">Customize Card Text</div>
        <div className="card-edit-grid">
          {[
            { label: "Name", value: cardName, setter: setCardName },
            { label: "Title", value: cardTitle, setter: setCardTitle },
            { label: "Brand", value: cardBrand, setter: setCardBrand },
            { label: "Email", value: cardEmail, setter: setCardEmail },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <div className="card-edit-label">{label}</div>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="font-search"
                style={{ fontSize: 13 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================
// COMBOS PANEL
// =====================
export function CombosPanel({ state }: PanelProps) {
  const hf = `'${state.headingFont}', serif`;
  const bf = `'${state.bodyFont}', sans-serif`;

  return (
    <div className="color-grid fade-in">
      {COLOR_COMBOS.map((c) => (
        <div className="color-combo" key={c.label}>
          <div className="color-combo-preview" style={{ background: c.bg, color: c.text }}>
            <div style={{ fontFamily: hf, fontSize: Math.min(state.headingSize * 0.6, 32), fontWeight: state.headingWeight, letterSpacing: state.headingSpacing, marginBottom: 8 }}>
              Design Studio
            </div>
            <div style={{ fontFamily: bf, fontSize: state.bodySize, lineHeight: state.lineHeight, opacity: 0.75 }}>
              Crafting beautiful experiences for ambitious brands.
            </div>
            <div style={{ display: "inline-block", marginTop: 12, background: c.accent, color: c.bg, padding: "6px 16px", borderRadius: 4, fontFamily: bf, fontSize: 12, fontWeight: 600 }}>
              Get Started
            </div>
          </div>
          <div className="color-combo-label">
            <span>{c.label}</span>
            <div className="swatches">
              <span className="color-swatch" style={{ background: c.bg, border: "1px solid rgba(255,255,255,0.1)" }} />
              <span className="color-swatch" style={{ background: c.text }} />
              <span className="color-swatch" style={{ background: c.accent }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
