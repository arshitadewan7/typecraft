"use client";
import { useState, useCallback } from "react";
import { THEMES, ALL_FONTS, type Theme } from "@/lib/data";

export type TypographyState = {
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  headingSpacing: number;
  lineHeight: number;
  headingWeight: number;
  theme: Theme;
  activeSlot: "heading" | "body";
  currentView: "specimen" | "landing" | "card" | "combos";
  customFonts: string[];
};

const initialState: TypographyState = {
  headingFont: "Playfair Display",
  bodyFont: "DM Sans",
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

export function useTypecraftStore() {
  const [state, setState] = useState<TypographyState>(initialState);

  const update = useCallback((patch: Partial<TypographyState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const randomPairing = useCallback(() => {
    const headings = ALL_FONTS.filter((f) =>
      ["Serif", "Display", "Handwriting"].includes(f.category)
    );
    const bodies = ALL_FONTS.filter((f) =>
      ["Sans-Serif", "Serif", "Monospace"].includes(f.category)
    );
    const h = headings[Math.floor(Math.random() * headings.length)];
    const b = bodies[Math.floor(Math.random() * bodies.length)];
    setState((prev) => ({ ...prev, headingFont: h.name, bodyFont: b.name }));
    return { headingFont: h.name, bodyFont: b.name };
  }, []);

  return { state, update, randomPairing };
}
