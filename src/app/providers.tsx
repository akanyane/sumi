"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { applySettingsToDocument, getSettings } from "@/lib/settings";
import { PaletteProvider } from "@/ui/command-palette";
import { ToastProvider } from "@/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 2 } },
      }),
  );
  useEffect(() => applySettingsToDocument(getSettings()), []);
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider>
          <PaletteProvider>{children}</PaletteProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
