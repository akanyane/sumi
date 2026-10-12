"use client";

import { ThemeProvider, type ThemeProviderProps, useTheme } from "next-themes";

export type ColorMode = "light" | "dark";

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const colorMode = resolvedTheme as ColorMode | undefined;
  const toggleColorMode = () =>
    setTheme(colorMode === "dark" ? "light" : "dark");
  return { colorMode, setColorMode: setTheme, toggleColorMode };
}
