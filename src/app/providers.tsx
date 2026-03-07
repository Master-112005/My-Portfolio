"use client";

import type { PropsWithChildren } from "react";

import { EditModeProvider } from "@/admin/EditMode";
import { SiteDataProvider } from "@/lib/site-context";
import { ThemeProvider } from "@/lib/theme-context";

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SiteDataProvider>
        <EditModeProvider>{children}</EditModeProvider>
      </SiteDataProvider>
    </ThemeProvider>
  );
}
