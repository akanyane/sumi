"use client";

import { useSyncExternalStore } from "react";

export type Settings = {
  kanjiFont: "mincho" | "gothic" | "brush";
  romaji: boolean;
  motionSpeed: number;
  reducedMotion: boolean;
  dailyGoal: number;
  newPerDay: number;
  /** learn hiragana and katakana before the Jōyō path */
  kanaFirst: boolean;
  density: "compact" | "comfortable" | "ficha";
  ghostGuide: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  kanjiFont: "mincho",
  romaji: true,
  motionSpeed: 1,
  reducedMotion: false,
  dailyGoal: 20,
  newPerDay: 5,
  kanaFirst: false,
  density: "comfortable",
  ghostGuide: true,
};

const KEY = "sumi:settings";
const listeners = new Set<() => void>();
let cache: Settings | null = null;

function read(): Settings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    cache = { ...DEFAULT_SETTINGS };
  }
  return cache as Settings;
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return read();
}

export function setSettings(patch: Partial<Settings>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage may be unavailable (private mode); settings then live for this tab only
  }
  applySettingsToDocument(cache);
  for (const l of listeners) l();
}

export function replaceSettings(next: Partial<Settings>) {
  cache = null;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...next }));
  } catch {}
  setSettings({});
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    applySettingsToDocument(read());
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

export function applySettingsToDocument(s: Settings) {
  const el = document.documentElement;
  el.dataset.kanjiFont = s.kanjiFont;
  if (s.reducedMotion) el.dataset.motion = "reduced";
  else delete el.dataset.motion;
}

/** Inline script for <head>: applies font/motion before first paint. */
export const settingsBootScript = `try{var s=JSON.parse(localStorage.getItem("${KEY}")||"{}");var e=document.documentElement;if(s.kanjiFont)e.dataset.kanjiFont=s.kanjiFont;if(s.reducedMotion)e.dataset.motion="reduced"}catch(_){}`;
