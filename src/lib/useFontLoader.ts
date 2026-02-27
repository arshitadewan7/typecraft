"use client";
import { useCallback, useRef } from "react";
import { SYSTEM_FONTS } from "@/lib/data";

export function useFontLoader() {
  const loadedFonts = useRef<Set<string>>(new Set());

  const loadFont = useCallback((name: string) => {
    if (loadedFonts.current.has(name)) return;
    const isSystem = SYSTEM_FONTS.find((f) => f.name === name);
    if (isSystem || name.startsWith("Custom:")) {
      loadedFonts.current.add(name);
      return;
    }
    loadedFonts.current.add(name);
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700;900&display=swap`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }, []);

  return { loadFont };
}
