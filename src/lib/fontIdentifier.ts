import { ALL_FONTS, SYSTEM_FONTS } from "@/lib/data";

type OCRLine = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FontMatch = {
  fontName: string;
  score: number;
  confidence: number;
};

export type FontIdentificationResult = {
  extractedText: string;
  matches: FontMatch[];
};

type MaybeTextDetector = {
  detect: (image: CanvasImageSource) => Promise<Array<{ rawValue?: string; boundingBox?: DOMRectReadOnly }>>;
};

type WindowWithTextDetector = Window & {
  TextDetector?: new () => MaybeTextDetector;
};

const CANVAS_W = 500;
const CANVAS_H = 260;
const MAX_CANDIDATES = 64;
const loadedFontLinks = new Set<string>();

export async function identifyFontsFromImage(file: File): Promise<FontIdentificationResult> {
  const image = await fileToImage(file);
  const lines = await detectTextLines(image);
  if (lines.length === 0) {
    throw new Error("No readable text found. Try a clearer image with larger text.");
  }

  const bestLine = lines
    .filter((line) => line.text.trim().length > 1)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];

  if (!bestLine) {
    throw new Error("No suitable text block found.");
  }

  const sampleText = normalizeOCRText(bestLine.text);
  const crop = renderLineCrop(image, bestLine);
  const candidates = buildCandidates();
  await preloadFonts(candidates);
  const matches = rankFontCandidates(crop, sampleText, candidates).slice(0, 6);

  return { extractedText: sampleText, matches };
}

async function detectTextLines(image: HTMLImageElement): Promise<OCRLine[]> {
  if (typeof window === "undefined") return [];
  const w = window as WindowWithTextDetector;
  if (!w.TextDetector) {
    throw new Error("Font detection needs a Chromium browser with Text Detector support.");
  }

  const detector = new w.TextDetector();
  const blocks = await detector.detect(image);

  return blocks
    .map((block) => {
      const box = block.boundingBox;
      return {
        text: (block.rawValue || "").trim(),
        x: box?.x || 0,
        y: box?.y || 0,
        width: box?.width || 0,
        height: box?.height || 0,
      };
    })
    .filter((line) => line.text.length > 0 && line.width > 0 && line.height > 0);
}

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unable to decode image"));
      img.onload = () => resolve(img);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function normalizeOCRText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 80);
}

function buildCandidates() {
  const categoryPriority = [
    "System Serif",
    "System Sans",
    "Serif",
    "Sans-Serif",
    "Display",
    "System Mono",
    "Monospace",
    "Handwriting",
  ];

  return [...ALL_FONTS]
    .sort((a, b) => categoryPriority.indexOf(a.category) - categoryPriority.indexOf(b.category))
    .slice(0, MAX_CANDIDATES)
    .map((font) => font.name);
}

async function preloadFonts(fonts: string[]) {
  await Promise.all(
    fonts.map(async (fontName) => {
      if (isSystemFont(fontName)) {
        await document.fonts.load(`400 32px "${fontName}"`);
        return;
      }

      if (!loadedFontLinks.has(fontName)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;700&display=swap`;
        document.head.appendChild(link);
        loadedFontLinks.add(fontName);
      }

      try {
        await document.fonts.load(`400 32px "${fontName}"`);
      } catch {
        // Best effort preload; matching still runs with fallbacks.
      }
    }),
  );
}

function isSystemFont(name: string) {
  return SYSTEM_FONTS.some((font) => font.name === name);
}

function renderLineCrop(image: HTMLImageElement, line: OCRLine) {
  const padding = Math.max(8, Math.round(line.height * 0.35));
  const sx = Math.max(0, Math.floor(line.x - padding));
  const sy = Math.max(0, Math.floor(line.y - padding));
  const sw = Math.min(image.width - sx, Math.ceil(line.width + padding * 2));
  const sh = Math.min(image.height - sy, Math.ceil(line.height + padding * 2));

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(canvas.width / sw, canvas.height / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (canvas.width - dw) / 2;
  const dy = (canvas.height - dh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  return canvas;
}

function rankFontCandidates(sourceCanvas: HTMLCanvasElement, text: string, fonts: string[]): FontMatch[] {
  const source = getBinarizedPixels(sourceCanvas);
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const scored = fonts.map((fontName) => {
    const rendered = renderTextCandidate(text, fontName, width, height);
    const target = getBinarizedPixels(rendered);
    const score = mse(source, target);
    return { fontName, score, confidence: scoreToConfidence(score) };
  });

  return scored.sort((a, b) => a.score - b.score);
}

function renderTextCandidate(text: string, fontName: string, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = Math.floor(height * 0.5);
  for (; fontSize >= 14; fontSize -= 2) {
    ctx.font = `${fontSize}px '${fontName}', serif`;
    if (ctx.measureText(text).width <= width * 0.92) break;
  }

  ctx.font = `${fontSize}px '${fontName}', serif`;
  ctx.fillText(text, width / 2, height / 2);
  return canvas;
}

function getBinarizedPixels(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const out = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    out[p] = luminance < 180 ? 1 : 0;
  }
  return out;
}

function mse(a: Uint8Array, b: Uint8Array) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum / len;
}

function scoreToConfidence(score: number) {
  return Math.max(0, Math.min(100, Math.round((1 - score) * 100)));
}
